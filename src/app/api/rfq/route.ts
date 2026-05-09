import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";
import { generateRFQNumber } from "@/lib/doc-numbers";
import { buildRFQEmail, generateAccessToken, sendEmail } from "@/lib/email";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  if (
    !hasAnyRole(session.user.siteRoles, [
      "HEAD_OF_PROCUREMENT",
      "PROCUREMENT_TEAM_MEMBER",
    ])
  ) {
    return forbidden();
  }

  const where: Record<string, unknown> = {};
  const roles = session.user.siteRoles.map((sr) => sr.role);
  if (roles.includes("PROCUREMENT_TEAM_MEMBER") && !roles.includes("HEAD_OF_PROCUREMENT")) {
    where.createdById = session.user.id;
  }

  const rfqs = await prisma.rFQ.findMany({
    where: where as any,
    include: {
      indent: { select: { id: true, indentNumber: true, site: { select: { name: true } } } },
      createdBy: { select: { id: true, name: true } },
      vendors: { include: { vendor: { select: { id: true, name: true } } } },
      _count: { select: { quotes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(rfqs);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (
    !hasAnyRole(session.user.siteRoles, [
      "HEAD_OF_PROCUREMENT",
      "PROCUREMENT_TEAM_MEMBER",
    ])
  ) {
    return forbidden();
  }

  const body = await request.json();
  const { indentId, vendorIds, dueDate, remarks, itemIds } = body;

  if (!indentId) return badRequest("Indent is required");
  if (!vendorIds || vendorIds.length === 0) return badRequest("At least one vendor is required");

  const indent = await prisma.materialIndent.findUnique({
    where: { id: indentId },
    include: { items: true },
  });

  if (!indent) return badRequest("Indent not found");
  if (indent.status !== "ASSIGNED" && indent.status !== "RFQ_SENT") {
    return badRequest("Indent must be assigned before creating RFQ");
  }

  const itemsForRfq = Array.isArray(itemIds) && itemIds.length > 0
    ? indent.items.filter((it) => itemIds.includes(it.id))
    : indent.items;

  if (itemsForRfq.length === 0) {
    return badRequest("At least one item is required");
  }

  const rfq = await prisma.$transaction(async (tx) => {
    const rfqNumber = await generateRFQNumber(tx);

    const newRfq = await tx.rFQ.create({
      data: {
        rfqNumber,
        indentId,
        createdById: session.user.id,
        status: "SENT",
        dueDate: dueDate ? new Date(dueDate) : null,
        remarks,
        items: {
          create: itemsForRfq.map((item) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
        vendors: {
          create: vendorIds.map((vendorId: string) => ({
            vendorId,
            accessToken: generateAccessToken(),
          })),
        },
      },
      include: {
        items: { include: { material: true } },
        vendors: { include: { vendor: true } },
      },
    });

    await tx.materialIndent.update({
      where: { id: indentId },
      data: { status: "RFQ_SENT" },
    });

    return newRfq;
  });

  const emailMessages = rfq.vendors.map((rv) =>
    buildRFQEmail(
      {
        vendorName: rv.vendor.name,
        vendorEmail: rv.vendor.email,
        accessToken: rv.accessToken,
      },
      {
        rfqNumber: rfq.rfqNumber,
        dueDate: rfq.dueDate,
        remarks: rfq.remarks,
        items: rfq.items.map((item) => ({
          materialName: item.material.name,
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
      }
    )
  );

  const emailedAt = new Date();
  for (const msg of emailMessages) {
    await sendEmail(msg);
  }
  await prisma.rFQVendor.updateMany({
    where: { rfqId: rfq.id },
    data: { emailedAt, sentAt: emailedAt, sentVia: "EMAIL" },
  });

  return created(rfq);
}

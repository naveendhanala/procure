import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";
import { generateRFQNumber } from "@/lib/doc-numbers";

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
  const { indentId, vendorIds, dueDate, remarks } = body;

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

  const rfq = await prisma.$transaction(async (tx) => {
    const rfqNumber = await generateRFQNumber(tx);

    const created = await tx.rFQ.create({
      data: {
        rfqNumber,
        indentId,
        createdById: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        remarks,
        items: {
          create: indent.items.map((item) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
        vendors: {
          create: vendorIds.map((vendorId: string) => ({ vendorId })),
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

    return created;
  });

  return created(rfq);
}

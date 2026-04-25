import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";

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

  const quotes = await prisma.vendorQuote.findMany({
    include: {
      rfq: { select: { id: true, rfqNumber: true } },
      vendor: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(quotes);
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
  const { rfqId, vendorId, quoteNumber, items, validUntil, remarks } = body;

  if (!rfqId || !vendorId || !items || items.length === 0) {
    return badRequest("RFQ, vendor, and items are required");
  }

  const totalAmount = items.reduce(
    (sum: number, item: any) => sum + Number(item.totalPrice),
    0
  );

  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.vendorQuote.create({
      data: {
        rfqId,
        vendorId,
        quoteNumber,
        status: "RECEIVED",
        totalAmount,
        validUntil: validUntil ? new Date(validUntil) : null,
        remarks,
        receivedAt: new Date(),
        items: {
          create: items.map((item: any) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            gstPercent: item.gstPercent || null,
            totalPrice: item.totalPrice,
            remarks: item.remarks,
          })),
        },
      },
      include: {
        items: { include: { material: true } },
        vendor: true,
      },
    });

    await tx.rFQ.update({
      where: { id: rfqId },
      data: { status: "QUOTES_RECEIVED" },
    });

    const rfq = await tx.rFQ.findUnique({ where: { id: rfqId } });
    if (rfq) {
      await tx.materialIndent.update({
        where: { id: rfq.indentId },
        data: { status: "QUOTES_RECEIVED" },
      });
    }

    return created;
  });

  return created(quote);
}

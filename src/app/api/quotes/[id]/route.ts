import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, success } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

  const quote = await prisma.vendorQuote.findUnique({
    where: { id: params.id },
    include: {
      rfq: { select: { id: true, rfqNumber: true } },
      vendor: true,
      items: { include: { material: true } },
    },
  });

  if (!quote) return notFound("Quote");
  return success(quote);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
  const { items, quoteNumber, validUntil, remarks, status } = body;

  if (Array.isArray(items)) {
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + Number(item.totalPrice),
      0
    );

    const updated = await prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: params.id } });
      await tx.quoteItem.createMany({
        data: items.map((it: any) => ({
          quoteId: params.id,
          materialId: it.materialId,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          gstPercent:
            it.gstPercent !== undefined && it.gstPercent !== null && it.gstPercent !== ""
              ? Number(it.gstPercent)
              : null,
          totalPrice: it.totalPrice,
          remarks: it.remarks ?? null,
        })),
      });
      return tx.vendorQuote.update({
        where: { id: params.id },
        data: {
          totalAmount,
          ...(quoteNumber !== undefined && { quoteNumber }),
          ...(validUntil !== undefined && {
            validUntil: validUntil ? new Date(validUntil) : null,
          }),
          ...(remarks !== undefined && { remarks }),
          ...(status !== undefined && { status }),
        },
        include: { items: { include: { material: true } } },
      });
    });

    return success(updated);
  }

  const quote = await prisma.vendorQuote.update({
    where: { id: params.id },
    data: {
      ...(quoteNumber !== undefined && { quoteNumber }),
      ...(validUntil !== undefined && {
        validUntil: validUntil ? new Date(validUntil) : null,
      }),
      ...(remarks !== undefined && { remarks }),
      ...(status !== undefined && { status }),
    },
  });

  return success(quote);
}

import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";
import { generatePONumber } from "@/lib/doc-numbers";

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

  const pos = await prisma.purchaseOrder.findMany({
    include: {
      indent: {
        select: {
          id: true,
          indentNumber: true,
          site: { select: { name: true, code: true } },
        },
      },
      vendor: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { items: true, goodsReceipts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(pos);
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
  const {
    indentId,
    vendorId,
    items,
    deliveryDate,
    deliveryAddress,
    termsAndConditions,
    remarks,
  } = body;

  if (!indentId || !vendorId || !items || items.length === 0) {
    return badRequest("Indent, vendor, and items are required");
  }

  const totalAmount = items.reduce(
    (sum: number, item: any) => sum + Number(item.totalPrice),
    0
  );
  const gstAmount = items.reduce(
    (sum: number, item: any) =>
      sum +
      (item.gstPercent
        ? (Number(item.totalPrice) * Number(item.gstPercent)) / 100
        : 0),
    0
  );

  const po = await prisma.$transaction(async (tx) => {
    const poNumber = await generatePONumber(tx);

    const newPO = await tx.purchaseOrder.create({
      data: {
        poNumber,
        indentId,
        vendorId,
        createdById: session.user.id,
        status: "PENDING_APPROVAL",
        totalAmount,
        gstAmount: gstAmount || null,
        grandTotal: totalAmount + gstAmount,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryAddress,
        termsAndConditions,
        remarks,
        items: {
          create: items.map((item: any) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            gstPercent: item.gstPercent || null,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        items: { include: { material: true } },
        vendor: true,
      },
    });

    return newPO;
  });

  return created(po);
}

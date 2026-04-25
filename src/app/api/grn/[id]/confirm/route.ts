import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, success } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasAnyRole(session.user.siteRoles, ["STORE_MANAGER"])) return forbidden();

  const result = await prisma.$transaction(async (tx) => {
    const grn = await tx.goodsReceipt.findUnique({
      where: { id: params.id },
      include: { items: true, po: { include: { items: true } } },
    });

    if (!grn) throw new Error("GRN not found");
    if (grn.status !== "DRAFT") throw new Error("GRN is already confirmed");

    for (const item of grn.items) {
      await tx.inventory.upsert({
        where: {
          siteId_materialId: {
            siteId: grn.siteId,
            materialId: item.materialId,
          },
        },
        update: {
          quantity: { increment: item.acceptedQuantity },
        },
        create: {
          siteId: grn.siteId,
          materialId: item.materialId,
          quantity: item.acceptedQuantity,
        },
      });
    }

    await tx.goodsReceipt.update({
      where: { id: params.id },
      data: { status: "CONFIRMED" },
    });

    const allGRNsForPO = await tx.goodsReceipt.findMany({
      where: { poId: grn.poId, status: "CONFIRMED" },
      include: { items: true },
    });

    const totalReceived: Record<string, number> = {};
    for (const g of allGRNsForPO) {
      for (const item of g.items) {
        totalReceived[item.materialId] =
          (totalReceived[item.materialId] || 0) + Number(item.acceptedQuantity);
      }
    }

    const poFullyReceived = grn.po.items.every((poItem) => {
      const received = totalReceived[poItem.materialId] || 0;
      return received >= Number(poItem.quantity);
    });

    const newPOStatus = poFullyReceived ? "FULLY_RECEIVED" : "PARTIALLY_RECEIVED";
    await tx.purchaseOrder.update({
      where: { id: grn.poId },
      data: { status: newPOStatus },
    });

    const indent = await tx.materialIndent.findFirst({
      where: {
        purchaseOrders: { some: { id: grn.poId } },
      },
    });

    if (indent) {
      const newIndentStatus = poFullyReceived ? "FULLY_RECEIVED" : "PARTIALLY_RECEIVED";
      await tx.materialIndent.update({
        where: { id: indent.id },
        data: { status: newIndentStatus },
      });
    }

    return { message: "GRN confirmed and inventory updated" };
  });

  return success(result);
}

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
      "STORE_MANAGER",
    ])
  ) {
    return forbidden();
  }

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      indent: {
        select: {
          id: true,
          indentNumber: true,
          site: true,
        },
      },
      vendor: true,
      createdBy: { select: { id: true, name: true } },
      items: { include: { material: true } },
      goodsReceipts: {
        include: {
          items: { include: { material: true } },
          receivedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!po) return notFound("Purchase Order");

  const isSM = session.user.siteRoles.some((sr) => sr.role === "STORE_MANAGER");
  if (isSM) {
    return success({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      deliveryDate: po.deliveryDate,
      deliveryAddress: po.deliveryAddress,
      indent: po.indent,
      vendor: { id: po.vendor.id, name: po.vendor.name },
      items: po.items.map((item) => ({
        id: item.id,
        materialId: item.materialId,
        material: item.material,
        quantity: item.quantity,
        unit: item.unit,
      })),
      goodsReceipts: po.goodsReceipts,
    });
  }

  return success(po);
}

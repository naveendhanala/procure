import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, success, badRequest } from "@/lib/api-utils";
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
      approvedBy: { select: { id: true, name: true } },
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

  const existing = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
  });
  if (!existing) return notFound("Purchase Order");
  if (existing.status !== "REJECTED" && existing.status !== "DRAFT") {
    return badRequest("Only rejected or draft POs can be edited");
  }

  const body = await request.json();
  const {
    items,
    deliveryDate,
    deliveryAddress,
    termsAndConditions,
    remarks,
    resubmit,
  } = body;

  const updated = await prisma.$transaction(async (tx) => {
    let totalAmount = Number(existing.totalAmount);
    let gstAmount = Number(existing.gstAmount || 0);

    if (Array.isArray(items)) {
      totalAmount = items.reduce(
        (s: number, it: any) => s + Number(it.totalPrice),
        0
      );
      gstAmount = items.reduce(
        (s: number, it: any) =>
          s +
          (it.gstPercent
            ? (Number(it.totalPrice) * Number(it.gstPercent)) / 100
            : 0),
        0
      );

      await tx.pOItem.deleteMany({ where: { poId: params.id } });
      await tx.pOItem.createMany({
        data: items.map((it: any) => ({
          poId: params.id,
          materialId: it.materialId,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          gstPercent: it.gstPercent || null,
          totalPrice: it.totalPrice,
        })),
      });
    }

    return tx.purchaseOrder.update({
      where: { id: params.id },
      data: {
        ...(items && {
          totalAmount,
          gstAmount: gstAmount || null,
          grandTotal: totalAmount + gstAmount,
        }),
        ...(deliveryDate !== undefined && {
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        }),
        ...(deliveryAddress !== undefined && { deliveryAddress }),
        ...(termsAndConditions !== undefined && { termsAndConditions }),
        ...(remarks !== undefined && { remarks }),
        ...(resubmit && {
          status: "PENDING_APPROVAL",
          rejectionReason: null,
        }),
      },
      include: { items: { include: { material: true } }, vendor: true },
    });
  });

  return success(updated);
}

import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  success,
} from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";
import { buildPOEmail, sendEmail } from "@/lib/email";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "HEAD_OF_PROCUREMENT")) return forbidden();

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      vendor: true,
      items: { include: { material: true } },
      indent: { select: { id: true } },
    },
  });

  if (!po) return notFound("Purchase Order");
  if (po.status !== "PENDING_APPROVAL") {
    return badRequest("Only POs pending approval can be approved");
  }

  const sentAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: "ISSUED",
        approvedById: session.user.id,
        approvedAt: sentAt,
        rejectionReason: null,
        sentToVendorAt: sentAt,
      },
    });

    await tx.materialIndent.update({
      where: { id: po.indentId },
      data: { status: "PO_CREATED" },
    });

    return result;
  });

  const message = buildPOEmail({
    poNumber: po.poNumber,
    vendorName: po.vendor.name,
    vendorEmail: po.vendor.email,
    totalAmount: Number(po.totalAmount),
    gstAmount: Number(po.gstAmount || 0),
    grandTotal: Number(po.grandTotal),
    deliveryDate: po.deliveryDate,
    deliveryAddress: po.deliveryAddress,
    termsAndConditions: po.termsAndConditions,
    items: po.items.map((it) => ({
      materialName: it.material.name,
      quantity: Number(it.quantity),
      unit: it.unit,
      unitPrice: Number(it.unitPrice),
      gstPercent: it.gstPercent ? Number(it.gstPercent) : null,
      totalPrice: Number(it.totalPrice),
    })),
  });

  await sendEmail(message);

  return success(updated);
}

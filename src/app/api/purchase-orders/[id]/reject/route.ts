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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "HEAD_OF_PROCUREMENT")) return forbidden();

  const body = await request.json();
  const { reason } = body;

  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    return badRequest("Rejection reason is required");
  }

  const po = await prisma.purchaseOrder.findUnique({ where: { id: params.id } });
  if (!po) return notFound("Purchase Order");
  if (po.status !== "PENDING_APPROVAL") {
    return badRequest("Only POs pending approval can be rejected");
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: params.id },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
  });

  return success(updated);
}

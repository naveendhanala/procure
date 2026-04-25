import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";
import { generateGRNNumber } from "@/lib/doc-numbers";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  if (
    !hasAnyRole(session.user.siteRoles, [
      "STORE_MANAGER",
      "HEAD_OF_PROCUREMENT",
      "PROCUREMENT_TEAM_MEMBER",
    ])
  ) {
    return forbidden();
  }

  const isSM = session.user.siteRoles.some((sr) => sr.role === "STORE_MANAGER");
  const smSiteIds = session.user.siteRoles
    .filter((sr) => sr.role === "STORE_MANAGER")
    .map((sr) => sr.siteId);

  const where = isSM ? { siteId: { in: smSiteIds } } : {};

  const grns = await prisma.goodsReceipt.findMany({
    where: where as any,
    include: {
      po: {
        select: {
          id: true,
          poNumber: true,
          vendor: { select: { name: true } },
        },
      },
      site: { select: { id: true, name: true, code: true } },
      receivedBy: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(grns);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasAnyRole(session.user.siteRoles, ["STORE_MANAGER"])) return forbidden();

  const body = await request.json();
  const { poId, siteId, items, vehicleNumber, challanNumber, remarks } = body;

  if (!poId || !siteId || !items || items.length === 0) {
    return badRequest("PO, site, and items are required");
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return badRequest("Invalid site");

  const grn = await prisma.$transaction(async (tx) => {
    const grnNumber = await generateGRNNumber(site.code, tx);

    return tx.goodsReceipt.create({
      data: {
        grnNumber,
        poId,
        siteId,
        receivedById: session.user.id,
        vehicleNumber,
        challanNumber,
        remarks,
        items: {
          create: items.map((item: any) => ({
            materialId: item.materialId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            acceptedQuantity: item.acceptedQuantity,
            rejectedQuantity: item.rejectedQuantity || 0,
            unit: item.unit,
            remarks: item.remarks,
          })),
        },
      },
      include: {
        items: { include: { material: true } },
        po: true,
        site: true,
      },
    });
  });

  return created(grn);
}

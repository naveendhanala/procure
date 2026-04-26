import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, success, badRequest } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const siteId = request.nextUrl.searchParams.get("siteId");
  const materialIds = request.nextUrl.searchParams.get("materialIds");
  const excludeIndentId = request.nextUrl.searchParams.get("excludeIndentId");

  if (!siteId || !materialIds) {
    return badRequest("siteId and materialIds are required");
  }

  const matIds = materialIds.split(",");

  const [indentItems, poItems, grnItems] = await Promise.all([
    prisma.indentItem.findMany({
      where: {
        materialId: { in: matIds },
        indent: {
          siteId,
          status: { notIn: ["DRAFT", "REJECTED", "CANCELLED"] },
        },
      },
      include: {
        indent: { select: { id: true, status: true, createdAt: true } },
      },
    }),

    prisma.pOItem.findMany({
      where: {
        materialId: { in: matIds },
        po: {
          indent: { siteId },
          status: { in: ["DRAFT", "ISSUED", "PARTIALLY_RECEIVED"] },
        },
      },
      include: {
        po: {
          select: {
            id: true,
            status: true,
            indent: { select: { siteId: true } },
          },
        },
      },
    }),

    prisma.gRNItem.findMany({
      where: {
        materialId: { in: matIds },
        grn: {
          siteId,
          status: "CONFIRMED",
        },
      },
    }),
  ]);

  const stats: Record<string, {
    totalIndented: number;
    totalReceived: number;
    inTransit: number;
    withProcurement: number;
    pendingInOtherIndents: number;
  }> = {};

  for (const matId of matIds) {
    const matIndentItems = indentItems.filter((ii) => ii.materialId === matId);
    const matPoItems = poItems.filter((pi) => pi.materialId === matId);
    const matGrnItems = grnItems.filter((gi) => gi.materialId === matId);

    const totalIndented = matIndentItems.reduce(
      (sum, ii) => sum + Number(ii.quantity),
      0
    );

    const totalReceived = matGrnItems.reduce(
      (sum, gi) => sum + Number(gi.acceptedQuantity),
      0
    );

    const inTransit = matPoItems.reduce(
      (sum, pi) => sum + Number(pi.quantity),
      0
    );

    const withProcurementStatuses = [
      "APPROVED",
      "ASSIGNED",
      "RFQ_SENT",
      "QUOTES_RECEIVED",
    ];
    const withProcurement = matIndentItems
      .filter((ii) => withProcurementStatuses.includes(ii.indent.status))
      .reduce((sum, ii) => sum + Number(ii.quantity), 0);

    let pendingInOtherIndents = 0;
    if (excludeIndentId) {
      const currentIndent = matIndentItems.find(
        (ii) => ii.indent.id === excludeIndentId
      );
      const currentCreatedAt = currentIndent?.indent.createdAt;
      const pendingStatuses = [
        "PENDING_APPROVAL",
        "PARTIALLY_APPROVED",
      ];

      pendingInOtherIndents = matIndentItems
        .filter((ii) => {
          if (ii.indent.id === excludeIndentId) return false;
          if (currentCreatedAt && ii.indent.createdAt > currentCreatedAt) {
            return (
              pendingStatuses.includes(ii.indent.status) ||
              withProcurementStatuses.includes(ii.indent.status) ||
              ii.indent.status === "PO_CREATED"
            );
          }
          return false;
        })
        .reduce((sum, ii) => sum + Number(ii.quantity), 0);
    }

    stats[matId] = {
      totalIndented,
      totalReceived,
      inTransit,
      withProcurement,
      pendingInOtherIndents,
    };
  }

  return success(stats);
}

import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, success, badRequest } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const siteId = request.nextUrl.searchParams.get("siteId");
  const materialId = request.nextUrl.searchParams.get("materialId");
  const excludeIndentId = request.nextUrl.searchParams.get("excludeIndentId");

  if (!siteId || !materialId) {
    return badRequest("siteId and materialId are required");
  }

  const indentItems = await prisma.indentItem.findMany({
    where: {
      materialId,
      indent: {
        siteId,
        status: { notIn: ["DRAFT", "REJECTED", "CANCELLED"] },
        ...(excludeIndentId ? { id: { not: excludeIndentId } } : {}),
      },
    },
    include: {
      indent: {
        select: {
          id: true,
          indentNumber: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  const indentIds = indentItems.map((ii) => ii.indentId);

  const grnItems = indentIds.length
    ? await prisma.gRNItem.findMany({
        where: {
          materialId,
          grn: {
            siteId,
            status: "CONFIRMED",
            po: { indentId: { in: indentIds } },
          },
        },
        include: { grn: { select: { po: { select: { indentId: true } } } } },
      })
    : [];

  const receivedByIndent = new Map<string, number>();
  for (const gi of grnItems) {
    const indId = gi.grn.po?.indentId;
    if (!indId) continue;
    receivedByIndent.set(
      indId,
      (receivedByIndent.get(indId) ?? 0) + Number(gi.acceptedQuantity)
    );
  }

  const rows = indentItems
    .map((ii) => {
      const indented = Number(ii.quantity);
      const received = receivedByIndent.get(ii.indentId) ?? 0;
      const used = 0;
      const balance = indented - used;
      return {
        indentId: ii.indent.id,
        indentNumber: ii.indent.indentNumber,
        status: ii.indent.status,
        purposeOfUse: ii.purposeOfUse,
        quantityIndented: indented,
        quantityReceived: received,
        quantityUsed: used,
        balanceQuantity: balance,
        unit: ii.unit,
        createdAt: ii.indent.createdAt,
      };
    })
    .filter((r) => r.balanceQuantity > 0)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return success(rows);
}

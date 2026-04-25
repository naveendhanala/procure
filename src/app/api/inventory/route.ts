import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, success } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const siteId = request.nextUrl.searchParams.get("siteId");
  const materialId = request.nextUrl.searchParams.get("materialId");

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = siteId;
  if (materialId) where.materialId = materialId;

  const inventory = await prisma.inventory.findMany({
    where: where as any,
    include: {
      material: { select: { id: true, name: true, code: true, unit: true, category: true } },
      site: { select: { id: true, name: true, code: true } },
    },
    orderBy: { material: { name: "asc" } },
  });

  return success(inventory);
}

import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, success } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: { siteId: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const inventory = await prisma.inventory.findMany({
    where: { siteId: params.siteId },
    include: {
      material: { select: { id: true, name: true, code: true, unit: true, category: true } },
    },
    orderBy: { material: { name: "asc" } },
  });

  return success(inventory);
}

import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, success } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const grn = await prisma.goodsReceipt.findUnique({
    where: { id: params.id },
    include: {
      po: {
        include: {
          vendor: { select: { id: true, name: true } },
          items: { include: { material: true } },
        },
      },
      site: true,
      receivedBy: { select: { id: true, name: true } },
      items: {
        include: {
          material: { select: { id: true, name: true, code: true, unit: true } },
        },
      },
    },
  });

  if (!grn) return notFound("GRN");
  return success(grn);
}

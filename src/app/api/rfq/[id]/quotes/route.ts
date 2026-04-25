import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, success } from "@/lib/api-utils";
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
    ])
  ) {
    return forbidden();
  }

  const quotes = await prisma.vendorQuote.findMany({
    where: { rfqId: params.id },
    include: {
      vendor: { select: { id: true, name: true, code: true } },
      items: {
        include: {
          material: { select: { id: true, name: true, code: true, unit: true } },
        },
      },
    },
    orderBy: { totalAmount: "asc" },
  });

  return success(quotes);
}

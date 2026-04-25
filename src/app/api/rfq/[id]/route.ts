import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, success } from "@/lib/api-utils";
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

  const rfq = await prisma.rFQ.findUnique({
    where: { id: params.id },
    include: {
      indent: {
        select: {
          id: true,
          indentNumber: true,
          site: true,
          createdBy: { select: { name: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: {
          material: { select: { id: true, name: true, code: true, unit: true } },
        },
      },
      vendors: {
        include: { vendor: true },
      },
      quotes: {
        include: {
          vendor: { select: { id: true, name: true } },
          items: { include: { material: true } },
        },
      },
    },
  });

  if (!rfq) return notFound("RFQ");
  return success(rfq);
}

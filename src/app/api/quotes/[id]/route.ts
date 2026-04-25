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

  const quote = await prisma.vendorQuote.findUnique({
    where: { id: params.id },
    include: {
      rfq: { select: { id: true, rfqNumber: true } },
      vendor: true,
      items: { include: { material: true } },
    },
  });

  if (!quote) return notFound("Quote");
  return success(quote);
}

export async function PATCH(
  request: Request,
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

  const body = await request.json();
  const quote = await prisma.vendorQuote.update({
    where: { id: params.id },
    data: body,
  });

  return success(quote);
}

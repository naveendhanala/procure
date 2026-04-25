import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, success } from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const site = await prisma.site.findUnique({
    where: { id: params.id },
    include: {
      approvalWorkflow: { orderBy: { stepOrder: "asc" } },
      userAssignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!site) return notFound("Site");
  return success(site);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const body = await request.json();
  const site = await prisma.site.update({
    where: { id: params.id },
    data: body,
  });

  return success(site);
}

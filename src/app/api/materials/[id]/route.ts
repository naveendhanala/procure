import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, success } from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const body = await request.json();
  const material = await prisma.material.update({
    where: { id: params.id },
    data: body,
  });

  if (!material) return notFound("Material");
  return success(material);
}

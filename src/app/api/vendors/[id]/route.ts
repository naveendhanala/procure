import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, success } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { categories: true },
  });

  if (!vendor) return notFound("Vendor");
  return success(vendor);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (
    !hasAnyRole(session.user.siteRoles, [
      "SUPER_ADMIN",
      "HEAD_OF_PROCUREMENT",
      "PROCUREMENT_TEAM_MEMBER",
    ])
  ) {
    return forbidden();
  }

  const body = await request.json();
  const { categories, ...vendorData } = body;

  const vendor = await prisma.$transaction(async (tx) => {
    if (categories) {
      await tx.vendorCategory.deleteMany({ where: { vendorId: params.id } });
      await Promise.all(
        categories.map((cat: string) =>
          tx.vendorCategory.create({
            data: { vendorId: params.id, category: cat },
          })
        )
      );
    }

    return tx.vendor.update({
      where: { id: params.id },
      data: vendorData,
      include: { categories: true },
    });
  });

  return success(vendor);
}

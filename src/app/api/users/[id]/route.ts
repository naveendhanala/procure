import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, notFound, success } from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      siteAssignments: {
        include: { site: { select: { id: true, name: true, code: true } } },
      },
    },
  });

  if (!user) return notFound("User");
  return success(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const body = await request.json();
  const { name, email, password, phone, isActive, siteAssignments } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (password) updateData.hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    if (siteAssignments) {
      await tx.userSiteAssignment.deleteMany({
        where: { userId: params.id },
      });
      await Promise.all(
        siteAssignments.map((sa: { siteId: string; role: string }) =>
          tx.userSiteAssignment.create({
            data: { userId: params.id, siteId: sa.siteId, role: sa.role as any },
          })
        )
      );
    }

    return tx.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        siteAssignments: {
          include: { site: { select: { id: true, name: true, code: true } } },
        },
      },
    });
  });

  return success(user);
}

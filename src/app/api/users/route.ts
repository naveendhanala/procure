import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
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

  return success(users);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const body = await request.json();
  const { name, email, password, phone, siteAssignments } = body;

  if (!name || !email || !password) {
    return badRequest("Name, email, and password are required");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return badRequest("Email already in use");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      phone,
      siteAssignments: {
        create: (siteAssignments || []).map(
          (sa: { siteId: string; role: string }) => ({
            siteId: sa.siteId,
            role: sa.role as any,
          })
        ),
      },
    },
    include: {
      siteAssignments: {
        include: { site: { select: { id: true, name: true, code: true } } },
      },
    },
  });

  return created({ ...user, hashedPassword: undefined });
}

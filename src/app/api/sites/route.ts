import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { userAssignments: true, indents: true } },
      approvalWorkflow: { orderBy: { stepOrder: "asc" } },
    },
  });

  return success(sites);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const body = await request.json();
  const { name, code, address, city, state } = body;

  if (!name || !code) return badRequest("Name and code are required");

  const site = await prisma.site.create({
    data: { name, code: code.toUpperCase(), address, city, state },
  });

  return created(site);
}

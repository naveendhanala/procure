import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasRole } from "@/lib/permissions";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const where: Record<string, unknown> = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) {
    where.category = category;
  }

  const materials = await prisma.material.findMany({
    where: where as any,
    orderBy: { name: "asc" },
  });

  return success(materials);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.siteRoles, "SUPER_ADMIN")) return forbidden();

  const body = await request.json();
  const { name, code, description, category, unit, hsnCode } = body;

  if (!name || !code || !category || !unit) {
    return badRequest("Name, code, category, and unit are required");
  }

  const material = await prisma.material.create({
    data: { name, code: code.toUpperCase(), description, category, unit, hsnCode },
  });

  return created(material);
}

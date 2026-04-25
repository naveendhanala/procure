import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, forbidden, created, success, badRequest } from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

  const category = request.nextUrl.searchParams.get("category") || "";

  const vendors = await prisma.vendor.findMany({
    where: {
      isActive: true,
      ...(category
        ? { categories: { some: { category } } }
        : {}),
    },
    include: { categories: true },
    orderBy: { name: "asc" },
  });

  return success(vendors);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (
    !hasAnyRole(session.user.siteRoles, ["SUPER_ADMIN", "HEAD_OF_PROCUREMENT"])
  ) {
    return forbidden();
  }

  const body = await request.json();
  const { name, code, contactPerson, email, phone, address, city, state, gstNumber, panNumber, bankName, bankAccountNo, bankIfscCode, categories } = body;

  if (!name || !code) return badRequest("Name and code are required");

  const vendor = await prisma.vendor.create({
    data: {
      name,
      code: code.toUpperCase(),
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      gstNumber,
      panNumber,
      bankName,
      bankAccountNo,
      bankIfscCode,
      categories: {
        create: (categories || []).map((cat: string) => ({ category: cat })),
      },
    },
    include: { categories: true },
  });

  return created(vendor);
}

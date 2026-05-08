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

  const sp = request.nextUrl.searchParams;
  const category = sp.get("category") || "";
  const state = sp.get("state") || "";
  const q = (sp.get("q") || "").trim();
  const cursor = sp.get("cursor") || "";
  const facets = sp.get("facets") === "true";
  const limitParam = parseInt(sp.get("limit") || "50", 10);
  const limit = Math.min(Math.max(limitParam, 1), 200);

  const where = {
    isActive: true,
    ...(category ? { categories: { some: { category } } } : {}),
    ...(state ? { state } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { code: { contains: q, mode: "insensitive" as const } },
            { contactPerson: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const items = await prisma.vendor.findMany({
    where,
    include: { categories: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = items.length > limit;
  const trimmed = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1]?.id ?? null : null;

  if (facets) {
    const [categoryRows, stateRows, total] = await Promise.all([
      prisma.vendorCategory.findMany({
        where: { vendor: { isActive: true } },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
      prisma.vendor.findMany({
        where: { isActive: true, state: { not: null } },
        select: { state: true },
        distinct: ["state"],
        orderBy: { state: "asc" },
      }),
      prisma.vendor.count({ where }),
    ]);
    return success({
      items: trimmed,
      nextCursor,
      total,
      facets: {
        categories: categoryRows.map((r) => r.category),
        states: stateRows.map((r) => r.state).filter((s): s is string => !!s),
      },
    });
  }

  return success({ items: trimmed, nextCursor });
}

export async function POST(request: Request) {
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

import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  forbidden,
  success,
} from "@/lib/api-utils";
import { hasAnyRole } from "@/lib/permissions";

export async function GET() {
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

  const roles = session.user.siteRoles.map((sr) => sr.role);
  const restrictToOwn =
    roles.includes("PROCUREMENT_TEAM_MEMBER") &&
    !roles.includes("HEAD_OF_PROCUREMENT");

  const rfqs = await prisma.rFQ.findMany({
    where: {
      ...(restrictToOwn ? { createdById: session.user.id } : {}),
      status: { in: ["SENT", "QUOTES_RECEIVED"] },
    },
    include: {
      indent: {
        select: {
          id: true,
          indentNumber: true,
          status: true,
          site: { select: { name: true, code: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
      vendors: {
        select: {
          id: true,
          quoteSubmittedAt: true,
          vendor: { select: { id: true, name: true } },
        },
      },
      quotes: { select: { vendorId: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = Date.now();
  const items = rfqs.map((rfq) => {
    const vendorCount = rfq.vendors.length;
    const submittedVendorIds = new Set(rfq.quotes.map((q) => q.vendorId));
    for (const v of rfq.vendors) {
      if (v.quoteSubmittedAt) submittedVendorIds.add(v.vendor.id);
    }
    const submittedCount = submittedVendorIds.size;
    const overdue =
      rfq.dueDate &&
      rfq.dueDate.getTime() < now &&
      submittedCount < vendorCount;
    const indentHasPo =
      rfq.indent.status === "PO_CREATED" ||
      rfq.indent.status === "PARTIALLY_RECEIVED" ||
      rfq.indent.status === "FULLY_RECEIVED";
    const quotesReady = submittedCount > 0 && !indentHasPo;

    return {
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
      status: rfq.status,
      dueDate: rfq.dueDate,
      createdAt: rfq.createdAt,
      indent: rfq.indent,
      vendorCount,
      submittedCount,
      pendingVendors: rfq.vendors
        .filter((v) => !submittedVendorIds.has(v.vendor.id))
        .map((v) => v.vendor.name),
      overdue,
      quotesReady,
    };
  });

  return success({
    quotesReady: items.filter((i) => i.quotesReady),
    awaitingQuotes: items.filter((i) => !i.quotesReady && i.submittedCount < i.vendorCount),
    overdue: items.filter((i) => i.overdue),
  });
}

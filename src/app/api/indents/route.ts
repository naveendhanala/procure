import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, created, success, badRequest } from "@/lib/api-utils";
import { isProcurementRole, getDisplayStatus } from "@/lib/permissions";
import { generateIndentNumber } from "@/lib/doc-numbers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { siteRoles } = session.user;
  const isProcurement = isProcurementRole(siteRoles);
  const status = request.nextUrl.searchParams.get("status");
  const siteId = request.nextUrl.searchParams.get("siteId");

  const pendingMyApproval = request.nextUrl.searchParams.get("pendingMyApproval") === "true";

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (siteId) where.siteId = siteId;

  const roles = Array.from(new Set(siteRoles.map((sr) => sr.role)));

  if (pendingMyApproval) {
    const approverRoles = siteRoles.filter(
      (sr) =>
        sr.role === "PROJECT_MANAGER" ||
        sr.role === "CLUSTER_HEAD" ||
        sr.role === "VICE_PRESIDENT" ||
        sr.role === "HEAD_OF_STORES"
    );
    if (approverRoles.length === 0) return success([]);

    const workflowSteps = await prisma.approvalWorkflowStep.findMany({
      where: {
        OR: approverRoles.map((sr) => ({ siteId: sr.siteId, role: sr.role })),
      },
    });
    if (workflowSteps.length === 0) return success([]);

    where.status = { in: ["PENDING_APPROVAL", "PARTIALLY_APPROVED"] };
    where.OR = workflowSteps.map((ws) => ({
      siteId: ws.siteId,
      currentApprovalStep: ws.stepOrder,
    }));
  } else {
    if (roles.includes("STORE_MANAGER") && !isProcurement && !roles.includes("SUPER_ADMIN")) {
      const mySiteIds = siteRoles
        .filter((sr) => sr.role === "STORE_MANAGER")
        .map((sr) => sr.siteId);
      where.OR = [
        { createdById: session.user.id },
        { siteId: { in: mySiteIds } },
      ];
    }

    if (roles.includes("PROCUREMENT_TEAM_MEMBER") && !roles.includes("HEAD_OF_PROCUREMENT")) {
      where.assignedToId = session.user.id;
    }
  }

  const indents = await prisma.materialIndent.findMany({
    where: where as any,
    include: {
      site: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      items: {
        include: {
          material: { select: { id: true, name: true, code: true, unit: true } },
        },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingApprovalIndents = indents.filter(
    (i) => i.status === "PENDING_APPROVAL" || i.status === "PARTIALLY_APPROVED"
  );
  const approvedIndents = indents.filter((i) => i.status === "APPROVED");
  const assignedIndents = indents.filter(
    (i) =>
      (i.status === "ASSIGNED" ||
        i.status === "RFQ_SENT" ||
        i.status === "QUOTES_RECEIVED") &&
      i.assignedTo
  );

  const pendingWithMap: Record<string, { name: string; role: string }> = {};

  if (pendingApprovalIndents.length > 0) {
    const stepQueries = pendingApprovalIndents.map((i) => ({
      siteId: i.siteId,
      stepOrder: i.currentApprovalStep,
    }));
    const steps = await prisma.approvalWorkflowStep.findMany({
      where: { OR: stepQueries },
    });
    const stepMap = new Map(steps.map((s) => [`${s.siteId}_${s.stepOrder}`, s.role]));

    const neededLookups = new Map<string, string>();
    for (const ind of pendingApprovalIndents) {
      const role = stepMap.get(`${ind.siteId}_${ind.currentApprovalStep}`);
      if (role) neededLookups.set(`${ind.siteId}_${role}`, role);
    }

    const assignments = await prisma.userSiteAssignment.findMany({
      where: {
        OR: Array.from(neededLookups.entries()).map(([key]) => {
          const [sId, ...roleParts] = key.split("_");
          return { siteId: sId, role: roleParts.join("_") as any };
        }),
      },
      include: { user: { select: { name: true } } },
    });
    const assignmentMap = new Map(
      assignments.map((a) => [`${a.siteId}_${a.role}`, a.user.name])
    );

    for (const ind of pendingApprovalIndents) {
      const role = stepMap.get(`${ind.siteId}_${ind.currentApprovalStep}`);
      if (role) {
        const name = assignmentMap.get(`${ind.siteId}_${role}`);
        if (name) {
          pendingWithMap[ind.id] = { name, role };
        }
      }
    }
  }

  if (approvedIndents.length > 0) {
    const approvedSiteIds = Array.from(
      new Set(approvedIndents.map((i) => i.siteId))
    );
    const hopAssignments = await prisma.userSiteAssignment.findMany({
      where: {
        siteId: { in: approvedSiteIds },
        role: "HEAD_OF_PROCUREMENT",
      },
      include: { user: { select: { name: true } } },
    });
    const hopBySite = new Map(
      hopAssignments.map((a) => [a.siteId, a.user.name])
    );

    for (const ind of approvedIndents) {
      const name = hopBySite.get(ind.siteId);
      if (name) {
        pendingWithMap[ind.id] = { name, role: "HEAD_OF_PROCUREMENT" };
      }
    }
  }

  for (const ind of assignedIndents) {
    if (ind.assignedTo) {
      pendingWithMap[ind.id] = {
        name: ind.assignedTo.name,
        role: "PROCUREMENT_TEAM_MEMBER",
      };
    }
  }

  const indentIds = indents.map((i) => i.id);
  const materialProgressMap: Record<
    string,
    {
      totalItems: number;
      withActiveRfq: number;
      withQuotes: number;
      withPo: number;
    }
  > = {};

  if (indentIds.length > 0) {
    const [rfqRows, poRows] = await Promise.all([
      prisma.rFQ.findMany({
        where: {
          indentId: { in: indentIds },
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
        select: {
          indentId: true,
          items: { select: { materialId: true } },
          quotes: { select: { items: { select: { materialId: true } } } },
        },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          indentId: { in: indentIds },
          status: { notIn: ["DRAFT", "REJECTED", "CANCELLED"] },
        },
        select: {
          indentId: true,
          items: { select: { materialId: true } },
        },
      }),
    ]);

    const rfqByIndent = new Map<string, Set<string>>();
    const quoteByIndent = new Map<string, Set<string>>();
    for (const r of rfqRows) {
      const rfqSet = rfqByIndent.get(r.indentId) ?? new Set<string>();
      for (const it of r.items) rfqSet.add(it.materialId);
      rfqByIndent.set(r.indentId, rfqSet);

      const quoteSet = quoteByIndent.get(r.indentId) ?? new Set<string>();
      for (const q of r.quotes) {
        for (const qi of q.items) quoteSet.add(qi.materialId);
      }
      quoteByIndent.set(r.indentId, quoteSet);
    }

    const poByIndent = new Map<string, Set<string>>();
    for (const p of poRows) {
      const set = poByIndent.get(p.indentId) ?? new Set<string>();
      for (const it of p.items) set.add(it.materialId);
      poByIndent.set(p.indentId, set);
    }

    for (const ind of indents) {
      const matIds = new Set(ind.items.map((it) => it.materialId));
      const rfqSet = rfqByIndent.get(ind.id);
      const quoteSet = quoteByIndent.get(ind.id);
      const poSet = poByIndent.get(ind.id);

      let withActiveRfq = 0;
      let withQuotes = 0;
      let withPo = 0;
      matIds.forEach((m) => {
        if (rfqSet?.has(m)) withActiveRfq++;
        if (quoteSet?.has(m)) withQuotes++;
        if (poSet?.has(m)) withPo++;
      });
      materialProgressMap[ind.id] = {
        totalItems: matIds.size,
        withActiveRfq,
        withQuotes,
        withPo,
      };
    }
  }

  const result = indents.map((indent) => ({
    ...indent,
    pendingWith: pendingWithMap[indent.id] ?? null,
    displayStatus: getDisplayStatus(indent.status, isProcurement),
    materialProgress: materialProgressMap[indent.id] ?? null,
  }));

  return success(result);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await request.json();
  const { siteId, items, remarks, requiredDate, priority } = body;

  if (!siteId || !items || items.length === 0) {
    return badRequest("Site and at least one item are required");
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return badRequest("Invalid site");

  const indent = await prisma.$transaction(async (tx) => {
    const indentNumber = await generateIndentNumber(site.code, tx);

    const inventoryRecords = await tx.inventory.findMany({
      where: {
        siteId,
        materialId: { in: items.map((i: any) => i.materialId) },
      },
    });

    const stockMap = new Map(
      inventoryRecords.map((inv) => [inv.materialId, Number(inv.quantity)])
    );

    return tx.materialIndent.create({
      data: {
        indentNumber,
        siteId,
        createdById: session.user.id,
        remarks,
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        priority: priority || "NORMAL",
        items: {
          create: items.map((item: any) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unit: item.unit,
            purposeOfUse: item.purposeOfUse || null,
            remarks: item.remarks,
            stockAtCreation: stockMap.get(item.materialId) || 0,
          })),
        },
      },
      include: {
        items: {
          include: { material: true },
        },
        site: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
  });

  return created(indent);
}

import { prisma } from "@/lib/prisma";
import { getSession, unauthorized, notFound, success, badRequest } from "@/lib/api-utils";
import { isProcurementRole, getDisplayStatus } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const isProcurement = isProcurementRole(session.user.siteRoles);

  const indent = await prisma.materialIndent.findUnique({
    where: { id: params.id },
    include: {
      site: true,
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { id: true, name: true } },
      items: {
        include: {
          material: { select: { id: true, name: true, code: true, unit: true, category: true } },
        },
      },
      approvals: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      ...(isProcurement
        ? {
            rfqs: {
              include: {
                vendors: { include: { vendor: { select: { id: true, name: true } } } },
                quotes: {
                  include: {
                    vendor: { select: { id: true, name: true } },
                    items: { include: { material: true } },
                  },
                },
              },
            },
            purchaseOrders: {
              include: {
                vendor: { select: { id: true, name: true } },
                items: { include: { material: true } },
              },
            },
          }
        : {}),
    },
  });

  if (!indent) return notFound("Indent");

  const matIds = indent.items.map((item) => item.materialId);

  const [inventoryRecords, indentItems, poItems, grnItems] = await Promise.all([
    prisma.inventory.findMany({
      where: { siteId: indent.siteId, materialId: { in: matIds } },
    }),
    prisma.indentItem.findMany({
      where: {
        materialId: { in: matIds },
        indent: {
          siteId: indent.siteId,
          status: { notIn: ["DRAFT", "REJECTED", "CANCELLED"] },
        },
      },
      include: {
        indent: { select: { id: true, status: true, createdAt: true } },
      },
    }),
    prisma.pOItem.findMany({
      where: {
        materialId: { in: matIds },
        po: {
          indent: { siteId: indent.siteId },
          status: { in: ["DRAFT", "ISSUED", "PARTIALLY_RECEIVED"] },
        },
      },
    }),
    prisma.gRNItem.findMany({
      where: {
        materialId: { in: matIds },
        grn: { siteId: indent.siteId, status: "CONFIRMED" },
      },
    }),
  ]);

  const invMap = new Map(
    inventoryRecords.map((inv) => [inv.materialId, Number(inv.quantity)])
  );
  const currentInventory: Record<string, number> = {};
  const materialStats: Record<string, {
    totalIndented: number;
    totalReceived: number;
    inTransit: number;
    withProcurement: number;
    pendingInOtherIndents: number;
  }> = {};

  const withProcurementStatuses = ["APPROVED", "ASSIGNED", "RFQ_SENT", "QUOTES_RECEIVED"];
  const pendingStatuses = ["PENDING_APPROVAL", "PARTIALLY_APPROVED"];

  for (const matId of matIds) {
    currentInventory[matId] = invMap.get(matId) ?? 0;

    const matIndentItems = indentItems.filter((ii) => ii.materialId === matId);
    const matPoItems = poItems.filter((pi) => pi.materialId === matId);
    const matGrnItems = grnItems.filter((gi) => gi.materialId === matId);

    const totalIndented = matIndentItems.reduce((s, ii) => s + Number(ii.quantity), 0);
    const totalReceived = matGrnItems.reduce((s, gi) => s + Number(gi.acceptedQuantity), 0);
    const inTransit = matPoItems.reduce((s, pi) => s + Number(pi.quantity), 0);
    const withProcurement = matIndentItems
      .filter((ii) => withProcurementStatuses.includes(ii.indent.status))
      .reduce((s, ii) => s + Number(ii.quantity), 0);

    const pendingInOtherIndents = matIndentItems
      .filter((ii) => {
        if (ii.indent.id === indent.id) return false;
        if (ii.indent.createdAt > indent.createdAt) {
          return (
            pendingStatuses.includes(ii.indent.status) ||
            withProcurementStatuses.includes(ii.indent.status) ||
            ii.indent.status === "PO_CREATED"
          );
        }
        return false;
      })
      .reduce((s, ii) => s + Number(ii.quantity), 0);

    materialStats[matId] = {
      totalIndented,
      totalReceived,
      inTransit,
      withProcurement,
      pendingInOtherIndents,
    };
  }

  return success({
    ...indent,
    currentInventory,
    materialStats,
    displayStatus: getDisplayStatus(indent.status, isProcurement),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const indent = await prisma.materialIndent.findUnique({
    where: { id: params.id },
  });
  if (!indent) return notFound("Indent");
  if (indent.createdById !== session.user.id) {
    return badRequest("Only the creator can edit this indent");
  }
  if (indent.status !== "DRAFT") {
    return badRequest("Only draft indents can be edited");
  }

  const body = await request.json();
  const { items, remarks, requiredDate, priority } = body;

  const updated = await prisma.$transaction(async (tx) => {
    if (items) {
      await tx.indentItem.deleteMany({ where: { indentId: params.id } });

      const inventoryRecords = await tx.inventory.findMany({
        where: {
          siteId: indent.siteId,
          materialId: { in: items.map((i: any) => i.materialId) },
        },
      });

      const stockMap = new Map(
        inventoryRecords.map((inv) => [inv.materialId, Number(inv.quantity)])
      );

      await Promise.all(
        items.map((item: any) =>
          tx.indentItem.create({
            data: {
              indentId: params.id,
              materialId: item.materialId,
              quantity: item.quantity,
              unit: item.unit,
              remarks: item.remarks,
              stockAtCreation: stockMap.get(item.materialId) || 0,
            },
          })
        )
      );
    }

    return tx.materialIndent.update({
      where: { id: params.id },
      data: {
        ...(remarks !== undefined && { remarks }),
        ...(requiredDate !== undefined && {
          requiredDate: requiredDate ? new Date(requiredDate) : null,
        }),
        ...(priority !== undefined && { priority }),
      },
      include: {
        items: { include: { material: true } },
        site: true,
      },
    });
  });

  return success(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const indent = await prisma.materialIndent.findUnique({
    where: { id: params.id },
  });
  if (!indent) return notFound("Indent");
  if (indent.createdById !== session.user.id) {
    return badRequest("Only the creator can delete this indent");
  }
  if (indent.status !== "DRAFT") {
    return badRequest("Only draft indents can be deleted");
  }

  await prisma.materialIndent.delete({ where: { id: params.id } });
  return success({ message: "Indent deleted" });
}

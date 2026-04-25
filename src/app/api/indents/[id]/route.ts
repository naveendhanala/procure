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

  const currentInventory: Record<string, number> = {};
  for (const item of indent.items) {
    const inv = await prisma.inventory.findUnique({
      where: {
        siteId_materialId: {
          siteId: indent.siteId,
          materialId: item.materialId,
        },
      },
    });
    currentInventory[item.materialId] = inv ? Number(inv.quantity) : 0;
  }

  return success({
    ...indent,
    currentInventory,
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

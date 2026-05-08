import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const rfqVendor = await prisma.rFQVendor.findUnique({
    where: { accessToken: params.token },
    include: {
      vendor: { select: { id: true, name: true, code: true, email: true } },
      rfq: {
        include: {
          items: {
            include: {
              material: { select: { id: true, name: true, code: true, unit: true } },
            },
          },
          indent: { select: { indentNumber: true } },
        },
      },
    },
  });

  if (!rfqVendor) {
    return NextResponse.json({ error: "Invalid quote link" }, { status: 404 });
  }

  const closed =
    rfqVendor.rfq.status === "CLOSED" || rfqVendor.rfq.status === "CANCELLED";

  return NextResponse.json({
    vendor: rfqVendor.vendor,
    rfq: {
      id: rfqVendor.rfq.id,
      rfqNumber: rfqVendor.rfq.rfqNumber,
      indentNumber: rfqVendor.rfq.indent.indentNumber,
      dueDate: rfqVendor.rfq.dueDate,
      remarks: rfqVendor.rfq.remarks,
      status: rfqVendor.rfq.status,
      items: rfqVendor.rfq.items.map((item) => ({
        id: item.id,
        materialId: item.materialId,
        materialName: item.material.name,
        materialCode: item.material.code,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
    },
    submittedAt: rfqVendor.quoteSubmittedAt,
    closed,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const rfqVendor = await prisma.rFQVendor.findUnique({
    where: { accessToken: params.token },
    include: {
      rfq: { include: { items: true } },
    },
  });

  if (!rfqVendor) {
    return NextResponse.json({ error: "Invalid quote link" }, { status: 404 });
  }
  if (rfqVendor.quoteSubmittedAt) {
    return NextResponse.json(
      { error: "A quote has already been submitted for this link" },
      { status: 400 }
    );
  }
  if (
    rfqVendor.rfq.status === "CLOSED" ||
    rfqVendor.rfq.status === "CANCELLED"
  ) {
    return NextResponse.json(
      { error: "This RFQ is no longer accepting quotes" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { quoteNumber, validUntil, remarks, items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Items are required" }, { status: 400 });
  }

  const itemMap = new Map(rfqVendor.rfq.items.map((it) => [it.materialId, it]));
  const normalized = items.map((it: any) => {
    const rfqItem = itemMap.get(it.materialId);
    if (!rfqItem) throw new Error("Unknown material in quote");
    const unitPrice = Number(it.unitPrice);
    const quantity = Number(rfqItem.quantity);
    const gstPercent =
      it.gstPercent !== undefined && it.gstPercent !== null && it.gstPercent !== ""
        ? Number(it.gstPercent)
        : null;
    const totalPrice = unitPrice * quantity;
    return {
      materialId: rfqItem.materialId,
      quantity,
      unit: rfqItem.unit,
      unitPrice,
      gstPercent,
      totalPrice,
      remarks: it.remarks ?? null,
    };
  });

  const totalAmount = normalized.reduce((s, it) => s + it.totalPrice, 0);

  await prisma.$transaction(async (tx) => {
    await tx.vendorQuote.create({
      data: {
        rfqId: rfqVendor.rfqId,
        vendorId: rfqVendor.vendorId,
        quoteNumber: quoteNumber || null,
        status: "RECEIVED",
        totalAmount,
        validUntil: validUntil ? new Date(validUntil) : null,
        remarks: remarks || null,
        receivedAt: new Date(),
        items: { create: normalized },
      },
    });

    await tx.rFQVendor.update({
      where: { id: rfqVendor.id },
      data: { quoteSubmittedAt: new Date() },
    });

    await tx.rFQ.update({
      where: { id: rfqVendor.rfqId },
      data: { status: "QUOTES_RECEIVED" },
    });

    await tx.materialIndent.update({
      where: { id: rfqVendor.rfq.indentId },
      data: { status: "QUOTES_RECEIVED" },
    });
  });

  return NextResponse.json({ success: true });
}

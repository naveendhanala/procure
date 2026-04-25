import { prisma } from "./prisma";
import { PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function generateIndentNumber(
  siteCode: string,
  tx?: TxClient
): Promise<string> {
  const db = tx || prisma;
  const year = new Date().getFullYear();
  const prefix = `IND-${siteCode}-${year}`;

  const latest = await db.materialIndent.findFirst({
    where: { indentNumber: { startsWith: prefix } },
    orderBy: { indentNumber: "desc" },
  });

  const nextSeq = latest
    ? parseInt(latest.indentNumber.split("-").pop()!) + 1
    : 1;

  return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
}

export async function generateRFQNumber(tx?: TxClient): Promise<string> {
  const db = tx || prisma;
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}`;

  const latest = await db.rFQ.findFirst({
    where: { rfqNumber: { startsWith: prefix } },
    orderBy: { rfqNumber: "desc" },
  });

  const nextSeq = latest
    ? parseInt(latest.rfqNumber.split("-").pop()!) + 1
    : 1;

  return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
}

export async function generatePONumber(tx?: TxClient): Promise<string> {
  const db = tx || prisma;
  const year = new Date().getFullYear();
  const prefix = `PO-${year}`;

  const latest = await db.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: "desc" },
  });

  const nextSeq = latest
    ? parseInt(latest.poNumber.split("-").pop()!) + 1
    : 1;

  return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
}

export async function generateGRNNumber(
  siteCode: string,
  tx?: TxClient
): Promise<string> {
  const db = tx || prisma;
  const year = new Date().getFullYear();
  const prefix = `GRN-${siteCode}-${year}`;

  const latest = await db.goodsReceipt.findFirst({
    where: { grnNumber: { startsWith: prefix } },
    orderBy: { grnNumber: "desc" },
  });

  const nextSeq = latest
    ? parseInt(latest.grnNumber.split("-").pop()!) + 1
    : 1;

  return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
}

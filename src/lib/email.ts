import { randomBytes } from "crypto";

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

function getAppUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

interface RFQEmailVendor {
  vendorName: string;
  vendorEmail: string | null;
  accessToken: string;
}

interface RFQEmailContext {
  rfqNumber: string;
  dueDate: Date | null;
  remarks: string | null;
  items: { materialName: string; quantity: number; unit: string }[];
}

export interface RFQEmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  link: string;
  vendorName: string;
}

export function buildRFQEmail(
  vendor: RFQEmailVendor,
  ctx: RFQEmailContext
): RFQEmailMessage {
  const link = `${getAppUrl()}/quote/${vendor.accessToken}`;
  const dueLine = ctx.dueDate
    ? `Quote due by ${ctx.dueDate.toISOString().slice(0, 10)}.`
    : "";

  const itemsHtml = ctx.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px;border:1px solid #ddd">${i.materialName}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${i.quantity} ${i.unit}</td></tr>`
    )
    .join("");

  const itemsText = ctx.items
    .map((i) => `- ${i.materialName}: ${i.quantity} ${i.unit}`)
    .join("\n");

  const html = `
    <p>Hello ${vendor.vendorName},</p>
    <p>You have been invited to quote on RFQ <strong>${ctx.rfqNumber}</strong>.</p>
    ${dueLine ? `<p>${dueLine}</p>` : ""}
    <table style="border-collapse:collapse;border:1px solid #ddd">
      <thead><tr><th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Material</th><th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Quantity</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    ${ctx.remarks ? `<p><strong>Remarks:</strong> ${ctx.remarks}</p>` : ""}
    <p>Please submit your quote here: <a href="${link}">${link}</a></p>
    <p>This link is unique to your company. Do not share it.</p>
  `;

  const text = `Hello ${vendor.vendorName},

You have been invited to quote on RFQ ${ctx.rfqNumber}.
${dueLine}

Items:
${itemsText}
${ctx.remarks ? `\nRemarks: ${ctx.remarks}` : ""}

Submit your quote here: ${link}
This link is unique to your company. Do not share it.`;

  return {
    to: vendor.vendorEmail || "",
    subject: `RFQ ${ctx.rfqNumber} — Submit Your Quote`,
    html,
    text,
    link,
    vendorName: vendor.vendorName,
  };
}

interface POEmailContext {
  poNumber: string;
  vendorName: string;
  vendorEmail: string | null;
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  deliveryDate: Date | null;
  deliveryAddress: string | null;
  termsAndConditions: string | null;
  items: {
    materialName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    gstPercent: number | null;
    totalPrice: number;
  }[];
}

export interface POEmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  poNumber: string;
  vendorName: string;
}

function formatINR(n: number): string {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

export function buildPOEmail(ctx: POEmailContext): POEmailMessage {
  const itemsHtml = ctx.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px;border:1px solid #ddd">${i.materialName}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${i.quantity} ${i.unit}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${i.unitPrice.toFixed(2)}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${i.gstPercent ?? "-"}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${i.totalPrice.toFixed(2)}</td></tr>`
    )
    .join("");

  const itemsText = ctx.items
    .map(
      (i) =>
        `- ${i.materialName}: ${i.quantity} ${i.unit} @ ${i.unitPrice.toFixed(2)} = ${i.totalPrice.toFixed(2)}`
    )
    .join("\n");

  const deliveryLine = ctx.deliveryDate
    ? `<p><strong>Required by:</strong> ${ctx.deliveryDate.toISOString().slice(0, 10)}</p>`
    : "";

  const html = `
    <p>Hello ${ctx.vendorName},</p>
    <p>Please find attached our Purchase Order <strong>${ctx.poNumber}</strong>.</p>
    ${deliveryLine}
    ${ctx.deliveryAddress ? `<p><strong>Deliver to:</strong> ${ctx.deliveryAddress}</p>` : ""}
    <table style="border-collapse:collapse;border:1px solid #ddd">
      <thead><tr>
        <th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Material</th>
        <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Qty</th>
        <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Unit Price</th>
        <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">GST %</th>
        <th style="padding:4px 8px;border:1px solid #ddd;text-align:right">Total</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="margin-top:12px">
      Subtotal: ${formatINR(ctx.totalAmount)}<br/>
      GST: ${formatINR(ctx.gstAmount)}<br/>
      <strong>Grand Total: ${formatINR(ctx.grandTotal)}</strong>
    </p>
    ${ctx.termsAndConditions ? `<p><strong>Terms & Conditions:</strong><br/>${ctx.termsAndConditions.replace(/\n/g, "<br/>")}</p>` : ""}
    <p>Please confirm receipt and expected dispatch date by replying to this email.</p>
  `;

  const text = `Hello ${ctx.vendorName},

Please find our Purchase Order ${ctx.poNumber} below.
${ctx.deliveryDate ? `Required by: ${ctx.deliveryDate.toISOString().slice(0, 10)}` : ""}
${ctx.deliveryAddress ? `Deliver to: ${ctx.deliveryAddress}` : ""}

Items:
${itemsText}

Subtotal: ${formatINR(ctx.totalAmount)}
GST: ${formatINR(ctx.gstAmount)}
Grand Total: ${formatINR(ctx.grandTotal)}
${ctx.termsAndConditions ? `\nTerms & Conditions:\n${ctx.termsAndConditions}` : ""}

Please confirm receipt by replying to this email.`;

  return {
    to: ctx.vendorEmail || "",
    subject: `Purchase Order ${ctx.poNumber}`,
    html,
    text,
    poNumber: ctx.poNumber,
    vendorName: ctx.vendorName,
  };
}

export async function sendEmail(
  message: RFQEmailMessage | POEmailMessage
): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER;

  if (!provider) {
    console.log("[email:stub] no EMAIL_PROVIDER set — would have sent:");
    console.log(`  to:      ${message.to || "(no vendor email)"}`);
    console.log(`  subject: ${message.subject}`);
    if ("link" in message) {
      console.log(`  link:    ${message.link}`);
    }
    return;
  }

  console.warn(
    `[email] EMAIL_PROVIDER=${provider} configured but no sender implementation — extend src/lib/email.ts`
  );
}

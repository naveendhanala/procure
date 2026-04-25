"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function PODetailPage() {
  const params = useParams();
  const router = useRouter();
  const [po, setPO] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/purchase-orders/${params.id}`).then((r) => r.json()).then(setPO);
  }, [params.id]);

  if (!po) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={po.poNumber}>
        <StatusBadge status={po.status} />
        <Button variant="outline" onClick={() => router.push("/procurement/purchase-orders")}>Back</Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>PO Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Indent:</span> {po.indent?.indentNumber}</p>
            <p><span className="text-muted-foreground">Site:</span> {po.indent?.site?.name}</p>
            <p><span className="text-muted-foreground">Vendor:</span> {po.vendor?.name}</p>
            <p><span className="text-muted-foreground">Created By:</span> {po.createdBy?.name}</p>
            {po.deliveryDate && <p><span className="text-muted-foreground">Delivery Date:</span> {formatDate(po.deliveryDate)}</p>}
            {po.deliveryAddress && <p><span className="text-muted-foreground">Delivery Address:</span> {po.deliveryAddress}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Amount</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Subtotal:</span> <span className="font-medium">{Number(po.totalAmount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span></p>
            <p><span className="text-muted-foreground">GST:</span> <span className="font-medium">{Number(po.gstAmount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span></p>
            <p className="text-lg"><span className="text-muted-foreground">Grand Total:</span> <span className="font-bold">{Number(po.grandTotal).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span></p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>GST %</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.material?.name}</TableCell>
                  <TableCell>{Number(item.quantity)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{Number(item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell>{item.gstPercent ? `${Number(item.gstPercent)}%` : "-"}</TableCell>
                  <TableCell className="font-medium">{Number(item.totalPrice).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {po.goodsReceipts?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Goods Receipts</CardTitle></CardHeader>
          <CardContent>
            {po.goodsReceipts.map((grn: any) => (
              <div key={grn.id} className="flex items-center justify-between rounded-md border p-3 mb-2">
                <div>
                  <span className="font-medium">{grn.grnNumber}</span>
                  <span className="ml-2 text-sm text-muted-foreground">by {grn.receivedBy?.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{formatDate(grn.receivedDate)}</span>
                </div>
                <StatusBadge status={grn.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertTriangle, Mail } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function PODetailPage() {
  const params = useParams();
  const router = useRouter();
  const { siteRoles } = useCurrentUser();
  const [po, setPO] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [terms, setTerms] = useState("");
  const [remarks, setRemarks] = useState("");

  const isHoP = siteRoles.some((sr) => sr.role === "HEAD_OF_PROCUREMENT");

  useEffect(() => {
    fetchPO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function fetchPO() {
    const data = await fetch(`/api/purchase-orders/${params.id}`).then((r) => r.json());
    setPO(data);
  }

  function startEdit() {
    setItems(
      po.items.map((it: any) => ({
        materialId: it.materialId,
        materialName: it.material?.name,
        quantity: Number(it.quantity),
        unit: it.unit,
        unitPrice: Number(it.unitPrice),
        gstPercent: it.gstPercent ? Number(it.gstPercent) : 18,
        totalPrice: Number(it.totalPrice).toFixed(2),
      }))
    );
    setDeliveryDate(po.deliveryDate ? po.deliveryDate.slice(0, 10) : "");
    setDeliveryAddress(po.deliveryAddress || "");
    setTerms(po.termsAndConditions || "");
    setRemarks(po.remarks || "");
    setEditing(true);
  }

  function updateItem(index: number, field: string, value: string) {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].totalPrice = (qty * price).toFixed(2);
    setItems(updated);
  }

  async function approve() {
    setActionLoading(true);
    const res = await fetch(`/api/purchase-orders/${params.id}/approve`, { method: "POST" });
    if (res.ok) {
      await fetchPO();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setActionLoading(false);
  }

  async function reject() {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    const res = await fetch(`/api/purchase-orders/${params.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectionReason }),
    });
    if (res.ok) {
      setRejectionReason("");
      await fetchPO();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setActionLoading(false);
  }

  async function saveEdits(resubmit: boolean) {
    setActionLoading(true);
    const res = await fetch(`/api/purchase-orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((it) => ({
          materialId: it.materialId,
          quantity: parseFloat(it.quantity),
          unit: it.unit,
          unitPrice: parseFloat(it.unitPrice),
          gstPercent: parseFloat(it.gstPercent) || null,
          totalPrice: parseFloat(it.totalPrice),
        })),
        deliveryDate: deliveryDate || null,
        deliveryAddress,
        termsAndConditions: terms || null,
        remarks: remarks || null,
        resubmit,
      }),
    });
    if (res.ok) {
      setEditing(false);
      await fetchPO();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setActionLoading(false);
  }

  if (!po) return <p className="text-muted-foreground">Loading...</p>;

  const total = items.reduce((sum, i) => sum + (parseFloat(i.totalPrice) || 0), 0);
  const gstTotal = items.reduce(
    (sum, i) => sum + ((parseFloat(i.totalPrice) || 0) * (parseFloat(i.gstPercent) || 0)) / 100,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader title={po.poNumber}>
        <StatusBadge status={po.status} />
        <Button variant="outline" onClick={() => router.push("/procurement/purchase-orders")}>Back</Button>
      </PageHeader>

      {po.status === "REJECTED" && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Rejected by Head of Procurement</p>
              <p className="text-muted-foreground mt-1">{po.rejectionReason}</p>
              {po.approvedBy && (
                <p className="text-xs text-muted-foreground mt-1">
                  {po.approvedBy.name} · {formatDateTime(po.approvedAt)}
                </p>
              )}
            </div>
            {!editing && (
              <Button onClick={startEdit}>Edit & Resubmit</Button>
            )}
          </CardContent>
        </Card>
      )}

      {po.status === "ISSUED" && po.sentToVendorAt && (
        <Card className="border-green-200 bg-green-50/40">
          <CardContent className="pt-4 flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-green-600" />
            <span>Sent to {po.vendor?.name} on {formatDateTime(po.sentToVendorAt)}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>PO Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Indent:</span> {po.indent?.indentNumber}</p>
            <p><span className="text-muted-foreground">Site:</span> {po.indent?.site?.name}</p>
            <p><span className="text-muted-foreground">Vendor:</span> {po.vendor?.name}</p>
            <p><span className="text-muted-foreground">Created By:</span> {po.createdBy?.name}</p>
            {po.approvedBy && po.status === "ISSUED" && (
              <p><span className="text-muted-foreground">Approved By:</span> {po.approvedBy.name} · {formatDateTime(po.approvedAt)}</p>
            )}
            {po.deliveryDate && <p><span className="text-muted-foreground">Delivery Date:</span> {formatDate(po.deliveryDate)}</p>}
            {po.deliveryAddress && <p><span className="text-muted-foreground">Delivery Address:</span> {po.deliveryAddress}</p>}
            {po.termsAndConditions && (
              <p><span className="text-muted-foreground">Terms:</span> {po.termsAndConditions}</p>
            )}
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

      {!editing && (
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
      )}

      {editing && (
        <Card>
          <CardHeader><CardTitle>Edit Line Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.materialName}</TableCell>
                    <TableCell>
                      <Input className="w-20" type="number" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} />
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Input className="w-28" type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input className="w-20" type="number" step="0.01" value={item.gstPercent} onChange={(e) => updateItem(index, "gstPercent", e.target.value)} />
                    </TableCell>
                    <TableCell className="font-medium">{parseFloat(item.totalPrice || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right text-sm">
              <p>Subtotal: <span className="font-medium">{total.toFixed(2)}</span></p>
              <p>GST: <span className="font-medium">{gstTotal.toFixed(2)}</span></p>
              <p className="text-lg font-bold">Grand Total: {(total + gstTotal).toFixed(2)}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Delivery Date</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Delivery Address</Label>
                <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Terms & Conditions</Label>
              <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(false)} disabled={actionLoading}>Cancel</Button>
              <Button variant="outline" onClick={() => saveEdits(false)} disabled={actionLoading}>Save Draft</Button>
              <Button onClick={() => saveEdits(true)} disabled={actionLoading}>
                {actionLoading ? "Submitting..." : "Save & Resubmit for Approval"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isHoP && po.status === "PENDING_APPROVAL" && (
        <Card>
          <CardHeader><CardTitle>Approval</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Rejection reason (required for rejection)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Why is this PO being rejected?"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={approve} disabled={actionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {actionLoading ? "Working..." : "Approve & Send to Vendor"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={reject}
                disabled={actionLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

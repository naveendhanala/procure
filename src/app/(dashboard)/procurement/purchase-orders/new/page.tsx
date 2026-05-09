"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewPOPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const indentId = searchParams.get("indentId");
  const quoteIdParam = searchParams.get("quoteId");
  const [indent, setIndent] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [terms, setTerms] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (indentId) {
      fetch(`/api/indents/${indentId}`)
        .then((r) => r.json())
        .then((data) => {
          setIndent(data);
          setDeliveryAddress(data.site?.address || "");

          const allQuotes = (data.rfqs ?? []).flatMap((r: any) => r.quotes ?? []);
          const chosen = allQuotes.length > 0
            ? (quoteIdParam
                ? allQuotes.find((q: any) => q.id === quoteIdParam)
                : allQuotes.reduce(
                    (best: any, q: any) =>
                      !best || Number(q.totalAmount) < Number(best.totalAmount) ? q : best,
                    null
                  ))
            : null;

          if (chosen) {
            setSelectedVendor(chosen.vendor.id);
            setItems(
              chosen.items.map((qi: any) => ({
                materialId: qi.materialId,
                materialName: qi.material?.name || qi.materialId,
                quantity: Number(qi.quantity),
                unit: qi.unit,
                unitPrice: Number(qi.unitPrice),
                gstPercent: qi.gstPercent ? Number(qi.gstPercent) : 18,
                totalPrice: Number(qi.totalPrice),
              }))
            );
          } else {
            setItems(
              data.items.map((item: any) => ({
                materialId: item.materialId,
                materialName: item.material?.name || item.materialId,
                quantity: Number(item.quantity),
                unit: item.unit,
                unitPrice: 0,
                gstPercent: 18,
                totalPrice: 0,
              }))
            );
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indentId, quoteIdParam]);

  function updateItem(index: number, field: string, value: string) {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].totalPrice = (qty * price).toFixed(2);
    setItems(updated);
  }

  const total = items.reduce((sum, i) => sum + (parseFloat(i.totalPrice) || 0), 0);
  const gstTotal = items.reduce(
    (sum, i) => sum + ((parseFloat(i.totalPrice) || 0) * (parseFloat(i.gstPercent) || 0)) / 100,
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!indentId || !selectedVendor || items.length === 0) return;
    setLoading(true);

    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        indentId,
        vendorId: selectedVendor,
        deliveryDate: deliveryDate || null,
        deliveryAddress,
        termsAndConditions: terms || null,
        remarks: remarks || null,
        items: items.map((item) => ({
          materialId: item.materialId,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitPrice: parseFloat(item.unitPrice),
          gstPercent: parseFloat(item.gstPercent) || null,
          totalPrice: parseFloat(item.totalPrice),
        })),
      }),
    });

    if (res.ok) {
      const po = await res.json();
      router.push(`/procurement/purchase-orders/${po.id}`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  }

  if (!indent) return <p className="text-muted-foreground">Loading...</p>;

  const availableVendors = indent.rfqs
    ?.flatMap((r: any) => r.quotes)
    ?.map((q: any) => q.vendor)
    ?.filter((v: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === v.id) === i) || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Create Purchase Order" description={`For indent ${indent.indentNumber}`} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>PO Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {availableVendors.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delivery Address</Label>
              <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, delivery terms, etc." />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent>
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
            <div className="mt-4 text-right space-y-1">
              <p className="text-sm">Subtotal: <span className="font-medium">{total.toFixed(2)}</span></p>
              <p className="text-sm">GST: <span className="font-medium">{gstTotal.toFixed(2)}</span></p>
              <p className="text-lg font-bold">Grand Total: {(total + gstTotal).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !selectedVendor}>{loading ? "Submitting..." : "Submit for HoP Approval"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

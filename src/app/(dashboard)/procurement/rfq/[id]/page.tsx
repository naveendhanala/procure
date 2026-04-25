"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

export default function RFQDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState<any>(null);
  const [quoteDialog, setQuoteDialog] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRFQ();
  }, [params.id]);

  async function fetchRFQ() {
    const data = await fetch(`/api/rfq/${params.id}`).then((r) => r.json());
    setRfq(data);
  }

  function openQuoteEntry(vendor: any) {
    setQuoteDialog(vendor);
    setQuoteItems(
      rfq.items.map((item: any) => ({
        materialId: item.material.id,
        materialName: item.material.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: "",
        gstPercent: "",
        totalPrice: "",
      }))
    );
  }

  function updateQuoteItem(index: number, field: string, value: string) {
    const updated = [...quoteItems];
    (updated[index] as any)[field] = value;

    if (field === "unitPrice" || field === "quantity") {
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].unitPrice) || 0;
      updated[index].totalPrice = (qty * price).toFixed(2);
    }

    setQuoteItems(updated);
  }

  async function saveQuote() {
    if (!quoteDialog) return;
    setSaving(true);

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rfqId: rfq.id,
        vendorId: quoteDialog.vendor.id,
        items: quoteItems.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: parseFloat(item.unitPrice) || 0,
          gstPercent: parseFloat(item.gstPercent) || null,
          totalPrice: parseFloat(item.totalPrice) || 0,
        })),
      }),
    });

    if (res.ok) {
      setQuoteDialog(null);
      await fetchRFQ();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setSaving(false);
  }

  if (!rfq) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={rfq.rfqNumber}>
        <StatusBadge status={rfq.status} />
        <Button variant="outline" onClick={() => router.push("/procurement")}>Back</Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>RFQ Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Indent:</span> {rfq.indent.indentNumber}</p>
            <p><span className="text-muted-foreground">Site:</span> {rfq.indent.site?.name}</p>
            <p><span className="text-muted-foreground">Created By:</span> {rfq.createdBy.name}</p>
            {rfq.dueDate && <p><span className="text-muted-foreground">Due Date:</span> {formatDate(rfq.dueDate)}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vendors ({rfq.vendors.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rfq.vendors.map((rv: any) => {
                const hasQuote = rfq.quotes.some((q: any) => q.vendor.id === rv.vendor.id);
                return (
                  <div key={rv.id} className="flex items-center justify-between rounded-md border p-3">
                    <span className="font-medium">{rv.vendor.name}</span>
                    {hasQuote ? (
                      <Badge variant="success">Quote Received</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => openQuoteEntry(rv)}>
                        Enter Quote
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfq.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.material.name} ({item.material.code})</TableCell>
                  <TableCell>{Number(item.quantity)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {rfq.quotes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Quote Comparison</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  {rfq.quotes.map((q: any) => (
                    <TableHead key={q.id} className="text-center">{q.vendor.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.items.map((item: any) => {
                  const prices = rfq.quotes.map((q: any) => {
                    const qi = q.items.find((qi: any) => qi.materialId === item.materialId);
                    return qi ? Number(qi.unitPrice) : null;
                  });
                  const minPrice = Math.min(...prices.filter((p: any) => p !== null));

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.material.name}</TableCell>
                      {rfq.quotes.map((q: any, idx: number) => {
                        const qi = q.items.find((qi: any) => qi.materialId === item.materialId);
                        const price = qi ? Number(qi.unitPrice) : null;
                        const isLowest = price === minPrice;
                        return (
                          <TableCell key={q.id} className={`text-center ${isLowest ? "font-bold text-green-600" : ""}`}>
                            {price !== null ? `${price.toFixed(2)}` : "-"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
                <TableRow className="font-medium">
                  <TableCell>Total</TableCell>
                  {rfq.quotes.map((q: any) => (
                    <TableCell key={q.id} className="text-center">
                      {q.totalAmount ? Number(q.totalAmount).toFixed(2) : "-"}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!quoteDialog} onOpenChange={() => setQuoteDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Enter Quote from {quoteDialog?.vendor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {quoteItems.map((item, index) => (
              <div key={index} className="grid grid-cols-5 gap-3 items-end">
                <div className="col-span-2">
                  <Label className="text-xs">{item.materialName}</Label>
                  <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                </div>
                <div>
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateQuoteItem(index, "unitPrice", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-xs">GST %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.gstPercent}
                    onChange={(e) => updateQuoteItem(index, "gstPercent", e.target.value)}
                    placeholder="18"
                  />
                </div>
                <div>
                  <Label className="text-xs">Total</Label>
                  <Input value={item.totalPrice} disabled />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteDialog(null)}>Cancel</Button>
            <Button onClick={saveQuote} disabled={saving}>{saving ? "Saving..." : "Save Quote"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

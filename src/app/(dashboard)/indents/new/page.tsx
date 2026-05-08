"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package } from "lucide-react";

interface Material {
  id: string;
  name: string;
  code: string;
  unit: string;
  category: string;
}

interface MaterialStats {
  totalIndented: number;
  totalReceived: number;
  inTransit: number;
  withProcurement: number;
  pendingInOtherIndents: number;
}

interface IndentItem {
  materialId: string;
  material?: Material;
  quantity: string;
  unit: string;
  purposeOfUse: string;
  remarks: string;
  currentStock: number | null;
  stats: MaterialStats | null;
  history: HistoryRow[] | null;
}

interface HistoryRow {
  indentId: string;
  indentNumber: string;
  status: string;
  purposeOfUse: string | null;
  quantityIndented: number;
  quantityUsed: number;
  balanceQuantity: number;
  unit: string;
}

export default function NewIndentPage() {
  const router = useRouter();
  const { siteRoles } = useCurrentUser();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [requiredDate, setRequiredDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<IndentItem[]>([]);

  const storeSites = siteRoles.filter((sr) => sr.role === "STORE_MANAGER");

  useEffect(() => {
    fetch("/api/materials").then((r) => r.json()).then(setMaterials);
    if (storeSites.length === 1) setSiteId(storeSites[0].siteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addItem() {
    setItems([
      ...items,
      {
        materialId: "",
        quantity: "",
        unit: "",
        purposeOfUse: "",
        remarks: "",
        currentStock: null,
        stats: null,
        history: null,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function updateItemMaterial(index: number, materialId: string) {
    const mat = materials.find((m) => m.id === materialId);
    const updated = [...items];
    updated[index].materialId = materialId;
    updated[index].material = mat;
    updated[index].unit = mat?.unit || "";
    updated[index].currentStock = null;
    updated[index].stats = null;
    updated[index].history = null;

    if (siteId && materialId) {
      const [invRes, statsRes, historyRes] = await Promise.all([
        fetch(`/api/inventory?siteId=${siteId}&materialId=${materialId}`),
        fetch(`/api/material-stats?siteId=${siteId}&materialIds=${materialId}`),
        fetch(`/api/material-stats/history?siteId=${siteId}&materialId=${materialId}`),
      ]);
      const inv = await invRes.json();
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      updated[index].currentStock = inv.length > 0 ? Number(inv[0].quantity) : 0;
      updated[index].stats = statsData[materialId] ?? null;
      updated[index].history = Array.isArray(historyData) ? historyData : [];
    }

    setItems([...updated]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!siteId || items.length === 0) return;
    setLoading(true);

    const res = await fetch("/api/indents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId,
        priority,
        requiredDate: requiredDate || null,
        remarks: remarks || null,
        items: items.map((item) => ({
          materialId: item.materialId,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          purposeOfUse: item.purposeOfUse || null,
          remarks: item.remarks || null,
        })),
      }),
    });

    if (res.ok) {
      const indent = await res.json();
      router.push(`/indents/${indent.id}`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Material Indent" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Indent Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                  <SelectContent>
                    {storeSites.map((sr) => (
                      <SelectItem key={sr.siteId} value={sr.siteId}>{sr.siteCode} - {sr.siteName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Required By</Label>
                <Input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any additional notes..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Materials</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="mr-1 h-3 w-3" />Add Material
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No materials added. Click &ldquo;Add Material&rdquo; to start.
              </p>
            )}
            {items.map((item, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Material</Label>
                    <Select value={item.materialId} onValueChange={(val) => updateItemMaterial(index, val)}>
                      <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                      <SelectContent>
                        {materials.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.code} - {mat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].quantity = e.target.value;
                        setItems(updated);
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Unit</Label>
                    <Input value={item.unit} disabled />
                  </div>
                  <Button type="button" size="icon" variant="ghost" className="mt-7" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {item.currentStock !== null && (
                  <div className="rounded-md bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Material Status at Site</span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm pl-6">
                      <div>
                        Current Stock:{" "}
                        <span className={`font-medium ${item.currentStock > 0 ? "text-green-600" : "text-orange-600"}`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      {item.stats && (
                        <>
                          <div>
                            Total Indented:{" "}
                            <span className="font-medium">{item.stats.totalIndented} {item.unit}</span>
                          </div>
                          <div>
                            Total Received:{" "}
                            <span className="font-medium text-green-600">{item.stats.totalReceived} {item.unit}</span>
                          </div>
                          <div>
                            In Transit (PO Raised):{" "}
                            <span className="font-medium text-blue-600">{item.stats.inTransit} {item.unit}</span>
                          </div>
                          <div>
                            With Procurement:{" "}
                            <span className="font-medium text-amber-600">{item.stats.withProcurement} {item.unit}</span>
                          </div>
                          <div>
                            In Other Pending Indents:{" "}
                            <span className="font-medium text-purple-600">{item.stats.pendingInOtherIndents} {item.unit}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {item.history && item.history.length > 0 && (
                  <div className="rounded-md border p-3 space-y-2">
                    <div className="text-sm font-medium">
                      Previous Indents with Balance Quantity
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b">
                            <th className="py-1 pr-3">Indent No</th>
                            <th className="py-1 pr-3">Status</th>
                            <th className="py-1 pr-3 text-right">Qty Indented</th>
                            <th className="py-1 pr-3 text-right">Qty Used</th>
                            <th className="py-1 pr-3 text-right">Balance</th>
                            <th className="py-1">Purpose of Use</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.history.map((h) => (
                            <tr key={h.indentId} className="border-b last:border-b-0">
                              <td className="py-1 pr-3 font-medium">{h.indentNumber}</td>
                              <td className="py-1 pr-3">{h.status}</td>
                              <td className="py-1 pr-3 text-right">{h.quantityIndented} {h.unit}</td>
                              <td className="py-1 pr-3 text-right">{h.quantityUsed} {h.unit}</td>
                              <td className="py-1 pr-3 text-right font-medium">{h.balanceQuantity} {h.unit}</td>
                              <td className="py-1 text-muted-foreground">{h.purposeOfUse || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Purpose of Use</Label>
                  <Input
                    placeholder="e.g. Tower B foundation slab"
                    required
                    value={item.purposeOfUse}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[index].purposeOfUse = e.target.value;
                      setItems(updated);
                    }}
                  />
                </div>

                <Input
                  placeholder="Item remarks (optional)"
                  value={item.remarks}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[index].remarks = e.target.value;
                    setItems(updated);
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !siteId || items.length === 0}>
            {loading ? "Creating..." : "Create Indent (Draft)"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

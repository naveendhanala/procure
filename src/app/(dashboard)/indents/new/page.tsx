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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package } from "lucide-react";

interface Material {
  id: string;
  name: string;
  code: string;
  unit: string;
  category: string;
}

interface IndentItem {
  materialId: string;
  material?: Material;
  quantity: string;
  unit: string;
  remarks: string;
  currentStock: number | null;
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

  const pmSites = siteRoles.filter((sr) => sr.role === "PROJECT_MANAGER");

  useEffect(() => {
    fetch("/api/materials").then((r) => r.json()).then(setMaterials);
    if (pmSites.length === 1) setSiteId(pmSites[0].siteId);
  }, []);

  function addItem() {
    setItems([...items, { materialId: "", quantity: "", unit: "", remarks: "", currentStock: null }]);
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

    if (siteId && materialId) {
      const res = await fetch(`/api/inventory?siteId=${siteId}&materialId=${materialId}`);
      const inv = await res.json();
      updated[index].currentStock = inv.length > 0 ? Number(inv[0].quantity) : 0;
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
                    {pmSites.map((sr) => (
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
                  <div className="flex items-center gap-2 pl-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Current Stock at Site:{" "}
                      <span className={`font-medium ${item.currentStock > 0 ? "text-green-600" : "text-orange-600"}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </span>
                  </div>
                )}

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

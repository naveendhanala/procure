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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function NewGRNPage() {
  const router = useRouter();
  const { siteRoles } = useCurrentUser();
  const [pos, setPOs] = useState<any[]>([]);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [siteId, setSiteId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [challanNumber, setChallanNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const smSites = siteRoles.filter((sr) => sr.role === "STORE_MANAGER");

  useEffect(() => {
    if (smSites.length === 1) setSiteId(smSites[0].siteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (siteId) {
      fetch("/api/purchase-orders")
        .then((r) => r.json())
        .then((allPOs) => {
          const sitePOs = allPOs.filter(
            (po: any) =>
              po.indent?.site?.id === siteId &&
              (po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED")
          );
          setPOs(sitePOs);
        })
        .catch(() => setPOs([]));
    }
  }, [siteId]);

  function selectPO(poId: string) {
    fetch(`/api/purchase-orders/${poId}`)
      .then((r) => r.json())
      .then((po) => {
        setSelectedPO(po);
        setItems(
          po.items.map((item: any) => ({
            materialId: item.materialId,
            materialName: item.material?.name || "",
            orderedQuantity: Number(item.quantity),
            unit: item.unit,
            receivedQuantity: "",
            acceptedQuantity: "",
            rejectedQuantity: "0",
            remarks: "",
          }))
        );
      });
  }

  function updateItem(index: number, field: string, value: string) {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    if (field === "receivedQuantity") {
      updated[index].acceptedQuantity = value;
      updated[index].rejectedQuantity = "0";
    }

    setItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPO || !siteId) return;
    setLoading(true);

    const res = await fetch("/api/grn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poId: selectedPO.id,
        siteId,
        vehicleNumber: vehicleNumber || null,
        challanNumber: challanNumber || null,
        remarks: remarks || null,
        items: items.map((item) => ({
          materialId: item.materialId,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: parseFloat(item.receivedQuantity) || 0,
          acceptedQuantity: parseFloat(item.acceptedQuantity) || 0,
          rejectedQuantity: parseFloat(item.rejectedQuantity) || 0,
          unit: item.unit,
          remarks: item.remarks || null,
        })),
      }),
    });

    if (res.ok) {
      const grn = await res.json();
      router.push(`/grn/${grn.id}`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Record Goods Receipt" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>GRN Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                  <SelectContent>
                    {smSites.map((sr) => (
                      <SelectItem key={sr.siteId} value={sr.siteId}>{sr.siteCode} - {sr.siteName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Purchase Order</Label>
                <Select value={selectedPO?.id || ""} onValueChange={selectPO}>
                  <SelectTrigger><SelectValue placeholder="Select PO" /></SelectTrigger>
                  <SelectContent>
                    {pos.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.poNumber} - {po.vendor?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="e.g., MH01-AB-1234" />
              </div>
              <div className="space-y-2">
                <Label>Challan Number</Label>
                <Input value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} placeholder="Delivery challan no." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any observations..." />
            </div>
          </CardContent>
        </Card>

        {selectedPO && (
          <Card>
            <CardHeader><CardTitle>Material Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Accepted</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.materialName}</TableCell>
                      <TableCell>{item.orderedQuantity}</TableCell>
                      <TableCell>
                        <Input
                          className="w-24"
                          type="number"
                          step="0.001"
                          value={item.receivedQuantity}
                          onChange={(e) => updateItem(index, "receivedQuantity", e.target.value)}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-24"
                          type="number"
                          step="0.001"
                          value={item.acceptedQuantity}
                          onChange={(e) => updateItem(index, "acceptedQuantity", e.target.value)}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-24"
                          type="number"
                          step="0.001"
                          value={item.rejectedQuantity}
                          onChange={(e) => updateItem(index, "rejectedQuantity", e.target.value)}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !selectedPO}>
            {loading ? "Creating..." : "Create GRN (Draft)"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function NewRFQPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const indentId = searchParams.get("indentId");
  const [indent, setIndent] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (indentId) {
      fetch(`/api/indents/${indentId}`).then((r) => r.json()).then(setIndent);
    }
    fetch("/api/vendors").then((r) => r.json()).then(setVendors);
  }, [indentId]);

  function toggleVendor(vendorId: string) {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!indentId || selectedVendors.length === 0) return;
    setLoading(true);

    const res = await fetch("/api/rfq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        indentId,
        vendorIds: selectedVendors,
        dueDate: dueDate || null,
        remarks: remarks || null,
      }),
    });

    if (res.ok) {
      const rfq = await res.json();
      router.push(`/procurement/rfq/${rfq.id}`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  }

  if (!indent) return <p className="text-muted-foreground">Loading...</p>;

  const indentCategories = Array.from(new Set(indent.items.map((i: any) => i.material.category)));
  const suggestedVendors = vendors.filter((v: any) =>
    v.categories.some((c: any) => indentCategories.includes(c.category))
  );
  const otherVendors = vendors.filter(
    (v: any) => !suggestedVendors.find((sv: any) => sv.id === v.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Create RFQ" description={`For indent ${indent.indentNumber}`} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Indent Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indent.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.material.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.material.category}</Badge></TableCell>
                    <TableCell>{Number(item.quantity)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Select Vendors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {suggestedVendors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Suggested (matching categories)</h4>
                <div className="space-y-2">
                  {suggestedVendors.map((v: any) => (
                    <label key={v.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(v.id)}
                        onChange={() => toggleVendor(v.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{v.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{v.code}</span>
                      </div>
                      <div className="flex gap-1">
                        {v.categories.map((c: any) => (
                          <Badge key={c.id} variant="outline" className="text-xs">{c.category}</Badge>
                        ))}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {otherVendors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Other Vendors</h4>
                <div className="space-y-2">
                  {otherVendors.map((v: any) => (
                    <label key={v.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(v.id)}
                        onChange={() => toggleVendor(v.id)}
                        className="h-4 w-4"
                      />
                      <span className="font-medium">{v.name}</span>
                      <span className="text-sm text-muted-foreground">{v.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>RFQ Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quote Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Special instructions for vendors..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || selectedVendors.length === 0}>
            {loading ? "Creating..." : `Create RFQ (${selectedVendors.length} vendors)`}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

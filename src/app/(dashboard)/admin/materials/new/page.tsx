"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UNITS = [
  "NOS", "KG", "TONNES", "METERS", "SQ_METERS", "CU_METERS",
  "LITERS", "BAGS", "BUNDLES", "ROLLS", "SHEETS", "SETS", "BOXES",
];

const CATEGORIES = [
  "Cement", "Steel", "Sand & Aggregate", "Bricks & Blocks", "Plywood",
  "Electrical", "Plumbing", "Finishing", "Tiles", "Hardware", "Paint", "Other",
];

export default function NewMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        code: form.get("code"),
        description: form.get("description"),
        category,
        unit,
        hsnCode: form.get("hsnCode"),
      }),
    });

    if (res.ok) router.push("/admin/materials");
    else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Material" />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Material Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Material Name</Label>
                <Input name="name" required placeholder="e.g., OPC Cement 53 Grade" />
              </div>
              <div className="space-y-2">
                <Label>Material Code</Label>
                <Input name="code" required placeholder="e.g., MAT-CEM-001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit of Measure</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input name="hsnCode" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !unit || !category}>{loading ? "Creating..." : "Create Material"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

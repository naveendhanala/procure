"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const CATEGORIES = [
  "Cement", "Steel", "Sand & Aggregate", "Bricks & Blocks", "Plywood",
  "Electrical", "Plumbing", "Finishing", "Tiles", "Hardware", "Paint", "Other",
];

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        code: form.get("code"),
        contactPerson: form.get("contactPerson"),
        email: form.get("email"),
        phone: form.get("phone"),
        address: form.get("address"),
        city: form.get("city"),
        state: form.get("state"),
        gstNumber: form.get("gstNumber"),
        panNumber: form.get("panNumber"),
        bankName: form.get("bankName"),
        bankAccountNo: form.get("bankAccountNo"),
        bankIfscCode: form.get("bankIfscCode"),
        categories,
      }),
    });

    if (res.ok) router.push("/admin/vendors");
    else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Vendor" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader><CardTitle>Vendor Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Vendor Name</Label><Input name="name" required /></div>
              <div className="space-y-2"><Label>Vendor Code</Label><Input name="code" required placeholder="e.g., VEN-006" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Contact Person</Label><Input name="contactPerson" /></div>
              <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input name="address" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>City</Label><Input name="city" /></div>
              <div className="space-y-2"><Label>State</Label><Input name="state" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tax & Bank Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>GST Number</Label><Input name="gstNumber" /></div>
              <div className="space-y-2"><Label>PAN Number</Label><Input name="panNumber" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Bank Name</Label><Input name="bankName" /></div>
              <div className="space-y-2"><Label>Account No</Label><Input name="bankAccountNo" /></div>
              <div className="space-y-2"><Label>IFSC Code</Label><Input name="bankIfscCode" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Material Categories Supplied</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={categories.includes(cat) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                  {categories.includes(cat) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Vendor"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface VendorCategory {
  id: string;
  category: string;
}

interface Vendor {
  id: string;
  name: string;
  code: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankIfscCode: string | null;
  isActive: boolean;
  categories: VendorCategory[];
}

const FIELDS = [
  "name", "code", "contactPerson", "email", "phone", "address", "city",
  "state", "gstNumber", "panNumber", "bankName", "bankAccountNo", "bankIfscCode",
] as const;

type EditableField = (typeof FIELDS)[number];

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<EditableField, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<EditableField, string>
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/vendors/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Vendor not found");
        return r.json();
      })
      .then((data: Vendor) => {
        setVendor(data);
        setForm(
          Object.fromEntries(
            FIELDS.map((f) => [f, (data[f] as string | null) ?? ""])
          ) as Record<EditableField, string>
        );
        setSelectedCategories(data.categories.map((c) => c.category));
      })
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function update(field: EditableField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, string | null> = {};
    for (const f of FIELDS) {
      payload[f] = form[f]?.trim() ? form[f].trim() : null;
    }
    payload.name = form.name.trim();
    payload.code = form.code.trim();

    const res = await fetch(`/api/vendors/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, categories: selectedCategories }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVendor(updated);
      setEditing(false);
    } else {
      const err = await res.json();
      alert(err.error || "Failed to update vendor");
    }
    setSaving(false);
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!vendor) return <p className="text-muted-foreground">Vendor not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={vendor.name} description={vendor.code}>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/admin/vendors")}>
          Back
        </Button>
      </PageHeader>

      <form onSubmit={save} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader><CardTitle>Vendor Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vendor Name" name="name" form={form} editing={editing} update={update} required />
              <Field label="Vendor Code" name="code" form={form} editing={editing} update={update} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Contact Person" name="contactPerson" form={form} editing={editing} update={update} />
              <Field label="Email" name="email" form={form} editing={editing} update={update} type="email" />
              <Field label="Phone" name="phone" form={form} editing={editing} update={update} />
            </div>
            <Field label="Address" name="address" form={form} editing={editing} update={update} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" name="city" form={form} editing={editing} update={update} />
              <Field label="State" name="state" form={form} editing={editing} update={update} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tax & Bank Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="GST Number" name="gstNumber" form={form} editing={editing} update={update} />
              <Field label="PAN Number" name="panNumber" form={form} editing={editing} update={update} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Bank Name" name="bankName" form={form} editing={editing} update={update} />
              <Field label="Account No" name="bankAccountNo" form={form} editing={editing} update={update} />
              <Field label="IFSC Code" name="bankIfscCode" form={form} editing={editing} update={update} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Material Categories Supplied</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(editing ? CATEGORIES : selectedCategories.length ? selectedCategories : ["—"]).map((cat) => {
                if (!editing) {
                  return (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  );
                }
                return (
                  <Badge
                    key={cat}
                    variant={selectedCategories.includes(cat) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                    {selectedCategories.includes(cat) && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {editing && (
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setForm(
                  Object.fromEntries(
                    FIELDS.map((f) => [f, (vendor[f] as string | null) ?? ""])
                  ) as Record<EditableField, string>
                );
                setSelectedCategories(vendor.categories.map((c) => c.category));
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: EditableField;
  form: Record<EditableField, string>;
  editing: boolean;
  update: (f: EditableField, v: string) => void;
  type?: string;
  required?: boolean;
}

function Field({ label, name, form, editing, update, type, required }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {editing ? (
        <Input
          type={type}
          required={required}
          value={form[name]}
          onChange={(e) => update(name, e.target.value)}
        />
      ) : (
        <p className="text-sm py-2 min-h-[40px]">{form[name] || "—"}</p>
      )}
    </div>
  );
}

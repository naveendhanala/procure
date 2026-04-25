"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const ALL_ROLES = [
  "SUPER_ADMIN", "PROJECT_MANAGER", "CLUSTER_HEAD", "VICE_PRESIDENT",
  "HEAD_OF_PROCUREMENT", "PROCUREMENT_TEAM_MEMBER", "STORE_MANAGER",
];

function formatRole(role: string): string {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<{ siteId: string; role: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${params.id}`).then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
    ]).then(([userData, sitesData]) => {
      setUser(userData);
      setSites(sitesData);
      setAssignments(
        userData.siteAssignments.map((sa: any) => ({
          siteId: sa.site.id,
          role: sa.role,
        }))
      );
    });
  }, [params.id]);

  function addAssignment() {
    setAssignments([...assignments, { siteId: "", role: "" }]);
  }

  function removeAssignment(index: number) {
    setAssignments(assignments.filter((_, i) => i !== index));
  }

  function updateAssignment(index: number, field: string, value: string) {
    const updated = [...assignments];
    (updated[index] as any)[field] = value;
    setAssignments(updated);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const body: any = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      siteAssignments: assignments.filter((a) => a.siteId && a.role),
    };

    const pw = form.get("password") as string;
    if (pw) body.password = pw;

    const res = await fetch(`/api/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) router.push("/admin/users");
    else {
      const err = await res.json();
      alert(err.error);
    }
    setSaving(false);
  }

  if (!user) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit User: ${user.name}`}>
        <Button variant="outline" onClick={() => router.push("/admin/users")}>Back</Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader><CardTitle>User Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" defaultValue={user.name} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={user.email} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Password (leave blank to keep)</Label>
                <Input name="password" type="password" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" defaultValue={user.phone || ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Site & Role Assignments</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addAssignment}>
                <Plus className="mr-1 h-3 w-3" />Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.map((assignment, index) => (
              <div key={index} className="flex items-center gap-3">
                <Select value={assignment.siteId} onValueChange={(val) => updateAssignment(index, "siteId", val)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select Site" /></SelectTrigger>
                  <SelectContent>
                    {sites.map((site: any) => (
                      <SelectItem key={site.id} value={site.id}>{site.code} - {site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={assignment.role} onValueChange={(val) => updateAssignment(index, "role", val)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{formatRole(role)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeAssignment(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

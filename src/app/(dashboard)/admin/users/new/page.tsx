"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const ALL_ROLES = [
  "SUPER_ADMIN", "PROJECT_MANAGER", "CLUSTER_HEAD", "VICE_PRESIDENT",
  "HEAD_OF_STORES", "HEAD_OF_PROCUREMENT", "PROCUREMENT_TEAM_MEMBER",
  "STORE_MANAGER",
];

function formatRole(role: string): string {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<{ siteId: string; role: string }[]>([]);

  useEffect(() => {
    fetch("/api/sites").then((res) => res.json()).then(setSites);
  }, []);

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
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        phone: form.get("phone"),
        siteAssignments: assignments.filter((a) => a.siteId && a.role),
      }),
    });

    if (res.ok) {
      router.push("/admin/users");
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add New User" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader><CardTitle>User Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Site & Role Assignments</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addAssignment}>
                <Plus className="mr-1 h-3 w-3" />Add Assignment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.length === 0 && (
              <p className="text-sm text-muted-foreground">No assignments yet. Click &ldquo;Add Assignment&rdquo; to assign sites and roles.</p>
            )}
            {assignments.map((assignment, index) => (
              <div key={index} className="flex items-center gap-3">
                <Select value={assignment.siteId} onValueChange={(val) => updateAssignment(index, "siteId", val)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select Site" /></SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
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
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create User"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";

const APPROVAL_ROLES = [
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "CLUSTER_HEAD", label: "Cluster Head" },
  { value: "VICE_PRESIDENT", label: "Vice President" },
  { value: "HEAD_OF_STORES", label: "Head of Stores" },
];

function formatRole(role: string): string {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [site, setSite] = useState<any>(null);
  const [workflow, setWorkflow] = useState<{ stepOrder: number; role: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/sites/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSite(data);
        setWorkflow(data.approvalWorkflow.map((s: any) => ({ stepOrder: s.stepOrder, role: s.role })));
      });
  }, [params.id]);

  function addStep() {
    const usedRoles = workflow.map((s) => s.role);
    const available = APPROVAL_ROLES.find((r) => !usedRoles.includes(r.value));
    if (!available) return;
    setWorkflow([...workflow, { stepOrder: workflow.length + 1, role: available.value }]);
  }

  function removeStep(index: number) {
    const updated = workflow.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 }));
    setWorkflow(updated);
  }

  function updateStepRole(index: number, role: string) {
    const updated = [...workflow];
    updated[index].role = role;
    setWorkflow(updated);
  }

  async function saveWorkflow() {
    setSaving(true);
    await fetch(`/api/sites/${params.id}/workflow`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps: workflow }),
    });
    setSaving(false);
  }

  if (!site) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={site.name} description={`Site Code: ${site.code}`}>
        <Button variant="outline" onClick={() => router.push("/admin/sites")}>Back to Sites</Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Site Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Address:</span> {site.address || "-"}</p>
            <p><span className="font-medium">City:</span> {site.city || "-"}</p>
            <p><span className="font-medium">State:</span> {site.state || "-"}</p>
            <p><span className="font-medium">Status:</span>{" "}
              <Badge variant={site.isActive ? "success" : "secondary"}>{site.isActive ? "Active" : "Inactive"}</Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Approval Workflow</CardTitle>
              <Button size="sm" variant="outline" onClick={addStep} disabled={workflow.length >= APPROVAL_ROLES.length}>
                <Plus className="mr-1 h-3 w-3" />Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflow.length === 0 && (
              <p className="text-sm text-muted-foreground">No approval steps configured. Add at least one step.</p>
            )}
            {workflow.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <Badge variant="outline" className="w-20 justify-center">Step {step.stepOrder}</Badge>
                <Select value={step.role} onValueChange={(val) => updateStepRole(index, val)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPROVAL_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={() => removeStep(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {workflow.length > 0 && (
              <Button onClick={saveWorkflow} disabled={saving} className="mt-2">
                <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Workflow"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Assigned Users</CardTitle></CardHeader>
        <CardContent>
          {site.userAssignments?.length === 0 && (
            <p className="text-sm text-muted-foreground">No users assigned to this site.</p>
          )}
          <div className="space-y-2">
            {site.userAssignments?.map((ua: any) => (
              <div key={ua.id} className="flex items-center gap-3">
                <span className="text-sm font-medium">{ua.user.name}</span>
                <span className="text-sm text-muted-foreground">{ua.user.email}</span>
                <Badge variant="secondary">{formatRole(ua.role)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { UserPlus } from "lucide-react";

export default function ProcurementPage() {
  const { siteRoles } = useCurrentUser();
  const [indents, setIndents] = useState<any[]>([]);
  const [ptmUsers, setPtmUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialog, setAssignDialog] = useState<any>(null);
  const [selectedPTM, setSelectedPTM] = useState("");
  const [assigning, setAssigning] = useState(false);

  const isHoP = siteRoles.some((sr) => sr.role === "HEAD_OF_PROCUREMENT");

  useEffect(() => {
    fetch("/api/indents")
      .then((r) => r.json())
      .then(setIndents)
      .finally(() => setLoading(false));

    if (isHoP) {
      fetch("/api/users")
        .then((r) => r.json())
        .then((users) => {
          const ptms = users.filter((u: any) =>
            u.siteAssignments.some((sa: any) => sa.role === "PROCUREMENT_TEAM_MEMBER")
          );
          setPtmUsers(ptms);
        })
        .catch(() => {});
    }
  }, [isHoP]);

  const approvedIndents = indents.filter((i) => i.status === "APPROVED");
  const assignedIndents = indents.filter((i) =>
    ["ASSIGNED", "RFQ_SENT", "QUOTES_RECEIVED", "PO_CREATED"].includes(i.status)
  );

  async function handleAssign() {
    if (!assignDialog || !selectedPTM) return;
    setAssigning(true);
    const res = await fetch(`/api/indents/${assignDialog.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: selectedPTM }),
    });
    if (res.ok) {
      const updated = await fetch("/api/indents").then((r) => r.json());
      setIndents(updated);
      setAssignDialog(null);
      setSelectedPTM("");
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setAssigning(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Procurement" description="Manage procurement pipeline" />

      {isHoP && approvedIndents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Approved Indents ({approvedIndents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indent No.</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedIndents.map((indent) => (
                  <TableRow key={indent.id}>
                    <TableCell>
                      <Link href={`/indents/${indent.id}`} className="font-medium text-primary hover:underline">
                        {indent.indentNumber}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="outline">{indent.site.code}</Badge></TableCell>
                    <TableCell>{indent.createdBy.name}</TableCell>
                    <TableCell>{indent._count.items} items</TableCell>
                    <TableCell className="text-sm">{formatDate(indent.createdAt)}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setAssignDialog(indent)}>
                        <UserPlus className="mr-1 h-3 w-3" />Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Pipeline ({assignedIndents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedIndents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active procurement items.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indent No.</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedIndents.map((indent) => (
                  <TableRow key={indent.id}>
                    <TableCell>
                      <Link href={`/indents/${indent.id}`} className="font-medium text-primary hover:underline">
                        {indent.indentNumber}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="outline">{indent.site.code}</Badge></TableCell>
                    <TableCell>{indent.assignedTo?.name || "-"}</TableCell>
                    <TableCell>{indent._count.items} items</TableCell>
                    <TableCell><StatusBadge status={indent.status} /></TableCell>
                    <TableCell>
                      {indent.status === "ASSIGNED" && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/procurement/rfq/new?indentId=${indent.id}`}>Create RFQ</Link>
                        </Button>
                      )}
                      {indent.status === "QUOTES_RECEIVED" && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/procurement/purchase-orders/new?indentId=${indent.id}`}>Create PO</Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Procurement Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Assign indent <span className="font-medium">{assignDialog?.indentNumber}</span> to a team member.
            </p>
            <div className="space-y-2">
              <Label>Select Team Member</Label>
              <Select value={selectedPTM} onValueChange={setSelectedPTM}>
                <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>
                  {ptmUsers.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedPTM || assigning}>
              {assigning ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

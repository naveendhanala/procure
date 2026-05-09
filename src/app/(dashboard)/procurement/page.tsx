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
import { UserPlus, Inbox, AlertTriangle, Clock } from "lucide-react";

export default function ProcurementPage() {
  const { siteRoles } = useCurrentUser();
  const [indents, setIndents] = useState<any[]>([]);
  const [ptmUsers, setPtmUsers] = useState<any[]>([]);
  const [inbox, setInbox] = useState<{
    quotesReady: any[];
    awaitingQuotes: any[];
    overdue: any[];
  }>({ quotesReady: [], awaitingQuotes: [], overdue: [] });
  const [assignDialog, setAssignDialog] = useState<any>(null);
  const [selectedPTM, setSelectedPTM] = useState("");
  const [assigning, setAssigning] = useState(false);

  const isHoP = siteRoles.some((sr) => sr.role === "HEAD_OF_PROCUREMENT");

  useEffect(() => {
    fetch("/api/indents")
      .then((r) => r.json())
      .then(setIndents)

    fetch("/api/procurement/inbox")
      .then((r) => r.json())
      .then(setInbox)
      .catch(() => {});

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

      {inbox.quotesReady.length > 0 && (
        <Card className="border-green-200 bg-green-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="h-4 w-4 text-green-700" />
              Quotes received — ready to compare ({inbox.quotesReady.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inbox.quotesReady.map((rfq: any) => (
              <Link
                key={rfq.id}
                href={`/procurement/rfq/${rfq.id}`}
                className="flex items-center justify-between rounded-md border bg-white p-3 hover:bg-accent"
              >
                <div className="text-sm">
                  <div className="font-medium">{rfq.rfqNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    Indent {rfq.indent.indentNumber} · {rfq.indent.site?.code}
                  </div>
                </div>
                <Badge variant="success">
                  {rfq.submittedCount} / {rfq.vendorCount} quotes
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {inbox.overdue.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Overdue RFQs ({inbox.overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inbox.overdue.map((rfq: any) => (
              <Link
                key={rfq.id}
                href={`/procurement/rfq/${rfq.id}`}
                className="flex items-center justify-between rounded-md border bg-white p-3 hover:bg-accent"
              >
                <div className="text-sm">
                  <div className="font-medium">{rfq.rfqNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    Indent {rfq.indent.indentNumber} · due {formatDate(rfq.dueDate)}
                  </div>
                </div>
                <Badge variant="warning">
                  {rfq.submittedCount} / {rfq.vendorCount} quotes
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {inbox.awaitingQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Awaiting vendor quotes ({inbox.awaitingQuotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inbox.awaitingQuotes.map((rfq: any) => (
              <Link
                key={rfq.id}
                href={`/procurement/rfq/${rfq.id}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
              >
                <div className="text-sm">
                  <div className="font-medium">{rfq.rfqNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    Indent {rfq.indent.indentNumber}
                    {rfq.dueDate ? ` · due ${formatDate(rfq.dueDate)}` : ""}
                  </div>
                </div>
                <Badge variant="outline">
                  {rfq.submittedCount} / {rfq.vendorCount} quotes
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

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
                {assignedIndents.map((indent) => {
                  const mp = indent.materialProgress;
                  return (
                  <TableRow key={indent.id}>
                    <TableCell>
                      <Link href={`/indents/${indent.id}`} className="font-medium text-primary hover:underline">
                        {indent.indentNumber}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="outline">{indent.site.code}</Badge></TableCell>
                    <TableCell>{indent.assignedTo?.name || "-"}</TableCell>
                    <TableCell>{indent._count.items} items</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={indent.status} />
                        {mp && mp.totalItems > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {mp.withQuotes}/{mp.totalItems} quoted
                            {mp.withPo > 0 ? ` · ${mp.withPo}/${mp.totalItems} on PO` : ""}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(indent.status === "ASSIGNED" ||
                          indent.status === "RFQ_SENT" ||
                          indent.status === "QUOTES_RECEIVED") && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/procurement/rfq/new?indentId=${indent.id}`}>
                              Create RFQ
                            </Link>
                          </Button>
                        )}
                        {(indent.status === "QUOTES_RECEIVED" ||
                          indent.status === "RFQ_SENT") && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/procurement/purchase-orders/new?indentId=${indent.id}`}>
                              Create PO
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
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

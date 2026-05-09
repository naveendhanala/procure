"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, Send, Package, Info, Clock, Mail, Phone, FileText, ShoppingCart } from "lucide-react";
import Link from "next/link";

function formatRole(role: string): string {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function IndentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, siteRoles } = useCurrentUser();
  const [indent, setIndent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState("");

  const isProcurement = siteRoles.some(
    (sr) => sr.role === "HEAD_OF_PROCUREMENT" || sr.role === "PROCUREMENT_TEAM_MEMBER"
  );

  useEffect(() => {
    fetch(`/api/indents/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setIndent(data); setLoading(false); });
  }, [params.id]);

  async function handleSubmit() {
    setActionLoading(true);
    const res = await fetch(`/api/indents/${params.id}/submit`, { method: "POST" });
    if (res.ok) {
      const updated = await fetch(`/api/indents/${params.id}`).then((r) => r.json());
      setIndent(updated);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setActionLoading(false);
  }

  async function handleApproval(action: "approve" | "reject") {
    if (action === "reject" && !approvalRemarks) {
      alert("Remarks are required when rejecting");
      return;
    }
    setActionLoading(true);
    const res = await fetch(`/api/indents/${params.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks: approvalRemarks }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/indents/${params.id}`).then((r) => r.json());
      setIndent(updated);
      setApprovalRemarks("");
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setActionLoading(false);
  }

  if (loading || !indent) return <p className="text-muted-foreground">Loading...</p>;

  const isCreator = user?.id === indent.createdById;
  const isDraft = indent.status === "DRAFT";
  const canApprove = indent.canApprove === true;

  return (
    <div className="space-y-6">
      <PageHeader title={indent.indentNumber}>
        <StatusBadge status={indent.status} displayLabel={indent.displayStatus} />
        <Button variant="outline" onClick={() => router.push("/indents")}>Back to List</Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Indent Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Site:</span> {indent.site.name} ({indent.site.code})</div>
              <div><span className="text-muted-foreground">Created By:</span> {indent.createdBy.name}</div>
              <div><span className="text-muted-foreground">Created:</span> {formatDateTime(indent.createdAt)}</div>
              <div><span className="text-muted-foreground">Required By:</span> {indent.requiredDate ? formatDate(indent.requiredDate) : "Not specified"}</div>
              <div>
                <span className="text-muted-foreground">Priority:</span>{" "}
                <Badge variant={indent.priority === "URGENT" ? "warning" : indent.priority === "CRITICAL" ? "destructive" : "secondary"}>
                  {indent.priority}
                </Badge>
              </div>
              {indent.assignedTo && (
                <div><span className="text-muted-foreground">Assigned To:</span> {indent.assignedTo.name}</div>
              )}
              {indent.remarks && (
                <div className="col-span-2"><span className="text-muted-foreground">Remarks:</span> {indent.remarks}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Material Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Purpose of Use</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Stock at Creation</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Total Indented</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">In Transit</TableHead>
                    <TableHead className="text-right">With Procurement</TableHead>
                    <TableHead className="text-right">Other Pending Indents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indent.items.map((item: any) => {
                    const stats = indent.materialStats?.[item.materialId];
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.material.name}</div>
                          <div className="text-xs text-muted-foreground">{item.material.code}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          {item.purposeOfUse || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">{Number(item.quantity)}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            {Number(item.stockAtCreation)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className={indent.currentInventory[item.materialId] > 0 ? "text-green-600" : "text-orange-600"}>
                              {indent.currentInventory[item.materialId] ?? 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{stats?.totalIndented ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600">{stats?.totalReceived ?? "-"}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-blue-600">{stats?.inTransit ?? "-"}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-amber-600">{stats?.withProcurement ?? "-"}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-purple-600">{stats?.pendingInOtherIndents ?? "-"}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <TooltipProvider>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help">
                        <Info className="h-3 w-3" /> Total Indented
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Total quantity indented for this material at this site (all time, excluding draft/rejected/cancelled)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help text-green-600">Received</span>
                    </TooltipTrigger>
                    <TooltipContent>Total quantity received via confirmed GRNs at this site</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help text-blue-600">In Transit</span>
                    </TooltipTrigger>
                    <TooltipContent>Quantity in POs that are issued but not yet fully received (material is on the way)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help text-amber-600">With Procurement</span>
                    </TooltipTrigger>
                    <TooltipContent>Quantity in approved indents being processed by procurement (approved/assigned/RFQ stage, no PO yet)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help text-purple-600">Other Pending Indents</span>
                    </TooltipTrigger>
                    <TooltipContent>Quantity in other active indents for this material at this site (pending approval, with procurement, or PO created)</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          {isProcurement && (() => {
            const rfqs = indent.rfqs ?? [];
            const activeRfqMaterialIds = new Set<string>();
            for (const rfq of rfqs) {
              if (rfq.status === "CLOSED" || rfq.status === "CANCELLED") continue;
              for (const ri of rfq.items ?? []) activeRfqMaterialIds.add(ri.materialId);
            }
            const remainingItems = indent.items.filter(
              (it: any) => !activeRfqMaterialIds.has(it.materialId)
            );
            const inProcurement = ["ASSIGNED", "RFQ_SENT", "QUOTES_RECEIVED"].includes(
              indent.status
            );

            return (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>RFQs ({rfqs.length})</CardTitle>
                      {inProcurement && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/procurement/rfq/new?indentId=${indent.id}`}>
                            <FileText className="mr-1 h-3 w-3" />
                            {rfqs.length === 0
                              ? "Create RFQ"
                              : remainingItems.length > 0
                              ? `Create RFQ for ${remainingItems.length} remaining`
                              : "Create another RFQ"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {rfqs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No RFQs yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {rfqs.map((rfq: any) => (
                          <Link
                            key={rfq.id}
                            href={`/procurement/rfq/${rfq.id}`}
                            className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                          >
                            <div>
                              <div className="font-medium">{rfq.rfqNumber}</div>
                              <div className="text-xs text-muted-foreground">
                                {(rfq.items ?? []).length} item
                                {(rfq.items ?? []).length === 1 ? "" : "s"} ·{" "}
                                {(rfq.vendors ?? []).length} vendor
                                {(rfq.vendors ?? []).length === 1 ? "" : "s"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  (rfq.quotes ?? []).length === (rfq.vendors ?? []).length
                                    ? "success"
                                    : (rfq.quotes ?? []).length > 0
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {(rfq.quotes ?? []).length} / {(rfq.vendors ?? []).length} quotes
                              </Badge>
                              <StatusBadge status={rfq.status} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {inProcurement && remainingItems.length > 0 && rfqs.length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {remainingItems.length} item
                        {remainingItems.length === 1 ? " is" : "s are"} not yet on an active RFQ:{" "}
                        {remainingItems
                          .map((it: any) => it.material.name)
                          .join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {indent.purchaseOrders?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Purchase Orders ({indent.purchaseOrders.length})</CardTitle>
                        {inProcurement && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/procurement/purchase-orders/new?indentId=${indent.id}`}>
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              Create PO
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {indent.purchaseOrders.map((po: any) => (
                        <Link
                          key={po.id}
                          href={`/procurement/purchase-orders/${po.id}`}
                          className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                        >
                          <div>
                            <span className="font-medium">{po.poNumber}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {po.vendor.name}
                            </span>
                          </div>
                          <StatusBadge status={po.status} />
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()}
        </div>

        <div className="space-y-6">
          {indent.pendingWith && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Pending With
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-medium">{indent.pendingWith.name}</div>
                <div className="text-muted-foreground">{formatRole(indent.pendingWith.role)}</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <a href={`mailto:${indent.pendingWith.email}`} className="text-primary hover:underline">
                    {indent.pendingWith.email}
                  </a>
                </div>
                {indent.pendingWith.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <a href={`tel:${indent.pendingWith.phone}`} className="text-primary hover:underline">
                      {indent.pendingWith.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isDraft && isCreator && (
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={handleSubmit} disabled={actionLoading}>
                  <Send className="mr-2 h-4 w-4" />{actionLoading ? "Submitting..." : "Submit for Approval"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push(`/indents/${params.id}/edit`)}>
                  Edit Indent
                </Button>
              </CardContent>
            </Card>
          )}

          {canApprove && (
            <Card>
              <CardHeader><CardTitle>Approval Action</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    placeholder="Add remarks (required for rejection)"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleApproval("approve")} disabled={actionLoading}>
                    <CheckCircle className="mr-2 h-4 w-4" />Approve
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleApproval("reject")} disabled={actionLoading}>
                    <XCircle className="mr-2 h-4 w-4" />Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Approval History</CardTitle></CardHeader>
            <CardContent>
              {indent.approvals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approvals yet</p>
              ) : (
                <div className="space-y-3">
                  {indent.approvals.map((approval: any) => (
                    <div key={approval.id} className="rounded-md border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{approval.user.name}</span>
                        <Badge variant={approval.action === "APPROVED" ? "success" : "destructive"}>
                          {approval.action}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Step {approval.stepOrder} - {formatRole(approval.role)}
                      </div>
                      {approval.remarks && (
                        <p className="text-sm text-muted-foreground">{approval.remarks}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDateTime(approval.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

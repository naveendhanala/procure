"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function IndentsPage() {
  const { siteRoles } = useCurrentUser();
  const [indents, setIndents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const isStoreManager = siteRoles.some((sr) => sr.role === "STORE_MANAGER");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/indents?${params}`)
      .then((res) => res.json())
      .then(setIndents)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Material Indents" description="View and manage material indent requests">
        {isStoreManager && (
          <Button asChild><Link href="/indents/new"><Plus className="mr-2 h-4 w-4" />New Indent</Link></Button>
        )}
      </PageHeader>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="PO_CREATED">PO Created</SelectItem>
            <SelectItem value="FULLY_RECEIVED">Fully Received</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Indent No.</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pending With</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indents.map((indent) => (
              <TableRow key={indent.id}>
                <TableCell>
                  <Link href={`/indents/${indent.id}`} className="font-medium text-primary hover:underline">
                    {indent.indentNumber}
                  </Link>
                </TableCell>
                <TableCell><Badge variant="outline">{indent.site.code}</Badge></TableCell>
                <TableCell>{indent.createdBy.name}</TableCell>
                <TableCell>{indent._count.items} items</TableCell>
                <TableCell>
                  <Badge variant={indent.priority === "URGENT" ? "warning" : indent.priority === "CRITICAL" ? "destructive" : "secondary"}>
                    {indent.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{formatDate(indent.createdAt)}</TableCell>
                <TableCell><StatusBadge status={indent.status} displayLabel={indent.displayStatus} /></TableCell>
                <TableCell>
                  {indent.pendingWith ? (
                    <div className="text-sm">
                      <div className="font-medium">{indent.pendingWith.name}</div>
                      <div className="text-xs text-muted-foreground">{indent.pendingWith.role.split("_").map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {indents.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No indents found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

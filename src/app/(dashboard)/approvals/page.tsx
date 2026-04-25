"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function ApprovalsPage() {
  const [indents, setIndents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/indents")
      .then((r) => r.json())
      .then((data) => {
        const pending = data.filter(
          (i: any) => i.status === "PENDING_APPROVAL" || i.status === "PARTIALLY_APPROVED"
        );
        setIndents(pending);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        description="Material indents awaiting your approval"
      />

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : indents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pending approvals at this time.</p>
        </div>
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
                <TableCell><StatusBadge status={indent.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

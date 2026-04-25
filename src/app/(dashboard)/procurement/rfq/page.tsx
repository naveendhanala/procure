"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function RFQListPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/rfq")
      .then((r) => r.json())
      .then(setRfqs);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="RFQ List" description="All Request for Quotations" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RFQ No.</TableHead>
            <TableHead>Indent</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Vendors</TableHead>
            <TableHead>Quotes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rfqs.map((rfq) => (
            <TableRow key={rfq.id}>
              <TableCell>
                <Link href={`/procurement/rfq/${rfq.id}`} className="font-medium text-primary hover:underline">
                  {rfq.rfqNumber}
                </Link>
              </TableCell>
              <TableCell>{rfq.indent.indentNumber}</TableCell>
              <TableCell><Badge variant="outline">{rfq.indent.site?.name}</Badge></TableCell>
              <TableCell>{rfq.createdBy.name}</TableCell>
              <TableCell>{rfq.vendors.length}</TableCell>
              <TableCell>{rfq._count.quotes}</TableCell>
              <TableCell><StatusBadge status={rfq.status} /></TableCell>
              <TableCell className="text-sm">{formatDate(rfq.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

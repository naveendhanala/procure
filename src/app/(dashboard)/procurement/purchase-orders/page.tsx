"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function PurchaseOrdersPage() {
  const [pos, setPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchase-orders")
      .then((r) => r.json())
      .then(setPOs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" description="All purchase orders" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO No.</TableHead>
            <TableHead>Indent</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>GRNs</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pos.map((po) => (
            <TableRow key={po.id}>
              <TableCell>
                <Link href={`/procurement/purchase-orders/${po.id}`} className="font-medium text-primary hover:underline">
                  {po.poNumber}
                </Link>
              </TableCell>
              <TableCell>{po.indent.indentNumber}</TableCell>
              <TableCell><Badge variant="outline">{po.indent.site?.code}</Badge></TableCell>
              <TableCell>{po.vendor.name}</TableCell>
              <TableCell className="font-medium">{Number(po.grandTotal).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
              <TableCell>{po._count.items}</TableCell>
              <TableCell>{po._count.goodsReceipts}</TableCell>
              <TableCell><StatusBadge status={po.status} /></TableCell>
              <TableCell className="text-sm">{formatDate(po.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

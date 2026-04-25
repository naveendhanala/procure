"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function GRNListPage() {
  const { siteRoles } = useCurrentUser();
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isSM = siteRoles.some((sr) => sr.role === "STORE_MANAGER");

  useEffect(() => {
    fetch("/api/grn")
      .then((r) => r.json())
      .then(setGrns)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Goods Receipt Notes" description="Material delivery records">
        {isSM && (
          <Button asChild><Link href="/grn/new"><Plus className="mr-2 h-4 w-4" />New GRN</Link></Button>
        )}
      </PageHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>GRN No.</TableHead>
            <TableHead>PO No.</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Received By</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grns.map((grn) => (
            <TableRow key={grn.id}>
              <TableCell>
                <Link href={`/grn/${grn.id}`} className="font-medium text-primary hover:underline">{grn.grnNumber}</Link>
              </TableCell>
              <TableCell>{grn.po.poNumber}</TableCell>
              <TableCell>{grn.po.vendor?.name}</TableCell>
              <TableCell><Badge variant="outline">{grn.site.code}</Badge></TableCell>
              <TableCell>{grn.receivedBy.name}</TableCell>
              <TableCell>{grn._count.items}</TableCell>
              <TableCell className="text-sm">{formatDate(grn.receivedDate)}</TableCell>
              <TableCell><StatusBadge status={grn.status} /></TableCell>
            </TableRow>
          ))}
          {!loading && grns.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No GRNs found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

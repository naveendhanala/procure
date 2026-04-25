"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then(setVendors)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Vendors" description="Manage vendor directory">
        <Button asChild><Link href="/admin/vendors/new"><Plus className="mr-2 h-4 w-4" />Add Vendor</Link></Button>
      </PageHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>GST</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <Link href={`/admin/vendors/${v.id}`} className="font-medium text-primary hover:underline">{v.code}</Link>
              </TableCell>
              <TableCell>{v.name}</TableCell>
              <TableCell>
                <div className="text-sm">{v.contactPerson || "-"}</div>
                <div className="text-xs text-muted-foreground">{v.email}</div>
              </TableCell>
              <TableCell>{[v.city, v.state].filter(Boolean).join(", ") || "-"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {v.categories.map((c: any) => (
                    <Badge key={c.id} variant="outline" className="text-xs">{c.category}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs">{v.gstNumber || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

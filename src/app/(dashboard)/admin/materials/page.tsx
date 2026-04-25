"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/materials?search=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then(setMaterials)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Materials" description="Manage material catalog">
        <Button asChild><Link href="/admin/materials/new"><Plus className="mr-2 h-4 w-4" />Add Material</Link></Button>
      </PageHeader>

      <div className="flex items-center gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>HSN Code</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((mat) => (
            <TableRow key={mat.id}>
              <TableCell className="font-medium">{mat.code}</TableCell>
              <TableCell>{mat.name}</TableCell>
              <TableCell><Badge variant="outline">{mat.category}</Badge></TableCell>
              <TableCell>{mat.unit}</TableCell>
              <TableCell>{mat.hsnCode || "-"}</TableCell>
            </TableRow>
          ))}
          {!loading && materials.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No materials found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

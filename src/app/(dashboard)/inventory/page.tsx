"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package } from "lucide-react";

export default function InventoryPage() {
  const { siteRoles } = useCurrentUser();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState("");
  const [search, setSearch] = useState("");

  const uniqueSites = siteRoles
    .map((sr) => ({ id: sr.siteId, name: sr.siteName, code: sr.siteCode }))
    .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);

  useEffect(() => {
    if (uniqueSites.length === 1) setSiteId(uniqueSites[0].id);
  }, []);

  useEffect(() => {
    if (siteId) {
      setLoading(true);
      fetch(`/api/inventory/${siteId}`)
        .then((r) => r.json())
        .then(setInventory)
        .finally(() => setLoading(false));
    }
  }, [siteId]);

  const filtered = inventory.filter(
    (inv) =>
      inv.material.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.material.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Current stock levels at site" />

      <div className="flex gap-4">
        <Select value={siteId} onValueChange={setSiteId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select Site" /></SelectTrigger>
          <SelectContent>
            {uniqueSites.map((site) => (
              <SelectItem key={site.id} value={site.id}>{site.code} - {site.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {!siteId ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select a site to view inventory.</p>
        </div>
      ) : loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.material.code}</TableCell>
                <TableCell>{inv.material.name}</TableCell>
                <TableCell><Badge variant="outline">{inv.material.category}</Badge></TableCell>
                <TableCell>
                  <span className={`font-medium ${Number(inv.quantity) > 0 ? "text-green-600" : "text-orange-600"}`}>
                    {Number(inv.quantity)}
                  </span>
                </TableCell>
                <TableCell>{inv.material.unit}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No inventory records found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

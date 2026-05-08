"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  code: string;
  contactPerson: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  gstNumber: string | null;
  categories: { id: string; category: string }[];
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState("all");
  const [state, setState] = useState("all");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ facets: "true", limit: "50" });
    if (debouncedQ) params.set("q", debouncedQ);
    if (category !== "all") params.set("category", category);
    if (state !== "all") params.set("state", state);

    fetch(`/api/vendors?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setVendors(data.items ?? []);
        setNextCursor(data.nextCursor ?? null);
        setTotal(data.total ?? 0);
        if (data.facets) {
          setCategories(data.facets.categories ?? []);
          setStates(data.facets.states ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedQ, category, state]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const params = new URLSearchParams({ limit: "50", cursor: nextCursor });
    if (debouncedQ) params.set("q", debouncedQ);
    if (category !== "all") params.set("category", category);
    if (state !== "all") params.set("state", state);

    const data = await fetch(`/api/vendors?${params}`).then((r) => r.json());
    setVendors((prev) => [...prev, ...(data.items ?? [])]);
    setNextCursor(data.nextCursor ?? null);
    setLoadingMore(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Vendors" description="Manage vendor directory">
        <Button asChild>
          <Link href="/admin/vendors/new"><Plus className="mr-2 h-4 w-4" />Add Vendor</Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, contact, email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-48"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        {loading ? "Searching..." : `${vendors.length} of ${total} vendor${total === 1 ? "" : "s"}`}
      </div>

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
                  {v.categories.map((c) => (
                    <Badge key={c.id} variant="outline" className="text-xs">{c.category}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs">{v.gstNumber || "-"}</TableCell>
            </TableRow>
          ))}
          {!loading && vendors.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                No vendors match these filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

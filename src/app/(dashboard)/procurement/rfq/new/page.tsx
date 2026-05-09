"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  code: string;
  email: string | null;
  city: string | null;
  state: string | null;
  categories: { id: string; category: string }[];
}

export default function NewRFQPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const indentId = searchParams.get("indentId");

  const [indent, setIndent] = useState<any>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("suggested");

  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const indentCategories = useMemo(() => {
    if (!indent) return [] as string[];
    const selectedItems =
      selectedItemIds.length > 0
        ? indent.items.filter((it: any) => selectedItemIds.includes(it.id))
        : indent.items;
    return Array.from(
      new Set(selectedItems.map((i: any) => i.material.category as string))
    );
  }, [indent, selectedItemIds]);

  const activeRfqByItemMaterial = useMemo(() => {
    if (!indent?.rfqs) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const rfq of indent.rfqs) {
      if (rfq.status === "CLOSED" || rfq.status === "CANCELLED") continue;
      for (const ri of rfq.items ?? []) {
        const arr = map.get(ri.materialId) ?? [];
        if (!arr.includes(rfq.rfqNumber)) arr.push(rfq.rfqNumber);
        map.set(ri.materialId, arr);
      }
    }
    return map;
  }, [indent]);

  function toggleItem(id: string) {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function selectAllItems() {
    setSelectedItemIds(indent?.items?.map((it: any) => it.id) ?? []);
  }
  function clearItems() {
    setSelectedItemIds([]);
  }

  useEffect(() => {
    if (indentId) {
      fetch(`/api/indents/${indentId}`)
        .then((r) => r.json())
        .then((data) => {
          setIndent(data);
          setSelectedItemIds(data.items?.map((it: any) => it.id) ?? []);
        });
    }
  }, [indentId]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(handle);
  }, [q]);

  const effectiveCategory =
    categoryFilter === "all" || categoryFilter === "suggested"
      ? null
      : categoryFilter;
  const restrictToSuggested =
    categoryFilter === "suggested" && indentCategories.length > 0;

  useEffect(() => {
    if (!indent) return;
    setVendorsLoading(true);
    const params = new URLSearchParams({ limit: "50", facets: "true" });
    if (debouncedQ) params.set("q", debouncedQ);
    if (effectiveCategory) params.set("category", effectiveCategory);

    fetch(`/api/vendors?${params}`)
      .then((r) => r.json())
      .then((data) => {
        let items: Vendor[] = data.items ?? [];
        if (restrictToSuggested) {
          items = items.filter((v) =>
            v.categories.some((c) => indentCategories.includes(c.category))
          );
        }
        setVendors(items);
        setNextCursor(data.nextCursor ?? null);
        setTotal(data.total ?? 0);
        if (data.facets?.categories) setCategories(data.facets.categories);
      })
      .finally(() => setVendorsLoading(false));
  }, [debouncedQ, effectiveCategory, restrictToSuggested, indent, indentCategories]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const params = new URLSearchParams({
      limit: "50",
      cursor: nextCursor,
    });
    if (debouncedQ) params.set("q", debouncedQ);
    if (effectiveCategory) params.set("category", effectiveCategory);
    const data = await fetch(`/api/vendors?${params}`).then((r) => r.json());
    let items: Vendor[] = data.items ?? [];
    if (restrictToSuggested) {
      items = items.filter((v) =>
        v.categories.some((c) => indentCategories.includes(c.category))
      );
    }
    setVendors((prev) => [...prev, ...items]);
    setNextCursor(data.nextCursor ?? null);
    setLoadingMore(false);
  }

  function toggleVendor(vendor: Vendor) {
    setSelectedVendors((prev) =>
      prev.find((v) => v.id === vendor.id)
        ? prev.filter((v) => v.id !== vendor.id)
        : [...prev, vendor]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!indentId || selectedVendors.length === 0 || selectedItemIds.length === 0) return;
    setLoading(true);

    const res = await fetch("/api/rfq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        indentId,
        vendorIds: selectedVendors.map((v) => v.id),
        itemIds: selectedItemIds,
        dueDate: dueDate || null,
        remarks: remarks || null,
      }),
    });

    if (res.ok) {
      const rfq = await res.json();
      router.push(`/procurement/rfq/${rfq.id}`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setLoading(false);
  }

  if (!indent) return <p className="text-muted-foreground">Loading...</p>;

  const selectedIds = new Set(selectedVendors.map((v) => v.id));

  return (
    <div className="space-y-6">
      <PageHeader title="Create RFQ" description={`For indent ${indent.indentNumber}`} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items for this RFQ</CardTitle>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={selectAllItems}>
                  Select all
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={clearItems}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Already on RFQ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indent.items.map((item: any) => {
                  const onRfqs = activeRfqByItemMaterial.get(item.materialId) ?? [];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.material.name}</div>
                        <div className="text-xs text-muted-foreground">{item.material.code}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.material.category}</Badge></TableCell>
                      <TableCell>{Number(item.quantity)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {onRfqs.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {onRfqs.map((no) => (
                              <Badge key={no} variant="secondary" className="text-xs">{no}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Select Vendors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {selectedVendors.length > 0 && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Selected ({selectedVendors.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedVendors.map((v) => (
                    <Badge key={v.id} variant="secondary" className="pl-2 pr-1 py-1">
                      <span>{v.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleVendor(v)}
                        className="ml-1 rounded hover:bg-background/50 p-0.5"
                        aria-label={`Remove ${v.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, contact, email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {indentCategories.length > 0 && (
                    <SelectItem value="suggested">Suggested (indent categories)</SelectItem>
                  )}
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              {vendorsLoading
                ? "Searching..."
                : `${vendors.length}${restrictToSuggested ? " matching" : ""} of ${total} vendor${total === 1 ? "" : "s"}`}
            </div>

            <div className="rounded-md border max-h-[420px] overflow-y-auto divide-y">
              {vendors.map((v) => {
                const checked = selectedIds.has(v.id);
                return (
                  <label
                    key={v.id}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleVendor(v)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{v.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.code}
                        {v.city || v.state ? ` · ${[v.city, v.state].filter(Boolean).join(", ")}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                      {v.categories.slice(0, 3).map((c) => (
                        <Badge key={c.id} variant="outline" className="text-xs">{c.category}</Badge>
                      ))}
                      {v.categories.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{v.categories.length - 3}</Badge>
                      )}
                    </div>
                  </label>
                );
              })}
              {!vendorsLoading && vendors.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No vendors match these filters.
                </div>
              )}
            </div>

            {nextCursor && (
              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>RFQ Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quote Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Special instructions for vendors..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={
              loading || selectedVendors.length === 0 || selectedItemIds.length === 0
            }
          >
            {loading
              ? "Creating..."
              : `Create RFQ (${selectedItemIds.length} item${selectedItemIds.length === 1 ? "" : "s"}, ${selectedVendors.length} vendor${selectedVendors.length === 1 ? "" : "s"})`}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

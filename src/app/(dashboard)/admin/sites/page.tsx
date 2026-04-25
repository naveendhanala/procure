"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

interface Site {
  id: string;
  name: string;
  code: string;
  city: string | null;
  state: string | null;
  isActive: boolean;
  approvalWorkflow: { stepOrder: number; role: string }[];
  _count: { userAssignments: number; indents: number };
}

function formatRole(role: string): string {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sites")
      .then((res) => res.json())
      .then(setSites)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Sites" description="Manage site locations and approval workflows">
        <Button asChild>
          <Link href="/admin/sites/new"><Plus className="mr-2 h-4 w-4" />Add Site</Link>
        </Button>
      </PageHeader>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Approval Flow</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Indents</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>
                  <Link href={`/admin/sites/${site.id}`} className="font-medium text-primary hover:underline">
                    {site.code}
                  </Link>
                </TableCell>
                <TableCell>{site.name}</TableCell>
                <TableCell>{[site.city, site.state].filter(Boolean).join(", ") || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {site.approvalWorkflow.map((step, i) => (
                      <span key={i}>
                        {i > 0 && <span className="mx-1 text-muted-foreground">&rarr;</span>}
                        <Badge variant="outline" className="text-xs">{formatRole(step.role)}</Badge>
                      </span>
                    ))}
                    {site.approvalWorkflow.length === 0 && <span className="text-sm text-muted-foreground">Not configured</span>}
                  </div>
                </TableCell>
                <TableCell>{site._count.userAssignments}</TableCell>
                <TableCell>{site._count.indents}</TableCell>
                <TableCell>
                  <Badge variant={site.isActive ? "success" : "secondary"}>
                    {site.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

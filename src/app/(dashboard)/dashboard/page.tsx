"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileText,
  CheckSquare,
  ShoppingCart,
  Truck,
  Package,
  Plus,
} from "lucide-react";

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function DashboardPage() {
  const { user, siteRoles } = useCurrentUser();

  const roles = Array.from(new Set(siteRoles.map((sr) => sr.role)));
  const isPM = roles.includes("PROJECT_MANAGER");
  const isCH = roles.includes("CLUSTER_HEAD");
  const isVP = roles.includes("VICE_PRESIDENT");
  const isHoS = roles.includes("HEAD_OF_STORES");
  const isHoP = roles.includes("HEAD_OF_PROCUREMENT");
  const isPTM = roles.includes("PROCUREMENT_TEAM_MEMBER");
  const isSM = roles.includes("STORE_MANAGER");
  const isAdmin = roles.includes("SUPER_ADMIN");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isSM && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Indents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Create and track material indents
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/indents/new">
                  <Plus className="mr-1 h-3 w-3" />
                  New Indent
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {(isPM || isCH || isVP || isHoS) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Review and approve material indents
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/approvals">View Approvals</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isHoP && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Procurement</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Assign approved indents and manage procurement
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/procurement">Manage</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isPTM && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Assignments</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Work on assigned indents, RFQs, and POs
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/procurement">View Assignments</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isSM && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goods Receipt</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Record material deliveries at site
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/grn">Manage GRN</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administration</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage sites, users, materials, and vendors
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/admin/sites">Admin Panel</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Roles & Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {siteRoles.map((sr, i) => (
              <div key={i} className="flex items-center gap-3">
                <Badge variant="outline">{sr.siteCode}</Badge>
                <span className="text-sm">{sr.siteName}</span>
                <Badge variant="secondary">{formatRole(sr.role)}</Badge>
              </div>
            ))}
            {siteRoles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No site assignments yet. Contact your administrator.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

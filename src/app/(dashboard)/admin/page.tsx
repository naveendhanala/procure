"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Boxes, Building2 } from "lucide-react";

const adminCards = [
  { title: "Sites", description: "Manage site locations and approval workflows", href: "/admin/sites", icon: MapPin },
  { title: "Users", description: "Manage users and role assignments", href: "/admin/users", icon: Users },
  { title: "Materials", description: "Manage material catalog", href: "/admin/materials", icon: Boxes },
  { title: "Vendors", description: "Manage vendor directory", href: "/admin/vendors", icon: Building2 },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Administration" description="System configuration and master data management" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <card.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

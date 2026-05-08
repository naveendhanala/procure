"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  ShoppingCart,
  Truck,
  Package,
  Settings,
  Users,
  MapPin,
  Boxes,
  Building2,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "SUPER_ADMIN",
      "PROJECT_MANAGER",
      "CLUSTER_HEAD",
      "VICE_PRESIDENT",
      "HEAD_OF_PROCUREMENT",
      "PROCUREMENT_TEAM_MEMBER",
      "STORE_MANAGER",
    ],
  },
  {
    title: "Material Indents",
    href: "/indents",
    icon: FileText,
    roles: [
      "PROJECT_MANAGER",
      "CLUSTER_HEAD",
      "VICE_PRESIDENT",
      "HEAD_OF_STORES",
      "HEAD_OF_PROCUREMENT",
      "PROCUREMENT_TEAM_MEMBER",
      "STORE_MANAGER",
    ],
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: CheckSquare,
    roles: ["PROJECT_MANAGER", "CLUSTER_HEAD", "VICE_PRESIDENT", "HEAD_OF_STORES"],
  },
  {
    title: "Procurement",
    href: "/procurement",
    icon: ShoppingCart,
    roles: ["HEAD_OF_PROCUREMENT", "PROCUREMENT_TEAM_MEMBER"],
  },
  {
    title: "Goods Receipt",
    href: "/grn",
    icon: Truck,
    roles: ["STORE_MANAGER", "HEAD_OF_PROCUREMENT", "PROCUREMENT_TEAM_MEMBER"],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: [
      "PROJECT_MANAGER",
      "CLUSTER_HEAD",
      "VICE_PRESIDENT",
      "HEAD_OF_STORES",
      "STORE_MANAGER",
      "HEAD_OF_PROCUREMENT",
      "PROCUREMENT_TEAM_MEMBER",
    ],
  },
  {
    title: "Sites",
    href: "/admin/sites",
    icon: MapPin,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Materials",
    href: "/admin/materials",
    icon: Boxes,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Vendors",
    href: "/admin/vendors",
    icon: Building2,
    roles: ["SUPER_ADMIN", "HEAD_OF_PROCUREMENT", "PROCUREMENT_TEAM_MEMBER"],
  },
  {
    title: "Settings",
    href: "/admin",
    icon: Settings,
    roles: ["SUPER_ADMIN"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { siteRoles } = useCurrentUser();

  const userRoles = Array.from(new Set(siteRoles.map((sr) => sr.role)));

  const visibleItems = navItems.filter((item) =>
    item.roles.some((role) => (userRoles as string[]).includes(role))
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">ProCure</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

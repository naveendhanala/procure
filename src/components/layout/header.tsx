"use client";

import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function Header() {
  const { user, siteRoles } = useCurrentUser();

  const uniqueRoles = Array.from(new Set(siteRoles.map((sr) => sr.role)));

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{user?.name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {uniqueRoles.map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {formatRole(role)}
            </Badge>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {siteRoles.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Site Assignments
                </DropdownMenuLabel>
                {siteRoles.map((sr, i) => (
                  <DropdownMenuItem key={i} className="text-xs">
                    {sr.siteName} - {formatRole(sr.role)}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { SiteRole } from "@/types/next-auth";

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    siteRoles: (session?.user?.siteRoles || []) as SiteRole[],
  };
}

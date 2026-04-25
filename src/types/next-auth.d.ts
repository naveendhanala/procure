import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      siteRoles: SiteRole[];
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    siteRoles: SiteRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    siteRoles: SiteRole[];
  }
}

export interface SiteRole {
  siteId: string;
  siteName: string;
  siteCode: string;
  role: Role;
}

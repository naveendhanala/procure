import { Role } from "@prisma/client";
import { SiteRole } from "@/types/next-auth";

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ["admin.*", "indent.read", "inventory.read", "vendor.read"],
  PROJECT_MANAGER: ["indent.read", "indent.approve", "inventory.read"],
  CLUSTER_HEAD: ["indent.read", "indent.approve", "inventory.read"],
  VICE_PRESIDENT: ["indent.read", "indent.approve", "inventory.read"],
  HEAD_OF_STORES: ["indent.read", "indent.approve", "inventory.read"],
  HEAD_OF_PROCUREMENT: [
    "indent.read",
    "indent.assign",
    "rfq.*",
    "quote.*",
    "po.*",
    "grn.read",
    "vendor.*",
    "inventory.read",
  ],
  PROCUREMENT_TEAM_MEMBER: [
    "indent.read_assigned",
    "rfq.*",
    "quote.*",
    "po.*",
    "grn.read",
    "vendor.*",
    "inventory.read",
  ],
  STORE_MANAGER: [
    "indent.create",
    "indent.read",
    "indent.edit_own",
    "indent.submit",
    "inventory.*",
    "grn.*",
  ],
};

function matchPermission(held: string, required: string): boolean {
  if (held === required) return true;
  if (held.endsWith(".*")) {
    const prefix = held.slice(0, -1);
    return required.startsWith(prefix);
  }
  return false;
}

export function canAccess(
  siteRoles: SiteRole[],
  permission: string,
  siteId?: string
): boolean {
  const roles = siteId
    ? siteRoles.filter((sr) => sr.siteId === siteId)
    : siteRoles;

  return roles.some((sr) => {
    const perms = ROLE_PERMISSIONS[sr.role] || [];
    return perms.some((p) => matchPermission(p, permission));
  });
}

export function hasRole(siteRoles: SiteRole[], role: Role, siteId?: string): boolean {
  if (siteId) {
    return siteRoles.some((sr) => sr.siteId === siteId && sr.role === role);
  }
  return siteRoles.some((sr) => sr.role === role);
}

export function hasAnyRole(siteRoles: SiteRole[], roles: Role[], siteId?: string): boolean {
  return roles.some((role) => hasRole(siteRoles, role, siteId));
}

export function isProcurementRole(siteRoles: SiteRole[]): boolean {
  return siteRoles.some(
    (sr) =>
      sr.role === "HEAD_OF_PROCUREMENT" ||
      sr.role === "PROCUREMENT_TEAM_MEMBER"
  );
}

export function isSiteRole(siteRoles: SiteRole[]): boolean {
  return siteRoles.some(
    (sr) =>
      sr.role === "PROJECT_MANAGER" ||
      sr.role === "CLUSTER_HEAD" ||
      sr.role === "VICE_PRESIDENT" ||
      sr.role === "HEAD_OF_STORES" ||
      sr.role === "STORE_MANAGER"
  );
}

export function getDisplayStatus(
  status: string,
  isProcurement: boolean
): string {
  if (isProcurement) return status;

  const siteStatusMap: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    PARTIALLY_APPROVED: "Pending Approval",
    APPROVED: "Approved - In Procurement",
    REJECTED: "Rejected",
    ASSIGNED: "In Procurement",
    RFQ_SENT: "In Procurement",
    QUOTES_RECEIVED: "In Procurement",
    PO_CREATED: "Ordered",
    PARTIALLY_RECEIVED: "Partially Delivered",
    FULLY_RECEIVED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return siteStatusMap[status] || status;
}

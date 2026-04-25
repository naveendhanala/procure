import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"; label: string }> = {
  DRAFT: { variant: "secondary", label: "Draft" },
  PENDING_APPROVAL: { variant: "warning", label: "Pending Approval" },
  PARTIALLY_APPROVED: { variant: "warning", label: "Partially Approved" },
  APPROVED: { variant: "success", label: "Approved" },
  REJECTED: { variant: "destructive", label: "Rejected" },
  ASSIGNED: { variant: "default", label: "Assigned" },
  RFQ_SENT: { variant: "default", label: "RFQ Sent" },
  QUOTES_RECEIVED: { variant: "default", label: "Quotes Received" },
  PO_CREATED: { variant: "success", label: "PO Created" },
  PARTIALLY_RECEIVED: { variant: "warning", label: "Partially Received" },
  FULLY_RECEIVED: { variant: "success", label: "Fully Received" },
  CANCELLED: { variant: "destructive", label: "Cancelled" },
  SENT: { variant: "default", label: "Sent" },
  CLOSED: { variant: "secondary", label: "Closed" },
  PENDING: { variant: "warning", label: "Pending" },
  RECEIVED: { variant: "success", label: "Received" },
  SELECTED: { variant: "success", label: "Selected" },
  ISSUED: { variant: "default", label: "Issued" },
  CONFIRMED: { variant: "success", label: "Confirmed" },
};

interface StatusBadgeProps {
  status: string;
  displayLabel?: string;
}

export function StatusBadge({ status, displayLabel }: StatusBadgeProps) {
  const config = statusStyles[status] || { variant: "outline" as const, label: status };
  return (
    <Badge variant={config.variant}>
      {displayLabel || config.label}
    </Badge>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export default function GRNDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { siteRoles } = useCurrentUser();
  const [grn, setGrn] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  const isSM = siteRoles.some((sr) => sr.role === "STORE_MANAGER");

  useEffect(() => {
    fetch(`/api/grn/${params.id}`).then((r) => r.json()).then(setGrn);
  }, [params.id]);

  async function handleConfirm() {
    setConfirming(true);
    const res = await fetch(`/api/grn/${params.id}/confirm`, { method: "POST" });
    if (res.ok) {
      const updated = await fetch(`/api/grn/${params.id}`).then((r) => r.json());
      setGrn(updated);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setConfirming(false);
  }

  if (!grn) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={grn.grnNumber}>
        <StatusBadge status={grn.status} />
        <Button variant="outline" onClick={() => router.push("/grn")}>Back</Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>GRN Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">PO Number:</span> {grn.po?.poNumber}</div>
              <div><span className="text-muted-foreground">Vendor:</span> {grn.po?.vendor?.name}</div>
              <div><span className="text-muted-foreground">Site:</span> {grn.site?.name} ({grn.site?.code})</div>
              <div><span className="text-muted-foreground">Received By:</span> {grn.receivedBy?.name}</div>
              <div><span className="text-muted-foreground">Received Date:</span> {formatDateTime(grn.receivedDate)}</div>
              {grn.vehicleNumber && <div><span className="text-muted-foreground">Vehicle:</span> {grn.vehicleNumber}</div>}
              {grn.challanNumber && <div><span className="text-muted-foreground">Challan:</span> {grn.challanNumber}</div>}
              {grn.remarks && <div className="col-span-2"><span className="text-muted-foreground">Remarks:</span> {grn.remarks}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Material Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Accepted</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grn.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.material?.name}</div>
                        <div className="text-xs text-muted-foreground">{item.material?.code}</div>
                      </TableCell>
                      <TableCell>{Number(item.orderedQuantity)}</TableCell>
                      <TableCell>{Number(item.receivedQuantity)}</TableCell>
                      <TableCell className="text-green-600 font-medium">{Number(item.acceptedQuantity)}</TableCell>
                      <TableCell className={Number(item.rejectedQuantity) > 0 ? "text-red-600" : ""}>
                        {Number(item.rejectedQuantity)}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isSM && grn.status === "DRAFT" && (
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Confirming this GRN will update the site inventory with the accepted quantities.
                </p>
                <Button className="w-full" onClick={handleConfirm} disabled={confirming}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {confirming ? "Confirming..." : "Confirm GRN & Update Inventory"}
                </Button>
              </CardContent>
            </Card>
          )}

          {grn.status === "CONFIRMED" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <p className="font-medium">GRN Confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    Inventory has been updated with accepted quantities.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

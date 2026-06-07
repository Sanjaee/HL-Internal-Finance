"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { IconCheck, IconTrash, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { markTransactionLunas, deleteTransaction } from "@/actions/transaction-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TransactionDetailClient({ tx }: { tx: any }) {
  const [isLunasOpen, setIsLunasOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLunas = async () => {
    setIsLoading(true);
    const res = await markTransactionLunas(tx.id, new Date(paymentDate));
    setIsLoading(false);
    
    if (res.success) {
      toast.success("Transaction marked as LUNAS!");
      setIsLunasOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to mark as Lunas");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    
    const res = await deleteTransaction(tx.id);
    if (res.success) {
      toast.success("Transaction deleted!");
      router.push("/dashboard/transactions");
    } else {
      toast.error(res.error || "Failed to delete");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/transactions">
            <Button variant="outline" size="icon">
              <IconArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bon: {tx.bonNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Created on {format(new Date(tx.transactionDate), "dd MMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {tx.status === "PIUTANG" && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsLunasOpen(true)}>
              <IconCheck className="mr-2 h-4 w-4" /> Mark as Lunas
            </Button>
          )}
          <Link href={`/dashboard/transactions/${tx.id}/edit`}>
            <Button variant="outline">
              Edit Bon
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <IconTrash className="mr-2 h-4 w-4" /> Delete Bon
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{tx.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code</span>
              <span className="font-medium">{tx.customerCode || "-"}</span>
            </div>
            {tx.description && (
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">Notes</span>
                <span className="font-medium text-right">{tx.description}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={tx.status === "LUNAS" ? "default" : "destructive"} className={tx.status === "LUNAS" ? "bg-green-600" : ""}>
                {tx.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline">{tx.isBonusTransaction ? "BONUS (FREE)" : "REGULAR SALES"}</Badge>
            </div>
            {tx.paymentDate && (
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">Payment Date</span>
                <span className="font-medium">{format(new Date(tx.paymentDate), "dd MMM yyyy")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>After Discount</TableHead>
                <TableHead className="text-right">Line Omzet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tx.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productNameSnapshot}</TableCell>
                  <TableCell>{item.productType}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>Rp {Number(item.basePrice).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell>
                    {item.isBonusItem ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : (
                      `Rp ${Number(item.discountedUnitPrice).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    Rp {Number(item.lineOmzet).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col items-end gap-2 pt-6">
            <div className="flex justify-between w-full md:w-1/3">
              <span className="text-muted-foreground">Subtotal Omzet:</span>
              <span className="font-semibold">Rp {Number(tx.subtotalOmzet).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between w-full md:w-1/3">
              <span className="text-muted-foreground">Shipping (Ongkir):</span>
              <span className="font-semibold">Rp {Number(tx.shippingCost).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between w-full md:w-1/3 border-t pt-2">
              <span className="text-lg font-bold">Total Tagihan:</span>
              <span className="text-xl font-bold text-primary">Rp {Number(tx.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isLunasOpen} onOpenChange={setIsLunasOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Transaction as Lunas</DialogTitle>
            <DialogDescription>
              Please confirm the payment date. Once marked as Lunas, the omzet and profit will be recognized.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Payment Date</label>
            <Input 
              type="date" 
              value={paymentDate} 
              onChange={(e) => setPaymentDate(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLunasOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleLunas} disabled={isLoading}>
              {isLoading ? "Saving..." : "Confirm Lunas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

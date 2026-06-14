"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { IconCheck, IconTrash, IconArrowLeft, IconCalendar } from "@tabler/icons-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { markTransactionLunas, deleteTransaction } from "@/actions/transaction-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function TransactionDetailClient({ tx }: { tx: any }) {
  const [isLunasOpen, setIsLunasOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();

  const handleLunas = async () => {
    setIsLoading(true);
    const res = await markTransactionLunas(tx.id, paymentDate || new Date());
    setIsLoading(false);
    
    if (res.success) {
      toast.success("Transaction marked as LUNAS!");
      setIsLunasOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to mark as Lunas");
    }
  };

  const performDelete = async () => {
    setIsDeleting(true);
    const res = await deleteTransaction(tx.id);
    setIsDeleting(false);
    
    if (res.success) {
      toast.success("Transaction deleted!");
      setIsDeleteDialogOpen(false);
      router.push("/dashboard/transactions");
    } else {
      toast.error(res.error || "Failed to delete");
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <Link href="/dashboard/transactions" className="shrink-0">
            <Button variant="outline" size="icon">
              <IconArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight break-words">Bon: {tx.bonNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Created on {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tx.status === "PIUTANG" && (
            <>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsLunasOpen(true)}>
                <IconCheck className="mr-2 h-4 w-4" /> Mark as Lunas
              </Button>
              <Link href={`/dashboard/transactions/${tx.id}/edit`}>
                <Button variant="outline">Edit Bon</Button>
              </Link>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <IconTrash className="mr-2 h-4 w-4" />
                <span>Delete Bon</span>
              </Button>
            </>
          )}
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
                <span className="font-medium">{format(new Date(tx.paymentDate), "dd MMM yyyy, HH:mm")}</span>
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
              <span className="text-lg font-bold">Total Amount:</span>
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !paymentDate && "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => {
                         if (date && paymentDate) {
                           date.setHours(paymentDate.getHours(), paymentDate.getMinutes(), 0, 0);
                         }
                         setPaymentDate(date)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-full sm:w-32">
                <label className="text-sm font-medium mb-2 block">Time</label>
                <Input
                  type="time"
                  step="60"
                  value={paymentDate ? format(paymentDate, "HH:mm") : "00:00"}
                  onChange={(e) => {
                    const timeStr = e.target.value;
                    if (paymentDate && timeStr) {
                      const [hours, minutes] = timeStr.split(':');
                      const newDate = new Date(paymentDate);
                      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                      setPaymentDate(newDate);
                    }
                  }}
                  className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLunasOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleLunas} disabled={isLoading}>
              {isLoading ? "Saving..." : "Confirm Lunas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the transaction <strong>{tx.bonNumber}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

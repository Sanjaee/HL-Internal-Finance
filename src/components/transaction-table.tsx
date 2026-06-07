"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconEye, IconTrash } from "@tabler/icons-react";
import { deleteTransaction } from "@/actions/transaction-actions";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";
import { format } from "date-fns";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function TransactionTable({
  transactions,
}: {
  transactions: any[];
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const currentTransactions = transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    
    setIsDeleting(transactionToDelete.id);
    const res = await deleteTransaction(transactionToDelete.id);
    setIsDeleting(null);
    setTransactionToDelete(null);
    
    if (res.success) {
      toast.success("Transaction deleted successfully");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete transaction");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bon Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Omzet</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Total Tagihan</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No transactions found. Click "Create Bon" to make one.
                </TableCell>
              </TableRow>
            ) : (
              currentTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{format(new Date(t.transactionDate), "dd MMM yyyy")}</TableCell>
                  <TableCell className="font-medium">{t.bonNumber}</TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "LUNAS" ? "default" : "destructive"} className={t.status === "LUNAS" ? "bg-green-600 hover:bg-green-700" : ""}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>Rp {Number(t.subtotalOmzet).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell>Rp {Number(t.shippingCost).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className="font-bold">Rp {Number(t.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/transactions/${t.id}`}>
                        <Button variant="outline" size="icon">
                          <IconEye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setTransactionToDelete(t)}
                        disabled={isDeleting === t.id}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete Bon <strong>{transactionToDelete?.bonNumber}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting !== null}
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

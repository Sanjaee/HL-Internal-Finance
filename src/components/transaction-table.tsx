"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconEye, IconTrash, IconSearch } from "@tabler/icons-react";
import { deleteTransaction } from "@/actions/transaction-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";

export function TransactionTable({
  transactions: initialTransactions,
  headerActions,
}: {
  transactions: any[];
  headerActions?: React.ReactNode;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { data: transactions, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => initialTransactions, // In a real app, this would fetch from an API
    initialData: initialTransactions,
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.bonNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    
    setIsDeleting(transactionToDelete.id);
    const res = await deleteTransaction(transactionToDelete.id);
    setIsDeleting(null);
    setTransactionToDelete(null);
    
    if (res.success) {
      toast.success("Transaction deleted successfully");
      router.refresh();
      refetch();
    } else {
      toast.error(res.error || "Failed to delete transaction");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "transactionDate",
        header: "Date",
        cell: ({ row }) => format(new Date(row.original.transactionDate), "dd MMM yyyy"),
      },
      {
        accessorKey: "bonNumber",
        header: "Bon Number",
        cell: ({ row }) => <span className="font-medium">{row.original.bonNumber}</span>,
      },
      {
        accessorKey: "customerName",
        header: "Customer",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={status === "LUNAS" ? "default" : "destructive"}
              className={status === "LUNAS" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "subtotalOmzet",
        header: "Omzet",
        cell: ({ row }) => `Rp ${Number(row.original.subtotalOmzet).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      },
      {
        accessorKey: "shippingCost",
        header: "Shipping",
        cell: ({ row }) => `Rp ${Number(row.original.shippingCost).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      },
      {
        accessorKey: "totalAmount",
        header: "Total Tagihan",
        cell: ({ row }) => (
          <span className="font-bold">
            Rp {Number(row.original.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Link href={`/dashboard/transactions/${t.id}`}>
                <Button variant="outline" size="icon">
                  <IconEye className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setTransactionToDelete(t);
                }}
                disabled={isDeleting === t.id}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [isDeleting]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by Bon Number or Customer..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>

      <DataTable columns={columns} data={filteredTransactions} />

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

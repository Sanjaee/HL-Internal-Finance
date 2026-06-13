"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { deleteCustomer } from "@/actions/customer-actions";
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
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";

export function CustomerTable({
  customers: initialCustomers,
  onEdit,
  headerActions,
}: {
  customers: any[];
  onEdit: (customer: any) => void;
  headerActions?: React.ReactNode;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { data: customers, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => initialCustomers, // Replaces with API fetch eventually
    initialData: initialCustomers,
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customerCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const handleDelete = async () => {
    if (!customerToDelete) return;
    
    setIsDeleting(customerToDelete.id);
    const res = await deleteCustomer(customerToDelete.id);
    setIsDeleting(null);
    setCustomerToDelete(null);
    
    if (res.success) {
      toast.success("Customer deleted successfully");
      router.refresh();
      refetch();
    } else {
      toast.error(res.error || "Failed to delete customer");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "customerCode",
        header: "Customer Code",
        cell: ({ row }) => <span className="font-medium">{row.original.customerCode}</span>,
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "bonusThreshold",
        header: "Bonus Threshold",
        cell: ({ row }) => `Rp ${Number(row.original.bonusThreshold).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: () => (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            Active
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(customer);
                }}
              >
                <IconEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomerToDelete(customer);
                }}
                disabled={isDeleting === customer.id}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, isDeleting]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>

      <DataTable columns={columns} data={filteredCustomers} />

      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the customer <strong>{customerToDelete?.name}</strong> as deleted.
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

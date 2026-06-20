"use client";

import { useMemo, useState, useDeferredValue } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconEye, IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { deleteCustomer } from "@/actions/customer-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import Link from "next/link";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  bonusThreshold: number;
  status?: string;
  [key: string]: any;
}

export function CustomerTable({
  customers: initialCustomers,
  onEdit,
  headerActions,
}: {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  headerActions?: React.ReactNode;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"active" | "inactive" | "all">("active");
  const deferredSearch = useDeferredValue(searchQuery);
  const router = useRouter();

  const customers = initialCustomers;

  const filteredCustomers = useMemo(() => {
    const search = deferredSearch.toLowerCase();
    
    return customers.filter((c) => {
      // 1. Filter by status
      if (filterMode === "active" && c.isDeleted) return false;
      if (filterMode === "inactive" && !c.isDeleted) return false;
      
      // 2. Filter by search
      if (!search) return true;
      return c.name.toLowerCase().includes(search) || (c.customerCode && c.customerCode.toLowerCase().includes(search));
    });
  }, [customers, deferredSearch, filterMode]);

  const handleDelete = async () => {
    if (!customerToDelete) return;
    
    setIsDeleting(customerToDelete.id);
    const res = await deleteCustomer(customerToDelete.id);
    setIsDeleting(null);
    setCustomerToDelete(null);
    
    if (res.success) {
      toast.success("Customer dinonaktifkan (Soft-Delete) berhasil");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete customer");
    }
  };

  const columns = useMemo<ColumnDef<Customer>[]>(
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
        cell: ({ row }) => {
          const isDeleted = row.original.isDeleted;
          if (isDeleted) {
            return (
              <Badge variant="outline" className="bg-gray-100 text-gray-500 hover:bg-gray-100">
                Inactive
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
              Active
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/dashboard/customers/${customer.id}`}>
                    <Button variant="outline" size="icon">
                      <IconEye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>View Customer Details</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit?.(customer)}
                      disabled={customer.isDeleted}
                      className={customer.isDeleted ? "pointer-events-none" : ""}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Edit Customer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setCustomerToDelete(customer);
                      }}
                      disabled={isDeleting === customer.id || customer.isDeleted}
                      className={(isDeleting === customer.id || customer.isDeleted) ? "pointer-events-none" : ""}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Delete Customer</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [onEdit, isDeleting]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as any)} className="w-full sm:w-[400px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {headerActions && <div className="w-full sm:w-auto flex">{headerActions}</div>}
        </div>
      </div>

      <DataTable columns={columns} data={filteredCustomers} />

      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menonaktifkan (Soft-Delete) customer <strong>{customerToDelete?.name}</strong>.
              Customer tidak akan muncul lagi saat membuat transaksi baru, tetapi riwayat transaksi lamanya akan tetap aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting !== null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menonaktifkan..." : "Nonaktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

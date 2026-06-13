"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconEdit, IconTrash, IconSearch } from "@tabler/icons-react";
import { deleteProduct } from "@/actions/product-actions";
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

export function ProductTable({
  products: initialProducts,
  onEdit,
  headerActions,
}: {
  products: any[];
  onEdit: (product: any) => void;
  headerActions?: React.ReactNode;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { data: products, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: async () => initialProducts,
    initialData: initialProducts,
  });

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(productToDelete.id);
    const res = await deleteProduct(productToDelete.id);
    setIsDeleting(null);
    setProductToDelete(null);
    
    if (res.success) {
      toast.success("Product deleted successfully");
      router.refresh();
      refetch();
    } else {
      toast.error(res.error || "Failed to delete product");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "productCode",
        header: "Code",
        cell: ({ row }) => <span className="font-medium">{row.original.productCode}</span>,
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "productType",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.productType;
          return (
            <Badge variant={type === "LM" ? "default" : "secondary"}>
              {type === "LM" ? "LM" : "BR"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "costPrice",
        header: "Cost Price",
        cell: ({ row }) => `Rp ${Number(row.original.costPrice).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      },
      {
        accessorKey: "basePrice",
        header: "Base Selling Price",
        cell: ({ row }) => `Rp ${Number(row.original.basePrice).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
              >
                <IconEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setProductToDelete(product);
                }}
                disabled={isDeleting === product.id}
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
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>

      <DataTable columns={columns} data={filteredProducts} />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the product <strong>{productToDelete?.name}</strong> as deleted.
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

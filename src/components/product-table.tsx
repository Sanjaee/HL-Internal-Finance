"use client";

import { useMemo, useState, useDeferredValue } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export type Product = {
  id: string;
  productCode: string;
  name: string;
  productType: "LM" | "BR" | string;
  costPrice: number;
  basePrice: number;
  [key: string]: any;
};

export function ProductTable({
  products: initialProducts,
  onEdit,
  headerActions,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
  headerActions?: React.ReactNode;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"active" | "inactive" | "all">("active");
  const deferredSearch = useDeferredValue(searchQuery);
  const router = useRouter();

  const products = initialProducts;

  const filteredProducts = useMemo(() => {
    const search = deferredSearch.toLowerCase();
    
    return products.filter((p) => {
      if (filterMode === "active" && p.isDeleted) return false;
      if (filterMode === "inactive" && !p.isDeleted) return false;
      
      if (!search) return true;
      return p.name.toLowerCase().includes(search) || (p.productCode && p.productCode.toLowerCase().includes(search));
    });
  }, [products, deferredSearch, filterMode]);

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(productToDelete.id);
    const res = await deleteProduct(productToDelete.id);
    setIsDeleting(null);
    setProductToDelete(null);
    
    if (res.success) {
      toast.success("Product dinonaktifkan (Soft-Delete) berhasil");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete product");
    }
  };

  const columns = useMemo<ColumnDef<Product>[]>(
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
        cell: ({ row }) => `Rp ${currencyFormatter.format(row.original.costPrice)}`,
      },
      {
        accessorKey: "basePrice",
        header: "Base Selling Price",
        cell: ({ row }) => `Rp ${currencyFormatter.format(row.original.basePrice)}`,
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
          const product = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(product);
                      }}
                      disabled={product.isDeleted}
                      className={product.isDeleted ? "pointer-events-none" : ""}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Edit Product</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductToDelete(product);
                      }}
                      disabled={isDeleting === product.id || product.isDeleted}
                      className={(isDeleting === product.id || product.isDeleted) ? "pointer-events-none" : ""}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Delete Product</TooltipContent>
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto justify-between">
        <div className="relative w-full sm:max-w-sm">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex bg-muted p-1 rounded-md w-full sm:w-auto">
            <button
              className={`flex-1 sm:flex-none px-2 sm:px-6 py-1.5 text-sm font-medium rounded-sm transition-all ${filterMode === "active" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilterMode("active")}
            >
              Active
            </button>
            <button
              className={`flex-1 sm:flex-none px-2 sm:px-6 py-1.5 text-sm font-medium rounded-sm transition-all ${filterMode === "inactive" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilterMode("inactive")}
            >
              Inactive
            </button>
            <button
              className={`flex-1 sm:flex-none px-2 sm:px-6 py-1.5 text-sm font-medium rounded-sm transition-all ${filterMode === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilterMode("all")}
            >
              All
            </button>
          </div>

          {headerActions && <div className="w-full sm:w-auto flex">{headerActions}</div>}
        </div>
      </div>

      <DataTable columns={columns} data={filteredProducts} />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menonaktifkan (Soft-Delete) produk <strong>{productToDelete?.name}</strong>.
              Produk tidak akan muncul lagi saat membuat transaksi baru.
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

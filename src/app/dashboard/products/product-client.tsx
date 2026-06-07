"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductTable } from "@/components/product-table";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/product-form";

export function ProductClient({ products }: { products: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const router = useRouter();

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    router.refresh();
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog and pricing here.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <IconPlus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <ProductTable products={products} onEdit={handleOpenEdit} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? "Update product details and pricing."
                : "Add a new product to your catalog."}
            </DialogDescription>
          </DialogHeader>
          {isDialogOpen && (
            <ProductForm initialData={selectedProduct} onSuccess={handleCloseDialog} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

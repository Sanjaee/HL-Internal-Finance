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
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { deleteProduct } from "@/actions/product-actions";
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

export function ProductTable({
  products,
  onEdit,
}: {
  products: any[];
  onEdit: (product: any) => void;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(productToDelete.id);
    const res = await deleteProduct(productToDelete.id);
    setIsDeleting(null);
    setProductToDelete(null);
    
    if (res.success) {
      toast.success("Product deleted successfully");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete product");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Base Selling Price</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No products found. Click "Add Product" to create one.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.productCode}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>
                  <Badge variant={product.productType === "LM" ? "default" : "secondary"}>
                    {product.productType === "LM" ? "LM" : "BR"}
                  </Badge>
                </TableCell>
                <TableCell>Rp {Number(product.costPrice).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                <TableCell>Rp {Number(product.basePrice).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => onEdit(product)}>
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setProductToDelete(product)}
                      disabled={isDeleting === product.id}
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

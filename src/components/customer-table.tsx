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
import { deleteCustomer } from "@/actions/customer-actions";
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

export function CustomerTable({
  customers,
  onEdit,
}: {
  customers: any[];
  onEdit: (customer: any) => void;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (!customerToDelete) return;
    
    setIsDeleting(customerToDelete.id);
    const res = await deleteCustomer(customerToDelete.id);
    setIsDeleting(null);
    setCustomerToDelete(null);
    
    if (res.success) {
      toast.success("Customer deleted successfully");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete customer");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Bonus Threshold</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No customers found. Click "Add Customer" to create one.
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.customerCode}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>Rp {Number(customer.bonusThreshold).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => onEdit(customer)}>
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setCustomerToDelete(customer)}
                      disabled={isDeleting === customer.id}
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

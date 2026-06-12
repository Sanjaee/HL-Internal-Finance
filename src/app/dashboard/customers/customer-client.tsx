"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerTable } from "@/components/customer-table";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customer-form";

export function CustomerClient({ customers }: { customers: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const router = useRouter();

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCustomer(null);
    router.refresh();
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customers and their discount groups here.
          </p>
        </div>
      </div>

      <CustomerTable 
        customers={customers} 
        onEdit={handleOpenEdit} 
        headerActions={
          <Button onClick={handleOpenCreate}>
            <IconPlus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? "Edit Customer" : "Create Customer"}</DialogTitle>
            <DialogDescription>
              {selectedCustomer
                ? "Update customer details and discount structure."
                : "Add a new customer with their base information and discount structure."}
            </DialogDescription>
          </DialogHeader>
          {isDialogOpen && (
            <CustomerForm initialData={selectedCustomer} onSuccess={handleCloseDialog} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

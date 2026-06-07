"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, TransactionFormValues } from "@/schemas/transaction";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction } from "@/actions/transaction-actions";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateCascadingDiscount } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";

export function TransactionForm({
  customers,
  customerDiscounts,
  products,
}: {
  customers: any[];
  customerDiscounts: Record<string, { LM: number[]; BR: number[] }>;
  products: any[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      transactionDate: new Date(),
      bonNumber: "",
      customerId: "",
      description: "",
      shippingCost: 0,
      isBonusTransaction: false,
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedCustomerId = form.watch("customerId");
  const isBonusTransaction = form.watch("isBonusTransaction");
  const shippingCost = form.watch("shippingCost");
  const watchedItems = form.watch("items");

  // Calculate totals
  const { subtotalOmzet, totalAmount } = useMemo(() => {
    let subtotal = 0;

    watchedItems.forEach((item) => {
      if (!item.productId || !selectedCustomerId) return;
      const product = products.find((p) => p.id === item.productId);
      if (!product) return;

      if (isBonusTransaction) {
        // Bonus items are free
        return;
      }

      const discounts = customerDiscounts[selectedCustomerId]?.[product.productType as "LM" | "BR"] || [];
      const discountedPrice = calculateCascadingDiscount(Number(product.basePrice), discounts);
      
      subtotal += discountedPrice * (item.quantity || 1);
    });

    return {
      subtotalOmzet: subtotal,
      totalAmount: subtotal + (Number(shippingCost) || 0),
    };
  }, [watchedItems, selectedCustomerId, products, customerDiscounts, shippingCost, isBonusTransaction]);

  async function onSubmit(data: TransactionFormValues) {
    setIsLoading(true);
    const res = await createTransaction(data);
    setIsLoading(false);

    if (res?.success) {
      toast.success("Transaction created successfully!");
      router.push("/dashboard/transactions");
    } else {
      toast.error(res?.error || "Failed to create transaction");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-8">
        
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""} 
                      onChange={(e) => field.onChange(new Date(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bonNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bon Number</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-2026-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Cost (Ongkir)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isBonusTransaction"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Bonus Transaction</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Mark this bon as a bonus redemption. Items will be free (0 Omzet).
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Items Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Products (Line Items)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: 1 })}>
              <IconPlus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const currentProductId = watchedItems[index]?.productId;
              const currentQty = watchedItems[index]?.quantity || 1;
              const product = products.find((p) => p.id === currentProductId);
              
              let unitPrice = 0;
              let lineOmzet = 0;
              let discountStr = "No discount";

              if (product && selectedCustomerId) {
                if (isBonusTransaction) {
                  unitPrice = 0;
                  lineOmzet = 0;
                  discountStr = "Bonus (Free)";
                } else {
                  const discounts = customerDiscounts[selectedCustomerId]?.[product.productType as "LM" | "BR"] || [];
                  unitPrice = calculateCascadingDiscount(Number(product.basePrice), discounts);
                  lineOmzet = unitPrice * currentQty;
                  if (discounts.length > 0) {
                    discountStr = discounts.map(d => `${d}%`).join(" + ");
                  }
                }
              }

              return (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                  <div className="col-span-12 md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index !== 0 ? "sr-only md:not-sr-only" : ""}>Product</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.productCode} - {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index !== 0 ? "sr-only md:not-sr-only" : ""}>Qty</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Preview calculated values */}
                  <div className="col-span-6 md:col-span-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Price (after {discountStr})</div>
                    <div className="font-medium">Rp {unitPrice.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-muted-foreground pt-1">Line Omzet</div>
                    <div className="font-bold text-primary">Rp {lineOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex justify-end pb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <IconTrash className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {form.formState.errors.items?.root && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.items.root.message}
              </p>
            )}

            {/* Summary */}
            <div className="flex flex-col items-end gap-2 pt-6">
              <div className="flex justify-between w-full md:w-1/3">
                <span className="text-muted-foreground">Subtotal Omzet:</span>
                <span className="font-semibold">Rp {subtotalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between w-full md:w-1/3">
                <span className="text-muted-foreground">Shipping (Ongkir):</span>
                <span className="font-semibold">Rp {(Number(shippingCost) || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between w-full md:w-1/3 border-t pt-2">
                <span className="text-lg font-bold">Total Tagihan:</span>
                <span className="text-xl font-bold text-primary">Rp {totalAmount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

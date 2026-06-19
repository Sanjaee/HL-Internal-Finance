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
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";

import { createTransaction, updateTransaction } from "@/actions/transaction-actions";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateCascadingDiscount } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTrash, IconPlus, IconCalendar } from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { SelectDialog } from "@/components/ui/select-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function TransactionForm({
  customers,
  customerDiscounts,
  products,
  initialData,
  transactionId,
  onSuccess,
  onCancel,
}: {
  customers: any[];
  customerDiscounts: Record<string, { LM: number[]; BR: number[] }>;
  products: any[];
  initialData?: Partial<TransactionFormValues>;
  transactionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState<boolean[]>([]);
  const router = useRouter();


  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: initialData || {
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

  // Sync productDialogOpen length with fields length
  useEffect(() => {
    setProductDialogOpen((prev) => {
      if (prev.length === fields.length) return prev;
      const next = [...prev];
      while (next.length < fields.length) next.push(false);
      return next.slice(0, fields.length);
    });
  }, [fields.length]);

  const watchedValues = form.watch();
  const selectedCustomerId = watchedValues.customerId;
  const isBonusTransaction = watchedValues.isBonusTransaction;
  const shippingCost = watchedValues.shippingCost;
  const watchedItems = watchedValues.items || [];

  // Calculate totals
  let subtotalOmzet = 0;

  watchedItems.forEach((item: any) => {
    if (!item.productId || !selectedCustomerId) return;
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    if (isBonusTransaction) {
      // Bonus items are free
      return;
    }

    const discounts = customerDiscounts[selectedCustomerId]?.[product.productType as "LM" | "BR"] || [];
    const discountedPrice = calculateCascadingDiscount(Number(product.basePrice), discounts);
    
    subtotalOmzet += discountedPrice * (item.quantity || 1);
  });

  const totalAmount = subtotalOmzet + (Number(shippingCost) || 0);

  async function onSubmit(data: TransactionFormValues) {
    setIsLoading(true);
    let res;
    if (transactionId) {
      res = await updateTransaction(transactionId, data);
    } else {
      res = await createTransaction(data);
    }
    setIsLoading(false);

    if (res?.success) {
      toast.success(transactionId ? "Transaction updated successfully!" : "Transaction created successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        if (transactionId) {
          router.push(`/dashboard/transactions/${transactionId}`);
        } else {
          router.push("/dashboard/transactions");
        }
      }
    } else {
      toast.error(res?.error || "Failed to save transaction");
    }
  }

  // Build customer options for SelectDialog
  const customerOptions = customers.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.customerCode,
  }));

  // Build product options for SelectDialog
  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.productCode,
  }));

  const openProductDialog = (index: number) => {
    setProductDialogOpen((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const closeProductDialog = (index: number, open: boolean) => {
    setProductDialogOpen((prev) => {
      const next = [...prev];
      next[index] = open;
      return next;
    });
  };

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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <IconCalendar className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Input placeholder="Auto generate code" {...field} />
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
                  <FormControl>
                    <SelectDialog
                      open={customerDialogOpen}
                      onOpenChange={setCustomerDialogOpen}
                      options={customerOptions}
                      selectedValue={field.value}
                      onSelect={(option) => field.onChange(option.id)}
                      placeholder="Select a customer"
                      title="Select Customer"
                      searchPlaceholder="Search customer name..."
                    />
                  </FormControl>
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
                    <CurrencyInput placeholder="0" {...field} />
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
                          <FormControl>
                            <SelectDialog
                              open={productDialogOpen[index] ?? false}
                              onOpenChange={(open) => closeProductDialog(index, open)}
                              options={productOptions}
                              selectedValue={field.value}
                              onSelect={(option) => field.onChange(option.id)}
                              placeholder="Select a product"
                              title="Select Product"
                              searchPlaceholder="Search product name or code..."
                            />
                          </FormControl>
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
                            <CurrencyInput {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Preview calculated values */}
                  <div className="col-span-6 md:col-span-4 space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {product && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 leading-none">
                          {product.productType}
                        </Badge>
                      )}
                      <span>Price (after {discountStr})</span>
                    </div>
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
          <Button type="button" variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
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

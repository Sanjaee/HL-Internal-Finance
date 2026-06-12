"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/schemas/product";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/actions/product-actions";
import { toast } from "sonner";
import { useState } from "react";

export function ProductForm({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      productCode: initialData?.productCode || "",
      productType: initialData?.productType || "LM",
      costPrice: initialData?.costPrice ? Number(initialData.costPrice) : 0,
      basePrice: initialData?.basePrice ? Number(initialData.basePrice) : 0,
    },
  });

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true);
    let res;
    if (initialData?.id) {
      res = await updateProduct(initialData.id, data);
    } else {
      res = await createProduct(data);
    }
    setIsLoading(false);

    if (res?.success) {
      toast.success(initialData?.id ? "Product updated successfully!" : "Product created successfully!");
      if (onSuccess) onSuccess();
    } else {
      toast.error(res?.error || "An error occurred");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1 pb-2">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Code</FormLabel>
                <FormControl>
                  <Input placeholder="Kosongkan jika ingin generate Product Code otomatis" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full">
                    <SelectItem value="LM">LM</SelectItem>
                    <SelectItem value="BR">BR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price (Rp)</FormLabel>
                <FormControl>
                  <CurrencyInput placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Selling Price (Rp)</FormLabel>
                <FormControl>
                  <CurrencyInput placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : initialData?.id ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

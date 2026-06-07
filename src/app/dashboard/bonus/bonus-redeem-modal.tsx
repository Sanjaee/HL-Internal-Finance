"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { redeemBonus } from "@/actions/bonus-actions";
import { toast } from "sonner";
import { IconTrash, IconPlus } from "@tabler/icons-react";

const redeemSchema = z.object({
  bonusCountToConsume: z.coerce.number().min(1, "Must consume at least 1"),
  items: z.array(z.object({
    productId: z.string().min(1, "Required"),
    quantity: z.coerce.number().min(1, "Qty min 1"),
  })).min(1, "Must select at least 1 product"),
});

type RedeemFormValues = {
  bonusCountToConsume: number;
  items: { productId: string; quantity: number }[];
};

export function BonusRedeemModal({
  customer,
  products,
  open,
  onOpenChange,
}: {
  customer: any;
  products: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RedeemFormValues>({
    resolver: zodResolver(redeemSchema) as any,
    defaultValues: {
      bonusCountToConsume: 1,
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(data: RedeemFormValues) {
    if (data.bonusCountToConsume > customer.available) {
      form.setError("bonusCountToConsume", { message: "Exceeds available bonus rights" });
      return;
    }

    setIsLoading(true);
    const res = await redeemBonus({
      customerId: customer.id,
      bonusCountToConsume: data.bonusCountToConsume,
      items: data.items,
    });
    setIsLoading(false);

    if (res?.success) {
      toast.success("Bonus redeemed successfully!");
      form.reset();
      onOpenChange(false);
    } else {
      toast.error(res?.error || "Failed to redeem bonus");
    }
  }

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) form.reset();
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redeem Bonus for {customer.name}</DialogTitle>
          <DialogDescription>
            They have {customer.available} bonus rights available. Each right consumes Rp {Number(customer.bonusThreshold).toLocaleString("id-ID", { maximumFractionDigits: 0 })} of omzet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="bonusCountToConsume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rights to Consume</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max={customer.available} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">Free Products</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: 1 })}>
                  <IconPlus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel>Product</FormLabel>}
                          <Select onValueChange={field.onChange} value={field.value}>
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
                  <div className="w-24">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel>Qty</FormLabel>}
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive mb-0.5"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.items?.root && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.items.root.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Redemption"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

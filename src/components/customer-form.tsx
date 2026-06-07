"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerFormValues } from "@/schemas/customer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createCustomer, updateCustomer } from "@/actions/customer-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CustomerForm({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || "",
      customerCode: initialData?.customerCode || "",
      bonusThreshold: initialData?.bonusThreshold ? String(initialData.bonusThreshold) : "",
      discountsLM: initialData?.discountsLM || [],
      discountsBR: initialData?.discountsBR || [],
    },
  });

  const { fields: fieldsLM, append: appendLM, remove: removeLM } = useFieldArray({
    name: "discountsLM",
    control: form.control,
  });

  const { fields: fieldsBR, append: appendBR, remove: removeBR } = useFieldArray({
    name: "discountsBR",
    control: form.control,
  });

  async function onSubmit(data: CustomerFormValues) {
    setIsLoading(true);
    let res;
    if (initialData?.id) {
      res = await updateCustomer(initialData.id, data);
    } else {
      res = await createCustomer(data);
    }
    setIsLoading(false);

    if (res?.success) {
      toast.success(initialData?.id ? "Customer updated successfully!" : "Customer created successfully!");
      if (onSuccess) onSuccess();
    } else {
      toast.error(res?.error || "An error occurred");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pb-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Leave blank to auto-generate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bonusThreshold"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Bonus Threshold (Rp)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* LM Discounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">LM Discounts</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendLM({ sequenceNo: fieldsLM.length + 1, discountPercent: "" })}
              >
                <IconPlus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fieldsLM.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`discountsLM.${index}.discountPercent`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Step {index + 1} (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g. 5.5" {...field} className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeLM(index)}>
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fieldsLM.length === 0 && <p className="text-xs text-muted-foreground">No LM discounts configured.</p>}
            </CardContent>
          </Card>

          {/* BR Discounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">BR Discounts</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendBR({ sequenceNo: fieldsBR.length + 1, discountPercent: "" })}
              >
                <IconPlus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fieldsBR.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`discountsBR.${index}.discountPercent`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Step {index + 1} (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g. 5.5" {...field} className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeBR(index)}>
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fieldsBR.length === 0 && <p className="text-xs text-muted-foreground">No BR discounts configured.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-2 pb-1 border-t mt-4">
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

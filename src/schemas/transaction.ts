import { z } from "zod";

export const transactionItemSchema = z.object({
  productId: z.string().uuid("Product must be selected"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

export const transactionSchema = z.object({
  transactionDate: z.date({
    required_error: "Transaction date is required",
  }),
  bonNumber: z.string().min(1, "Bon number is required"),
  customerId: z.string().uuid("Customer must be selected"),
  description: z.string().optional(),
  shippingCost: z.coerce.number().min(0, "Shipping cost cannot be negative").default(0),
  isBonusTransaction: z.boolean().default(false),
  items: z.array(transactionItemSchema).min(1, "At least one product is required"),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type TransactionItemFormValues = z.infer<typeof transactionItemSchema>;

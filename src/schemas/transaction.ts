import { z } from "zod";

export const transactionItemSchema = z.object({
  productId: z.string().uuid("Product must be selected"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

export const transactionSchema = z.object({
  transactionDate: z.date({
    message: "Transaction date is required",
  }),
  bonNumber: z.string().optional().or(z.literal("")),
  customerId: z.string().uuid("Customer must be selected"),
  description: z.string().optional(),
  shippingCost: z.coerce.number().min(0, "Shipping cost cannot be negative").default(0),
  isBonusTransaction: z.boolean().default(false),
  bonusCountToConsume: z.coerce.number().min(0).default(0),
  items: z.array(transactionItemSchema).min(1, "At least one product is required"),
}).superRefine((data, ctx) => {
  if (data.isBonusTransaction && data.bonusCountToConsume < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bonusCountToConsume"],
      message: "At least 1 bonus must be consumed for a bonus transaction",
    });
  }
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type TransactionItemFormValues = z.infer<typeof transactionItemSchema>;

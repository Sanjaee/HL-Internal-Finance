import { z } from "zod";

export const discountStepSchema = z.object({
  id: z.string().uuid().optional(),
  sequenceNo: z.number().min(1),
  discountPercent: z.coerce.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Discount percent must be between 0 and 100"),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  customerCode: z.string().optional(),
  bonusThreshold: z.coerce.string().min(1, "Bonus threshold is required"),
  discountsLM: z.array(discountStepSchema).optional().default([]),
  discountsBR: z.array(discountStepSchema).optional().default([]),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

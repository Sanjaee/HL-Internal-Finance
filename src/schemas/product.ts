import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  productCode: z.string().optional(),
  productType: z.enum(["LM", "BR"], {
    required_error: "Product type must be selected",
  }),
  costPrice: z.coerce.number().min(0, "Cost price must be positive"),
  basePrice: z.coerce.number().min(0, "Base price must be positive"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

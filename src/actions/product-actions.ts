"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { productSchema, ProductFormValues } from "@/schemas/product";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function generateProductCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomStr}`;
}

export async function getProducts() {
  try {
    const productList = await db
      .select()
      .from(products)
      .where(eq(products.isDeleted, false))
      .orderBy(desc(products.createdAt));

    return { success: true, data: productList };
  } catch (error: any) {
    console.error("Failed to fetch products:", error);
    return { success: false, error: error.message || "Failed to fetch products" };
  }
}

export async function createProduct(data: ProductFormValues) {
  try {
    const validation = productSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: "Invalid data", details: validation.error.flatten() };
    }

    const code = data.productCode?.trim() ? data.productCode : generateProductCode(data.name);

    // Check unique code
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.productCode, code));
    
    if (existing.length > 0) {
      return { success: false, error: `Product code ${code} already exists.` };
    }

    await db.insert(products).values({
      name: data.name,
      productCode: code,
      productType: data.productType,
      costPrice: String(data.costPrice),
      basePrice: String(data.basePrice),
    });

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
}

export async function updateProduct(id: string, data: ProductFormValues) {
  try {
    const validation = productSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: "Invalid data", details: validation.error.flatten() };
    }

    const code = data.productCode?.trim() ? data.productCode : generateProductCode(data.name);

    // Check unique code excluding current product
    const existingList = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.productCode, code));
    
    const duplicate = existingList.find((p) => p.id !== id);
    if (duplicate) {
      return { success: false, error: `Product code ${code} already exists.` };
    }

    await db.update(products).set({
      name: data.name,
      productCode: code,
      productType: data.productType,
      costPrice: String(data.costPrice),
      basePrice: String(data.basePrice),
      updatedAt: new Date(),
    }).where(eq(products.id, id));

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return { success: false, error: error.message || "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  try {
    await db.update(products).set({
      isDeleted: true,
      deletedAt: new Date(),
    }).where(eq(products.id, id));

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return { success: false, error: error.message || "Failed to delete product" };
  }
}

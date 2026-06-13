"use server";

import { db } from "@/db";
import {
  customers,
  customerDiscountGroups,
  customerDiscountDetails,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { CustomerFormValues } from "@/schemas/customer";

export async function getCustomers() {
  try {
    const allCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.isDeleted, false))
      .orderBy(desc(customers.createdAt));
    return { success: true, data: allCustomers };
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return { success: false, error: "Failed to fetch customers" };
  }
}

export async function getCustomerById(id: string) {
  try {
    const customerList = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    
    if (customerList.length === 0) return { success: false, error: "Not found" };
    
    const customer = customerList[0];
    
    // Fetch discount groups
    const groups = await db
      .select()
      .from(customerDiscountGroups)
      .where(eq(customerDiscountGroups.customerId, id));
      
    const lmGroup = groups.find(g => g.productType === "LM");
    const brGroup = groups.find(g => g.productType === "BR");
    
    let discountsLM: (typeof customerDiscountDetails.$inferSelect)[] = [];
    if (lmGroup) {
      discountsLM = await db.select()
        .from(customerDiscountDetails)
        .where(eq(customerDiscountDetails.discountGroupId, lmGroup.id))
        .orderBy(customerDiscountDetails.sequenceNo);
    }
    
    let discountsBR: (typeof customerDiscountDetails.$inferSelect)[] = [];
    if (brGroup) {
      discountsBR = await db.select()
        .from(customerDiscountDetails)
        .where(eq(customerDiscountDetails.discountGroupId, brGroup.id))
        .orderBy(customerDiscountDetails.sequenceNo);
    }
    
    return { success: true, data: { ...customer, discountsLM, discountsBR } };
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return { success: false, error: "Failed to fetch customer" };
  }
}

export async function createCustomer(data: CustomerFormValues) {
  try {
    const code = data.customerCode || `CUST-${Date.now().toString().slice(-6)}`;
    
    // Check for duplicate code
    const existing = await db.select().from(customers).where(eq(customers.customerCode, code));
    if (existing.length > 0) {
      return { success: false, error: `Customer code "${code}" already exists` };
    }
    
    const newCustomer = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(customers).values({
        name: data.name,
        customerCode: code,
        bonusThreshold: data.bonusThreshold,
      }).returning();
      
      // LM Discounts
      if (data.discountsLM && data.discountsLM.length > 0) {
        const [lmGroup] = await tx.insert(customerDiscountGroups).values({
          customerId: inserted.id,
          productType: "LM",
        }).returning();
        
        await tx.insert(customerDiscountDetails).values(
          data.discountsLM.map((d, index) => ({
            discountGroupId: lmGroup.id,
            sequenceNo: index + 1,
            discountPercent: d.discountPercent,
          }))
        );
      }
      
      // BR Discounts
      if (data.discountsBR && data.discountsBR.length > 0) {
        const [brGroup] = await tx.insert(customerDiscountGroups).values({
          customerId: inserted.id,
          productType: "BR",
        }).returning();
        
        await tx.insert(customerDiscountDetails).values(
          data.discountsBR.map((d, index) => ({
            discountGroupId: brGroup.id,
            sequenceNo: index + 1,
            discountPercent: d.discountPercent,
          }))
        );
      }
      
      return inserted;
    });
    
    revalidatePath("/dashboard", "layout");
    return { success: true, data: newCustomer };
  } catch (error) {
    console.error("Failed to create customer:", error);
    return { success: false, error: "Failed to create customer" };
  }
}

export async function updateCustomer(id: string, data: CustomerFormValues) {
  try {
    if (data.customerCode) {
      // Check for duplicate code (exclude self)
      const existing = await db.select().from(customers).where(eq(customers.customerCode, data.customerCode));
      if (existing.length > 0 && existing[0].id !== id) {
        return { success: false, error: `Customer code "${data.customerCode}" already exists` };
      }
    }

    await db.transaction(async (tx) => {
      await tx.update(customers).set({
        name: data.name,
        customerCode: data.customerCode,
        bonusThreshold: data.bonusThreshold,
        updatedAt: new Date(),
      }).where(eq(customers.id, id));
      
      const existingGroups = await tx.select().from(customerDiscountGroups).where(eq(customerDiscountGroups.customerId, id));
      
      for (const group of existingGroups) {
        await tx.delete(customerDiscountDetails).where(eq(customerDiscountDetails.discountGroupId, group.id));
      }
      if (existingGroups.length > 0) {
        await tx.delete(customerDiscountGroups).where(eq(customerDiscountGroups.customerId, id));
      }
      
      // LM Discounts
      if (data.discountsLM && data.discountsLM.length > 0) {
        const [lmGroup] = await tx.insert(customerDiscountGroups).values({
          customerId: id,
          productType: "LM",
        }).returning();
        
        await tx.insert(customerDiscountDetails).values(
          data.discountsLM.map((d, index) => ({
            discountGroupId: lmGroup.id,
            sequenceNo: index + 1,
            discountPercent: d.discountPercent,
          }))
        );
      }
      
      // BR Discounts
      if (data.discountsBR && data.discountsBR.length > 0) {
        const [brGroup] = await tx.insert(customerDiscountGroups).values({
          customerId: id,
          productType: "BR",
        }).returning();
        
        await tx.insert(customerDiscountDetails).values(
          data.discountsBR.map((d, index) => ({
            discountGroupId: brGroup.id,
            sequenceNo: index + 1,
            discountPercent: d.discountPercent,
          }))
        );
      }
    });
    
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update customer:", error);
    return { success: false, error: "Failed to update customer" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await db.update(customers).set({
      isDeleted: true,
      deletedAt: new Date(),
    }).where(eq(customers.id, id));
    
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return { success: false, error: "Failed to delete customer" };
  }
}

"use server";

import { db } from "@/db";
import {
  customers,
  transactions,
  transactionItems,
  bonusRedemptions,
  products,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBonusStatus() {
  try {
    const list = await db
      .select({
        id: customers.id,
        name: customers.name,
        customerCode: customers.customerCode,
        bonusThreshold: customers.bonusThreshold,
        accumulatedBonusOmzet: customers.accumulatedBonusOmzet,
        grantedBonusCount: customers.grantedBonusCount,
      })
      .from(customers)
      .where(eq(customers.isDeleted, false));

    const statusList = list.map((c) => {
      const accOmzet = Number(c.accumulatedBonusOmzet || 0);
      const threshold = Number(c.bonusThreshold);
      const granted = c.grantedBonusCount || 0;

      const totalEarnedAllTime = granted + (threshold > 0 ? Math.floor(accOmzet / threshold) : 0);
      const available = threshold > 0 ? Math.floor(accOmzet / threshold) : 0;
      const currentCycleProgress = threshold > 0 ? accOmzet % threshold : 0;
      const progressPercent = threshold > 0 ? Math.min(100, (currentCycleProgress / threshold) * 100) : 0;

      return {
        ...c,
        totalEarned: totalEarnedAllTime, // For display if needed
        available,
        currentCycleProgress,
        progressPercent,
      };
    });

    return { success: true, data: statusList };
  } catch (error: any) {
    console.error("Failed to fetch bonus status:", error);
    return { success: false, error: error.message || "Failed to fetch bonus status" };
  }
}

export async function redeemBonus(data: {
  customerId: string;
  bonusCountToConsume: number;
  items: { productId: string; quantity: number }[];
}, userId?: string) {
  try {
    if (data.bonusCountToConsume <= 0) throw new Error("Must consume at least 1 bonus");
    if (!data.items || data.items.length === 0) throw new Error("Must select at least 1 product");

    await db.transaction(async (tx) => {
      // 1. Lock customer / get current stats
      const [customer] = await tx.select().from(customers).where(eq(customers.id, data.customerId));
      if (!customer) throw new Error("Customer not found");

      const accOmzet = Number(customer.accumulatedBonusOmzet || 0);
      const threshold = Number(customer.bonusThreshold);
      const granted = customer.grantedBonusCount || 0;
      const totalEarned = threshold > 0 ? Math.floor(accOmzet / threshold) : 0;
      const available = totalEarned;

      if (data.bonusCountToConsume > available) {
        throw new Error(`Cannot consume ${data.bonusCountToConsume} bonuses. Only ${available} available.`);
      }

      // 2. Create Bonus Transaction
      const bonNumber = `BNS-${Date.now().toString().slice(-6)}`;
      const [newTx] = await tx.insert(transactions).values({
        bonNumber,
        customerId: data.customerId,
        transactionDate: new Date().toISOString().split("T")[0],
        shippingCost: "0",
        isBonusTransaction: true,
        description: `Bonus Redemption (${data.bonusCountToConsume} rights)`,
        status: "LUNAS", // Bonus is implicitly LUNAS since no payment needed
        subtotalOmzet: "0",
        totalAmount: "0",
        totalProfit: "0",
        createdBy: userId,
        updatedBy: userId,
      }).returning();

      // 3. Insert Items (Free)
      const productIds = data.items.map((i) => i.productId);
      const productList = await tx.select().from(products).where(sql`${products.id} IN ${productIds}`);
      const productMap = new Map(productList.map((p) => [p.id, p]));

      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);

        await tx.insert(transactionItems).values({
          transactionId: newTx.id,
          productId: product.id,
          productNameSnapshot: product.name,
          productType: product.productType,
          quantity: item.quantity,
          basePrice: String(product.basePrice),
          costPrice: String(product.costPrice),
          discountedUnitPrice: "0", // Free
          discountPercentageEffective: "100",
          lineOmzet: "0",
          lineProfit: "0",
          isBonusItem: true,
        });
      }

      // 4. Record Redemption
      const consumedAmount = data.bonusCountToConsume * threshold;
      await tx.insert(bonusRedemptions).values({
        customerId: data.customerId,
        transactionId: newTx.id,
        bonusCount: data.bonusCountToConsume,
        thresholdAmount: String(threshold),
        consumedAmount: String(consumedAmount),
        remainingAmount: String(accOmzet - consumedAmount),
      });

      // 5. Update Customer's Granted Count and Reduce Accumulated Omzet
      await tx.update(customers).set({
        grantedBonusCount: granted + data.bonusCountToConsume,
        accumulatedBonusOmzet: String(accOmzet - consumedAmount),
      }).where(eq(customers.id, data.customerId));

    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to redeem bonus:", error);
    return { success: false, error: error.message || "Failed to redeem bonus" };
  }
}

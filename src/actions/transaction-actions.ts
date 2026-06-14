"use server";

import { db } from "@/db";
import {
  transactions,
  transactionItems,
  transactionItemDiscountSnapshots,
  customers,
  products,
  customerDiscountGroups,
  customerDiscountDetails,
  customerBonusLedgers,
  bonusRedemptions,
} from "@/db/schema";
import { transactionSchema, TransactionFormValues } from "@/schemas/transaction";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateCascadingDiscount, calculateEffectiveDiscountPercentage } from "@/lib/calculations";

export async function getTransactions() {
  try {
    const list = await db
      .select({
        id: transactions.id,
        bonNumber: transactions.bonNumber,
        transactionDate: transactions.transactionDate,
        status: transactions.status,
        subtotalOmzet: transactions.subtotalOmzet,
        shippingCost: transactions.shippingCost,
        totalAmount: transactions.totalAmount,
        customerName: customers.name,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .orderBy(desc(transactions.createdAt));

    return { success: true, data: list };
  } catch (error: any) {
    console.error("Failed to fetch transactions:", error);
    return { success: false, error: error.message || "Failed to fetch transactions" };
  }
}

export async function getTransactionById(id: string) {
  try {
    const [tx] = await db
      .select({
        id: transactions.id,
        bonNumber: transactions.bonNumber,
        transactionDate: transactions.transactionDate,
        paymentDate: transactions.paymentDate,
        status: transactions.status,
        subtotalOmzet: transactions.subtotalOmzet,
        shippingCost: transactions.shippingCost,
        totalAmount: transactions.totalAmount,
        totalProfit: transactions.totalProfit,
        description: transactions.description,
        isBonusTransaction: transactions.isBonusTransaction,
        customerId: transactions.customerId,
        customerName: customers.name,
        customerCode: customers.customerCode,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .where(eq(transactions.id, id));

    if (!tx) return { success: false, error: "Transaction not found" };

    const items = await db
      .select({
        id: transactionItems.id,
        productId: transactionItems.productId,
        productNameSnapshot: transactionItems.productNameSnapshot,
        productType: transactionItems.productType,
        quantity: transactionItems.quantity,
        basePrice: transactionItems.basePrice,
        discountedUnitPrice: transactionItems.discountedUnitPrice,
        lineOmzet: transactionItems.lineOmzet,
        lineProfit: transactionItems.lineProfit,
        isBonusItem: transactionItems.isBonusItem,
      })
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, id));

    return { success: true, data: { ...tx, items } };
  } catch (error: any) {
    console.error("Failed to fetch transaction:", error);
    return { success: false, error: error.message || "Failed to fetch transaction" };
  }
}

export async function createTransaction(data: TransactionFormValues, userId?: string) {
  try {
    const validation = transactionSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: "Invalid data", details: validation.error.flatten() };
    }

    const { customerId, transactionDate, items, shippingCost, isBonusTransaction, description } = validation.data;
    const bonNumber = validation.data.bonNumber || `INV-${Date.now().toString().slice(-6)}`;

    // Check unique Bon
    const existingBon = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.bonNumber, bonNumber));
    if (existingBon.length > 0) {
      return { success: false, error: `Bon number ${bonNumber} already exists.` };
    }

    // Process in transaction
    await db.transaction(async (tx) => {
      // 1. Fetch Customer Discount Groups
      const discountGroups = await tx
        .select()
        .from(customerDiscountGroups)
        .where(eq(customerDiscountGroups.customerId, customerId));

      const groupIds = discountGroups.map((g) => g.id);
      
      let discountDetails: any[] = [];
      if (groupIds.length > 0) {
        discountDetails = await tx
          .select()
          .from(customerDiscountDetails)
          .where(sql`${customerDiscountDetails.discountGroupId} IN ${groupIds}`)
          .orderBy(customerDiscountDetails.sequenceNo);
      }

      // Map discounts for easy lookup: { 'LM': [20, 10], 'BR': [5] }
      const customerDiscounts: Record<string, number[]> = { LM: [], BR: [] };
      for (const group of discountGroups) {
        const type = group.productType;
        const details = discountDetails.filter((d) => d.discountGroupId === group.id);
        customerDiscounts[type] = details.map((d) => Number(d.discountPercent));
      }

      // 2. Fetch all required Products
      const productIds = items.map((i) => i.productId);
      const productList = await tx
        .select()
        .from(products)
        .where(sql`${products.id} IN ${productIds}`);

      const productMap = new Map(productList.map((p) => [p.id, p]));

      // 3. Prepare data variables
      let totalSubtotalOmzet = 0;
      let totalProfit = 0;

      // 4. Insert Transaction Header
      const [newTx] = await tx.insert(transactions).values({
        bonNumber,
        customerId,
        transactionDate: transactionDate.toISOString().split("T")[0],
        shippingCost: String(shippingCost),
        isBonusTransaction,
        description,
        status: "PIUTANG", // always starts as PIUTANG
        // We will update these totals after calculating lines
        subtotalOmzet: "0",
        totalAmount: "0",
        totalProfit: "0",
        createdBy: userId,
        updatedBy: userId,
      }).returning();

      // 5. Process each item
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const isBonusItem = isBonusTransaction;
        
        let lineOmzet = 0;
        let lineProfit = 0;
        let discountedPrice = 0;
        let effDiscount = 0;
        const base = Number(product.basePrice);
        const cost = Number(product.costPrice);

        const discountPercents = customerDiscounts[product.productType] || [];

        if (isBonusItem) {
          // Bonus item = free
          discountedPrice = 0;
          effDiscount = 100;
          lineOmzet = 0;
          lineProfit = 0; // Bonus cost doesn't reduce HL profit per rule D5
        } else {
          discountedPrice = calculateCascadingDiscount(base, discountPercents);
          effDiscount = calculateEffectiveDiscountPercentage(base, discountedPrice);
          lineOmzet = discountedPrice * item.quantity;
          lineProfit = (discountedPrice - cost) * item.quantity;
        }

        totalSubtotalOmzet += lineOmzet;
        totalProfit += lineProfit;

        // Insert Transaction Item
        const [newItem] = await tx.insert(transactionItems).values({
          transactionId: newTx.id,
          productId: product.id,
          productNameSnapshot: product.name,
          productType: product.productType,
          quantity: item.quantity,
          basePrice: String(base),
          costPrice: String(cost),
          discountedUnitPrice: String(discountedPrice),
          discountPercentageEffective: String(effDiscount),
          lineOmzet: String(lineOmzet),
          lineProfit: String(lineProfit),
          isBonusItem,
        }).returning();

        // Insert Discount Snapshots
        if (!isBonusItem && discountPercents.length > 0) {
          await tx.insert(transactionItemDiscountSnapshots).values(
            discountPercents.map((pct, idx) => ({
              transactionItemId: newItem.id,
              sequenceNo: idx + 1,
              discountPercent: String(pct),
            }))
          );
        }
      }

      // 6. Update Transaction Totals
      const totalAmount = totalSubtotalOmzet + shippingCost;
      await tx.update(transactions).set({
        subtotalOmzet: String(totalSubtotalOmzet),
        totalAmount: String(totalAmount),
        totalProfit: String(totalProfit),
      }).where(eq(transactions.id, newTx.id));
    });
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create transaction:", error);
    return { success: false, error: error.message || "Failed to create transaction" };
  }
}

export async function markTransactionLunas(id: string, paymentDate: Date) {
  try {
    await db.transaction(async (tx) => {
      // Get the transaction
      const [transaction] = await tx.select().from(transactions).where(eq(transactions.id, id));
      if (!transaction) throw new Error("Transaction not found");
      if (transaction.status === "LUNAS") throw new Error("Transaction is already paid");

      // Update the transaction
      await tx.update(transactions).set({
        status: "LUNAS",
        paymentDate: paymentDate.toISOString().split("T")[0],
        updatedAt: new Date(),
      }).where(eq(transactions.id, id));

      // Record omzet to customer's accumulated omzet if not bonus
      if (!transaction.isBonusTransaction) {
        // Increase accumulated bonus omzet
        await tx.execute(
          sql`UPDATE ${customers} SET accumulated_bonus_omzet = accumulated_bonus_omzet + ${Number(transaction.subtotalOmzet)} WHERE id = ${transaction.customerId}`
        );
      }
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark transaction as LUNAS:", error);
    return { success: false, error: error.message || "Failed to mark as LUNAS" };
  }
}

export async function deleteTransaction(id: string) {
  try {
    // Delete in order due to foreign keys, or ideally transaction is just marked deleted,
    // but schema doesn't have isDeleted on transactions. We will Hard Delete or soft if we add it.
    // Let's hard delete since it's allowed.
    await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(transactions).where(eq(transactions.id, id));
      if (oldTx && oldTx.status === "LUNAS" && !oldTx.isBonusTransaction) {
        await tx.execute(
          sql`UPDATE ${customers} SET accumulated_bonus_omzet = accumulated_bonus_omzet - ${Number(oldTx.subtotalOmzet)} WHERE id = ${oldTx.customerId}`
        );
      }

      const items = await tx.select({ id: transactionItems.id }).from(transactionItems).where(eq(transactionItems.transactionId, id));
      const itemIds = items.map(i => i.id);
      
      if (itemIds.length > 0) {
        await tx.delete(transactionItemDiscountSnapshots).where(sql`${transactionItemDiscountSnapshots.transactionItemId} IN ${itemIds}`);
      }
      
      await tx.delete(transactionItems).where(eq(transactionItems.transactionId, id));
      await tx.delete(customerBonusLedgers).where(eq(customerBonusLedgers.transactionId, id));
      await tx.delete(bonusRedemptions).where(eq(bonusRedemptions.transactionId, id));
      await tx.delete(transactions).where(eq(transactions.id, id));
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: error.message || "Failed to delete transaction" };
  }
}

export async function updateTransaction(id: string, data: TransactionFormValues, userId?: string) {
  try {
    const validation = transactionSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: "Invalid data", details: validation.error.flatten() };
    }

    const { customerId, transactionDate, items, shippingCost, isBonusTransaction, description } = validation.data;
    const bonNumber = validation.data.bonNumber || `INV-${Date.now().toString().slice(-6)}`;

    // Check unique Bon, exclude current
    const existingBonList = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.bonNumber, bonNumber));
    const duplicate = existingBonList.find((b) => b.id !== id);
    if (duplicate) {
      return { success: false, error: `Bon number ${bonNumber} already exists.` };
    }

    await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(transactions).where(eq(transactions.id, id));
      if (!oldTx) throw new Error("Transaction not found");

      // 1. Fetch Customer Discount Groups
      const discountGroups = await tx
        .select()
        .from(customerDiscountGroups)
        .where(eq(customerDiscountGroups.customerId, customerId));

      const groupIds = discountGroups.map((g) => g.id);
      
      let discountDetails: any[] = [];
      if (groupIds.length > 0) {
        discountDetails = await tx
          .select()
          .from(customerDiscountDetails)
          .where(sql`${customerDiscountDetails.discountGroupId} IN ${groupIds}`)
          .orderBy(customerDiscountDetails.sequenceNo);
      }

      const customerDiscounts: Record<string, number[]> = { LM: [], BR: [] };
      for (const group of discountGroups) {
        const type = group.productType;
        const details = discountDetails.filter((d) => d.discountGroupId === group.id);
        customerDiscounts[type] = details.map((d) => Number(d.discountPercent));
      }

      // 2. Fetch Products
      const productIds = items.map((i) => i.productId);
      const productList = await tx
        .select()
        .from(products)
        .where(sql`${products.id} IN ${productIds}`);
      const productMap = new Map(productList.map((p) => [p.id, p]));

      // 3. Subtract old omzet if LUNAS
      if (oldTx.status === "LUNAS" && !oldTx.isBonusTransaction) {
        await tx.execute(
          sql`UPDATE ${customers} SET accumulated_bonus_omzet = accumulated_bonus_omzet - ${Number(oldTx.subtotalOmzet)} WHERE id = ${oldTx.customerId}`
        );
      }

      // 4. Delete old items & snapshots
      const oldItems = await tx.select({ id: transactionItems.id }).from(transactionItems).where(eq(transactionItems.transactionId, id));
      const oldItemIds = oldItems.map(i => i.id);
      if (oldItemIds.length > 0) {
        await tx.delete(transactionItemDiscountSnapshots).where(sql`${transactionItemDiscountSnapshots.transactionItemId} IN ${oldItemIds}`);
      }
      await tx.delete(transactionItems).where(eq(transactionItems.transactionId, id));

      // 5. Calculate new lines
      let totalSubtotalOmzet = 0;
      let totalProfit = 0;

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const isBonusItem = isBonusTransaction;
        
        let lineOmzet = 0;
        let lineProfit = 0;
        let discountedPrice = 0;
        let effDiscount = 0;
        const base = Number(product.basePrice);
        const cost = Number(product.costPrice);

        const discountPercents = customerDiscounts[product.productType] || [];

        if (isBonusItem) {
          discountedPrice = 0;
          effDiscount = 100;
          lineOmzet = 0;
          lineProfit = 0;
        } else {
          discountedPrice = calculateCascadingDiscount(base, discountPercents);
          effDiscount = calculateEffectiveDiscountPercentage(base, discountedPrice);
          lineOmzet = discountedPrice * item.quantity;
          lineProfit = (discountedPrice - cost) * item.quantity;
        }

        totalSubtotalOmzet += lineOmzet;
        totalProfit += lineProfit;

        const [newItem] = await tx.insert(transactionItems).values({
          transactionId: id,
          productId: product.id,
          productNameSnapshot: product.name,
          productType: product.productType,
          quantity: item.quantity,
          basePrice: String(base),
          costPrice: String(cost),
          discountedUnitPrice: String(discountedPrice),
          discountPercentageEffective: String(effDiscount),
          lineOmzet: String(lineOmzet),
          lineProfit: String(lineProfit),
          isBonusItem,
        }).returning();

        if (!isBonusItem && discountPercents.length > 0) {
          await tx.insert(transactionItemDiscountSnapshots).values(
            discountPercents.map((pct, idx) => ({
              transactionItemId: newItem.id,
              sequenceNo: idx + 1,
              discountPercent: String(pct),
            }))
          );
        }
      }

      // 6. Update Header
      const totalAmount = totalSubtotalOmzet + shippingCost;
      await tx.update(transactions).set({
        bonNumber,
        customerId,
        transactionDate: transactionDate.toISOString().split("T")[0],
        shippingCost: String(shippingCost),
        isBonusTransaction,
        description,
        subtotalOmzet: String(totalSubtotalOmzet),
        totalAmount: String(totalAmount),
        totalProfit: String(totalProfit),
        updatedBy: userId,
        updatedAt: new Date(),
      }).where(eq(transactions.id, id));

      // 7. Add new omzet if LUNAS
      if (oldTx.status === "LUNAS" && !isBonusTransaction) {
        await tx.execute(
          sql`UPDATE ${customers} SET accumulated_bonus_omzet = accumulated_bonus_omzet + ${totalSubtotalOmzet} WHERE id = ${customerId}`
        );
      }
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: error.message || "Failed to update transaction" };
  }
}

export async function getEditTransactionFormData(id: string) {
  try {
    const txRes = await getTransactionById(id);
    if (!txRes.success || !txRes.data) throw new Error("Transaction not found");
    const txData = txRes.data;

    const customerList = await db.select().from(customers).where(eq(customers.isDeleted, false));
    if (!customerList.some((c) => c.id === txData.customerId)) {
      const [missingCustomer] = await db.select().from(customers).where(eq(customers.id, txData.customerId));
      if (missingCustomer) customerList.push(missingCustomer);
    }
    
    const groups = await db.select().from(customerDiscountGroups);
    const details = await db.select().from(customerDiscountDetails);
    
    const customerDiscounts: Record<string, { LM: number[], BR: number[] }> = {};
    for (const c of customerList) {
      customerDiscounts[c.id] = { LM: [], BR: [] };
    }

    for (const group of groups) {
      if (!customerDiscounts[group.customerId]) continue;
      const type = group.productType as "LM" | "BR";
      const groupDetails = details
        .filter((d) => d.discountGroupId === group.id)
        .sort((a, b) => a.sequenceNo - b.sequenceNo)
        .map((d) => Number(d.discountPercent));
      
      customerDiscounts[group.customerId][type] = groupDetails;
    }

    const productList = await db.select().from(products).where(eq(products.isDeleted, false));
    const missingProductIds = txData.items
      .map((i: any) => i.productId)
      .filter((pid: string) => !productList.some((p) => p.id === pid));
    
    for (const pid of missingProductIds) {
      const [missingProduct] = await db.select().from(products).where(eq(products.id, pid));
      if (missingProduct) productList.push(missingProduct);
    }

    const initialData = {
      transactionDate: txData.transactionDate, // string format, will parse on client
      bonNumber: txData.bonNumber,
      customerId: txData.customerId,
      description: txData.description || "",
      shippingCost: Number(txData.shippingCost) || 0,
      isBonusTransaction: txData.isBonusTransaction || false,
      items: txData.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    return { success: true, data: { customerList, customerDiscounts, productList, initialData } };
  } catch (error: any) {
    console.error("Failed to fetch edit form data:", error);
    return { success: false, error: error.message || "Failed to fetch edit form data" };
  }
}

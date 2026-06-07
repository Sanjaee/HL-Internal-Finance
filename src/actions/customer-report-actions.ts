"use server";

import { db } from "@/db";
import { transactions, customers, transactionItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCustomerMonthlyReport(customerId: string, month: number, year: number) {
  try {
    // month is 1-indexed (1=Jan, 12=Dec)
    const paddedMonth = month.toString().padStart(2, '0');
    
    // We want to fetch all transactions for this customer in this month/year
    const txList = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.customerId, customerId),
          sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${year}`
        )
      )
      .orderBy(transactions.transactionDate);

    let totalPiutang = 0;
    let totalDibayar = 0;
    let totalOmzet = 0;
    let totalOmzetLM = 0;
    let totalOmzetBR = 0;
    let totalLaba = 0;

    const txIds = txList.map(t => t.id);
    let itemsMap: Record<string, any[]> = {};
    if (txIds.length > 0) {
      const items = await db.select().from(transactionItems).where(sql`${transactionItems.transactionId} IN ${txIds}`);
      for (const item of items) {
        if (!itemsMap[item.transactionId]) itemsMap[item.transactionId] = [];
        itemsMap[item.transactionId].push(item);
      }
    }

    for (const tx of txList) {
      if (tx.status === "PIUTANG") {
        totalPiutang += Number(tx.totalAmount);
      } else if (tx.status === "LUNAS") {
        totalDibayar += Number(tx.totalAmount);
        totalOmzet += Number(tx.subtotalOmzet);
        totalLaba += Number(tx.totalProfit);

        const items = itemsMap[tx.id] || [];
        for (const item of items) {
          if (item.productType === "LM") {
            totalOmzetLM += Number(item.lineOmzet);
          } else if (item.productType === "BR") {
            totalOmzetBR += Number(item.lineOmzet);
          }
        }
      }
    }

    return {
      success: true,
      data: {
        transactions: txList,
        summary: {
          totalPiutang,
          totalDibayar,
          totalOmzet,
          totalOmzetLM,
          totalOmzetBR,
          totalLaba,
        }
      }
    };

  } catch (error: any) {
    console.error("Failed to fetch customer report:", error);
    return { success: false, error: error.message };
  }
}

export async function bulkSettleMonth(customerId: string, month: number, year: number, paymentDate: Date) {
  try {
    await db.transaction(async (tx) => {
      // Find all PIUTANG transactions for this month/year
      const unpaidTx = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.customerId, customerId),
            eq(transactions.status, "PIUTANG"),
            sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${month}`,
            sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${year}`
          )
        );

      if (unpaidTx.length === 0) return; // Nothing to settle

      let totalAddedOmzet = 0;

      for (const t of unpaidTx) {
        // Mark as LUNAS
        await tx.update(transactions).set({
          status: "LUNAS",
          paymentDate: paymentDate.toISOString().split("T")[0],
          updatedAt: new Date(),
        }).where(eq(transactions.id, t.id));

        // Accumulate bonus omzet if not bonus transaction
        if (!t.isBonusTransaction) {
          totalAddedOmzet += Number(t.subtotalOmzet);
        }
      }

      // Update customer bonus omzet in one go
      if (totalAddedOmzet > 0) {
        await tx.execute(
          sql`UPDATE ${customers} SET accumulated_bonus_omzet = accumulated_bonus_omzet + ${totalAddedOmzet} WHERE id = ${customerId}`
        );
      }
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/customers/${customerId}`);
    revalidatePath("/dashboard/transactions");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to bulk settle:", error);
    return { success: false, error: error.message };
  }
}

"use server";

import { db } from "@/db";
import { transactions, transactionItems, customers } from "@/db/schema";
import { eq, sum, and, desc, sql } from "drizzle-orm";

export async function getDashboardMetrics() {
  try {
    // 1. Total Piutang (Amount owed on PIUTANG status)
    const piutangResult = await db
      .select({ total: sum(transactions.totalAmount) })
      .from(transactions)
      .where(eq(transactions.status, "PIUTANG"));
    
    // 2. Total Dibayar (Amount paid on LUNAS status)
    const dibayarResult = await db
      .select({ total: sum(transactions.totalAmount) })
      .from(transactions)
      .where(eq(transactions.status, "LUNAS"));

    // 3. Total Omzet (Omzet on LUNAS status, excl shipping)
    const omzetResult = await db
      .select({ total: sum(transactions.subtotalOmzet) })
      .from(transactions)
      .where(eq(transactions.status, "LUNAS"));

    // 4. Total Laba HL (Profit on LUNAS status)
    const labaResult = await db
      .select({ total: sum(transactions.totalProfit) })
      .from(transactions)
      .where(eq(transactions.status, "LUNAS"));

    // 5. Chart Data: Interactive Area Chart (Daily LM vs BR Omzet last 90 days)
    const interactiveDataResult = await db.execute(sql`
      SELECT 
        TO_CHAR(t.transaction_date, 'YYYY-MM-DD') as date,
        ti.product_type,
        SUM(ti.line_omzet) as omzet
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      WHERE t.status = 'LUNAS' 
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY t.transaction_date, ti.product_type
      ORDER BY t.transaction_date ASC
    `);

    const dailyMap = new Map<string, { date: string, LM: number, BR: number, total: number }>();
    for (const row of interactiveDataResult.rows as any[]) {
      const date = row.date;
      const type = row.product_type;
      const omzet = Number(row.omzet);
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, LM: 0, BR: 0, total: 0 });
      }
      dailyMap.get(date)![type as "LM" | "BR"] += omzet;
      dailyMap.get(date)!.total += omzet;
    }
    const chartInteractive = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 6. Recent Piutang (Latest unpaid transactions)
    const recentPiutang = await db
      .select({
        id: transactions.id,
        bonNumber: transactions.bonNumber,
        transactionDate: transactions.transactionDate,
        customerName: customers.name,
        totalAmount: transactions.totalAmount,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .where(eq(transactions.status, "PIUTANG"))
      .orderBy(desc(transactions.transactionDate))
      .limit(5);

    return {
      success: true,
      data: {
        totalPiutang: Number(piutangResult[0]?.total || 0),
        totalDibayar: Number(dibayarResult[0]?.total || 0),
        totalOmzet: Number(omzetResult[0]?.total || 0),
        totalLaba: Number(labaResult[0]?.total || 0),
        chartInteractive,
        recentPiutang,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch dashboard metrics:", error);
    return { success: false, error: error.message || "Failed to fetch metrics" };
  }
}

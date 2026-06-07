"use server";

import { db } from "@/db";
import { transactions, customers } from "@/db/schema";
import { eq, desc, and, sql, isNotNull } from "drizzle-orm";

export async function getPelunasanData(filters: {
  customerId?: string;
  month?: string; // 1-12
  year?: string;
}) {
  try {
    const conditions = [];
    
    if (filters.customerId && filters.customerId !== "ALL") {
      conditions.push(eq(transactions.customerId, filters.customerId));
    }
    if (filters.month && filters.month !== "ALL") {
      conditions.push(sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${filters.month}`);
    }
    if (filters.year && filters.year !== "ALL") {
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${filters.year}`);
    }

    // Piutang Aktif
    const piutangList = await db
      .select({
        id: transactions.id,
        bonNumber: transactions.bonNumber,
        transactionDate: transactions.transactionDate,
        customerId: transactions.customerId,
        customerName: customers.name,
        subtotalOmzet: transactions.subtotalOmzet,
        shippingCost: transactions.shippingCost,
        totalAmount: transactions.totalAmount,
        status: transactions.status,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .where(and(eq(transactions.status, "PIUTANG"), ...conditions))
      .orderBy(desc(transactions.transactionDate));

    // Riwayat Pelunasan (LUNAS)
    const riwayatList = await db
      .select({
        id: transactions.id,
        bonNumber: transactions.bonNumber,
        transactionDate: transactions.transactionDate,
        paymentDate: transactions.paymentDate,
        customerName: customers.name,
        totalAmount: transactions.totalAmount,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .where(and(eq(transactions.status, "LUNAS"), isNotNull(transactions.paymentDate), ...conditions))
      .orderBy(desc(transactions.paymentDate));

    // Calculate Summary for Piutang Tab
    let totalPiutang = 0;
    const uniqueCustomers = new Set<string>();
    
    for (const p of piutangList) {
      totalPiutang += Number(p.totalAmount);
      if (p.customerId) uniqueCustomers.add(p.customerId);
    }

    // Calculate "Nilai Pelunasan Bulan Ini" (Current Month Settlements)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const pelunasanBulanIniResult = await db.execute(sql`
      SELECT SUM(total_amount) as total
      FROM transactions
      WHERE status = 'LUNAS' 
        AND EXTRACT(MONTH FROM payment_date) = ${currentMonth}
        AND EXTRACT(YEAR FROM payment_date) = ${currentYear}
    `);
    const nilaiPelunasanBulanIni = Number(pelunasanBulanIniResult.rows[0]?.total || 0);

    return {
      success: true,
      data: {
        piutang: piutangList,
        riwayat: riwayatList,
        summary: {
          totalPiutang,
          jumlahBonBelumLunas: piutangList.length,
          totalCustomerMenunggak: uniqueCustomers.size,
          nilaiPelunasanBulanIni,
        }
      }
    };
  } catch (error: any) {
    console.error("Failed to fetch pelunasan data:", error);
    return { success: false, error: error.message };
  }
}

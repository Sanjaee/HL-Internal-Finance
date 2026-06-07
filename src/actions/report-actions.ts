"use server";

import { db } from "@/db";
import { transactions, transactionItems, customers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getOverallRecap(month: number, year: number) {
  try {
    const txList = await db
      .select({
        id: transactions.id,
        status: transactions.status,
        totalAmount: transactions.totalAmount,
        subtotalOmzet: transactions.subtotalOmzet,
        totalProfit: transactions.totalProfit,
      })
      .from(transactions)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${year}`
        )
      );

    const txIds = txList.map(t => t.id);
    let itemsMap: Record<string, any[]> = {};
    if (txIds.length > 0) {
      const items = await db.select({
        transactionId: transactionItems.transactionId,
        productType: transactionItems.productType,
        lineOmzet: transactionItems.lineOmzet,
        lineProfit: transactionItems.lineProfit,
      }).from(transactionItems).where(sql`${transactionItems.transactionId} IN ${txIds}`);
      
      for (const item of items) {
        if (!itemsMap[item.transactionId]) itemsMap[item.transactionId] = [];
        itemsMap[item.transactionId].push(item);
      }
    }

    let totalPiutang = 0;
    let totalDibayar = 0;
    let totalOmzet = 0;
    let totalOmzetLM = 0;
    let totalOmzetBR = 0;
    let totalLaba = 0;

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
        totalPiutang,
        totalDibayar,
        totalOmzet,
        totalOmzetLM,
        totalOmzetBR,
        totalLaba,
      }
    };
  } catch (error: any) {
    console.error("Failed to fetch overall recap:", error);
    return { success: false, error: error.message };
  }
}

export async function getCustomerRecap(month: number, year: number) {
  try {
    const txList = await db
      .select({
        id: transactions.id,
        customerId: transactions.customerId,
        customerName: customers.name,
        status: transactions.status,
        totalAmount: transactions.totalAmount,
        subtotalOmzet: transactions.subtotalOmzet,
        totalProfit: transactions.totalProfit,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${year}`
        )
      );

    const txIds = txList.map(t => t.id);
    let itemsMap: Record<string, any[]> = {};
    if (txIds.length > 0) {
      const items = await db.select({
        transactionId: transactionItems.transactionId,
        productType: transactionItems.productType,
        lineOmzet: transactionItems.lineOmzet,
      }).from(transactionItems).where(sql`${transactionItems.transactionId} IN ${txIds}`);
      
      for (const item of items) {
        if (!itemsMap[item.transactionId]) itemsMap[item.transactionId] = [];
        itemsMap[item.transactionId].push(item);
      }
    }

    const customerStats: Record<string, any> = {};

    for (const tx of txList) {
      if (!customerStats[tx.customerId]) {
        customerStats[tx.customerId] = {
          customerId: tx.customerId,
          customerName: tx.customerName,
          totalPiutang: 0,
          totalDibayar: 0,
          totalOmzet: 0,
          totalOmzetLM: 0,
          totalOmzetBR: 0,
          totalLaba: 0,
        };
      }

      const stats = customerStats[tx.customerId];

      if (tx.status === "PIUTANG") {
        stats.totalPiutang += Number(tx.totalAmount);
      } else if (tx.status === "LUNAS") {
        stats.totalDibayar += Number(tx.totalAmount);
        stats.totalOmzet += Number(tx.subtotalOmzet);
        stats.totalLaba += Number(tx.totalProfit);

        const items = itemsMap[tx.id] || [];
        for (const item of items) {
          if (item.productType === "LM") {
            stats.totalOmzetLM += Number(item.lineOmzet);
          } else if (item.productType === "BR") {
            stats.totalOmzetBR += Number(item.lineOmzet);
          }
        }
      }
    }

    return {
      success: true,
      data: Object.values(customerStats).sort((a: any, b: any) => b.totalOmzet - a.totalOmzet)
    };
  } catch (error: any) {
    console.error("Failed to fetch customer recap:", error);
    return { success: false, error: error.message };
  }
}

export async function getProductTypeRecap(month: number, year: number) {
  try {
    const txList = await db
      .select({
        id: transactions.id,
        status: transactions.status,
      })
      .from(transactions)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${year}`
        )
      );

    const txIds = txList.map(t => t.id);
    let itemsMap: Record<string, any[]> = {};
    if (txIds.length > 0) {
      const items = await db.select({
        transactionId: transactionItems.transactionId,
        productType: transactionItems.productType,
        quantity: transactionItems.quantity,
        lineOmzet: transactionItems.lineOmzet,
        lineProfit: transactionItems.lineProfit,
      }).from(transactionItems).where(sql`${transactionItems.transactionId} IN ${txIds}`);
      
      for (const item of items) {
        if (!itemsMap[item.transactionId]) itemsMap[item.transactionId] = [];
        itemsMap[item.transactionId].push(item);
      }
    }

    const typeStats = {
      LM: { totalOmzet: 0, totalLaba: 0, itemsSold: 0 },
      BR: { totalOmzet: 0, totalLaba: 0, itemsSold: 0 },
    };

    for (const tx of txList) {
      if (tx.status === "LUNAS") {
        const items = itemsMap[tx.id] || [];
        for (const item of items) {
          if (item.productType === "LM" || item.productType === "BR") {
            typeStats[item.productType].totalOmzet += Number(item.lineOmzet);
            typeStats[item.productType].totalLaba += Number(item.lineProfit);
            typeStats[item.productType].itemsSold += Number(item.quantity);
          }
        }
      }
    }

    return {
      success: true,
      data: typeStats
    };
  } catch (error: any) {
    console.error("Failed to fetch product type recap:", error);
    return { success: false, error: error.message };
  }
}

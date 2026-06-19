import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";
import "dotenv/config";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Wiping all data...");
  try {
    await db.delete(schema.bonusRedemptions);
    await db.delete(schema.customerBonusLedgers);
    await db.delete(schema.transactionItemDiscountSnapshots);
    await db.delete(schema.transactionItems);
    await db.delete(schema.transactions);
    await db.delete(schema.customerDiscountDetails);
    await db.delete(schema.customerDiscountGroups);
    await db.delete(schema.products);
    await db.delete(schema.customers);
    await db.delete(schema.users);
    console.log("Database wiped successfully.");
  } catch (e) {
    console.error("Wipe failed:", e);
  } finally {
    await pool.end();
  }
}

main();

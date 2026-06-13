import "dotenv/config";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../db/schema";
import { addDays, subDays } from "date-fns";
import { faker } from "@faker-js/faker";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Seeding dummy data...");

  try {
    // Check if an admin user exists, if not, wait for seed-admin or pick any user
    const existingUsers = await db.select().from(schema.users).limit(1);
    let userId = existingUsers[0]?.id;

    if (!userId) {
        console.log("No user found, you should run seed-admin.ts first, but I will try to proceed without createdBy if possible or create a dummy user.");
    }

    console.log("Cleaning up old data...");
    await db.delete(schema.bonusRedemptions);
    await db.delete(schema.customerBonusLedgers);
    await db.delete(schema.transactionItemDiscountSnapshots);
    await db.delete(schema.transactionItems);
    await db.delete(schema.transactions);
    await db.delete(schema.customerDiscountDetails);
    await db.delete(schema.customerDiscountGroups);
    await db.delete(schema.products);
    await db.delete(schema.customers);



    // 1. Seed 5,000 Customers
    console.log("Seeding 5,000 customers...");
    const insertedCustomers = [];
    for (let chunk = 0; chunk < 5; chunk++) {
      console.log(`Processing customers chunk ${chunk + 1} of 5...`);
      const newCustomers = [];
      for (let i = 0; i < 1000; i++) {
        newCustomers.push({
          customerCode: `CUST-${faker.string.alphanumeric(4).toUpperCase()}-${chunk}${i}`,
          name: faker.person.fullName(),
          bonusThreshold: faker.number.float({ min: 1000000, max: 10000000, fractionDigits: 2 }).toString(),
          accumulatedBonusOmzet: "0",
          grantedBonusCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      const insertedChunk = await db.insert(schema.customers).values(newCustomers).returning();
      insertedCustomers.push(...insertedChunk);
    }

    // 2. Seed 5,000 Products
    console.log("Seeding 5,000 products...");
    const insertedProducts = [];
    for (let chunk = 0; chunk < 5; chunk++) {
      console.log(`Processing products chunk ${chunk + 1} of 5...`);
      const newProducts = [];
      for (let i = 0; i < 1000; i++) {
        const isLM = faker.datatype.boolean();
        const productType = (isLM ? "LM" : "BR") as "LM" | "BR";
        const costPrice = faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 });
        const basePrice = costPrice * faker.number.float({ min: 1.1, max: 1.5 });

        newProducts.push({
          productCode: `PROD-${faker.string.alphanumeric(4).toUpperCase()}-${chunk}${i}`,
          name: faker.commerce.productName(),
          productType,
          costPrice: costPrice.toString(),
          basePrice: basePrice.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      const insertedChunk = await db.insert(schema.products).values(newProducts).returning();
      insertedProducts.push(...insertedChunk);
    }

    // 3. Seed 5,000 Transactions (Over the last 365 days)
    console.log("Seeding 5,000 transactions...");
    const TOTAL_TX = 5000;
    const CHUNK_SIZE = 1000;
    const startDate = subDays(new Date(), 365);

    for (let chunk = 0; chunk < TOTAL_TX / CHUNK_SIZE; chunk++) {
      console.log(`Processing chunk ${chunk + 1} of ${TOTAL_TX / CHUNK_SIZE}...`);
      
      const txBatch = [];
      const txItemBatches = [];

      for (let i = 0; i < CHUNK_SIZE; i++) {
        const transactionDate = addDays(startDate, faker.number.int({ min: 0, max: 365 }));
        const customer = faker.helpers.arrayElement(insertedCustomers);

        // Pre-generate UUID to link items directly
        const txId = crypto.randomUUID();

        // Create 1-5 transaction items
        const numItems = faker.number.int({ min: 1, max: 5 });
        let subtotalOmzet = 0;
        let totalProfit = 0;
        
        for (let j = 0; j < numItems; j++) {
          const product = faker.helpers.arrayElement(insertedProducts);
          const quantity = faker.number.int({ min: 1, max: 10 });
          const discountPercentage = faker.number.float({ min: 0, max: 10, fractionDigits: 2 });
          
          const basePrice = parseFloat(product.basePrice as string);
          const costPrice = parseFloat(product.costPrice as string);
          const discountedUnitPrice = basePrice * (1 - discountPercentage / 100);
          const lineOmzet = discountedUnitPrice * quantity;
          const lineProfit = (discountedUnitPrice - costPrice) * quantity;

          subtotalOmzet += lineOmzet;
          totalProfit += lineProfit;

          txItemBatches.push({
            transactionId: txId,
            productId: product.id,
            productNameSnapshot: product.name,
            productType: product.productType,
            quantity,
            basePrice: basePrice.toString(),
            costPrice: costPrice.toString(),
            discountPercentageEffective: discountPercentage.toString(),
            discountedUnitPrice: discountedUnitPrice.toString(),
            lineOmzet: lineOmzet.toString(),
            lineProfit: lineProfit.toString(),
            createdAt: transactionDate,
          });
        }

        const shippingCost = faker.number.float({ min: 0, max: 50000, fractionDigits: 2 });
        const totalAmount = subtotalOmzet + shippingCost;

        txBatch.push({
          id: txId,
          bonNumber: `BON-${faker.string.alphanumeric(4).toUpperCase()}-${chunk}${i}`,
          customerId: customer.id,
          transactionDate: transactionDate.toISOString().split("T")[0],
          paymentDate: faker.datatype.boolean() ? addDays(transactionDate, faker.number.int({ min: 1, max: 5 })).toISOString().split("T")[0] : null,
          description: faker.lorem.sentence(),
          shippingCost: shippingCost.toString(),
          status: faker.helpers.arrayElement(["PIUTANG", "LUNAS"]),
          subtotalOmzet: subtotalOmzet.toString(),
          totalAmount: totalAmount.toString(),
          totalProfit: totalProfit.toString(),
          createdBy: userId,
          updatedBy: userId,
          createdAt: transactionDate,
          updatedAt: transactionDate,
        });
      }

      // Insert transactions
      await db.insert(schema.transactions).values(txBatch);
      
      // Insert items in smaller chunks to avoid Postgres parameter limits (65535 params)
      const ITEM_CHUNK = 2000;
      for (let j = 0; j < txItemBatches.length; j += ITEM_CHUNK) {
        const batch = txItemBatches.slice(j, j + ITEM_CHUNK);
        await db.insert(schema.transactionItems).values(batch);
      }
    }

    console.log("Seed dummy data completed successfully!");
  } catch (error) {
    console.error("Error seeding dummy data:", error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);

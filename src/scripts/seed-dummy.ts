import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import {
  customers,
  products,
  transactions,
  transactionItems,
  customerDiscountGroups,
  customerDiscountDetails,
  users,
} from "../db/schema";
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
    const existingUsers = await db.select().from(users).limit(1);
    let userId = existingUsers[0]?.id;

    if (!userId) {
        console.log("No user found, you should run seed-admin.ts first, but I will try to proceed without createdBy if possible or create a dummy user.");
    }

    // 1. Seed 100 Customers
    console.log("Seeding customers...");
    const newCustomers = [];
    for (let i = 0; i < 100; i++) {
      newCustomers.push({
        customerCode: `CUST-${faker.string.alphanumeric(6).toUpperCase()}`,
        name: faker.person.fullName(),
        bonusThreshold: faker.number.float({ min: 1000000, max: 10000000, fractionDigits: 2 }).toString(),
        accumulatedBonusOmzet: "0",
        grantedBonusCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const insertedCustomers = await db.insert(customers).values(newCustomers).returning();

    // 2. Seed 100 Products
    console.log("Seeding products...");
    const newProducts = [];
    for (let i = 0; i < 100; i++) {
      const isLM = faker.datatype.boolean();
      const productType = (isLM ? "LM" : "BR") as "LM" | "BR";
      const costPrice = faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 });
      const basePrice = costPrice * faker.number.float({ min: 1.1, max: 1.5 });

      newProducts.push({
        productCode: `PROD-${faker.string.alphanumeric(6).toUpperCase()}`,
        name: faker.commerce.productName(),
        productType,
        costPrice: costPrice.toString(),
        basePrice: basePrice.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const insertedProducts = await db.insert(products).values(newProducts).returning();

    // 3. Seed 100 Transactions (1 per day for the last 100 days)
    console.log("Seeding transactions...");
    const startDate = subDays(new Date(), 100);

    for (let i = 0; i < 100; i++) {
      const transactionDate = addDays(startDate, i);
      const customer = faker.helpers.arrayElement(insertedCustomers);

      // Create transaction
      const [insertedTx] = await db.insert(transactions).values({
        bonNumber: `BON-${faker.string.numeric(8)}`,
        customerId: customer.id,
        transactionDate: transactionDate.toISOString().split("T")[0],
        paymentDate: faker.datatype.boolean() ? addDays(transactionDate, faker.number.int({ min: 1, max: 5 })).toISOString().split("T")[0] : null,
        description: faker.lorem.sentence(),
        shippingCost: faker.number.float({ min: 0, max: 50000, fractionDigits: 2 }).toString(),
        status: faker.helpers.arrayElement(["PIUTANG", "LUNAS"]),
        subtotalOmzet: "0",
        totalAmount: "0",
        totalProfit: "0",
        createdBy: userId,
        updatedBy: userId,
        createdAt: transactionDate,
        updatedAt: transactionDate,
      }).returning();

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

        await db.insert(transactionItems).values({
          transactionId: insertedTx.id,
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

      // Update transaction totals
      const shippingCost = parseFloat(insertedTx.shippingCost as string);
      const totalAmount = subtotalOmzet + shippingCost;

      await db.update(transactions)
        .set({
          subtotalOmzet: subtotalOmzet.toString(),
          totalAmount: totalAmount.toString(),
          totalProfit: totalProfit.toString(),
        })
        .where(eq(transactions.id, insertedTx.id))
        .execute();
    }

    console.log("Seed dummy data completed successfully!");
  } catch (error) {
    console.error("Error seeding dummy data:", error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);

import { db } from "@/db";
import { customers, products, customerDiscountGroups, customerDiscountDetails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TransactionForm } from "@/components/transaction-form";

export default async function CreateTransactionPage() {
  // Fetch active customers
  const customerList = await db.select().from(customers).where(eq(customers.isDeleted, false));
  
  // Fetch their discounts
  const groups = await db.select().from(customerDiscountGroups);
  const details = await db.select().from(customerDiscountDetails);
  
  // Build a map of discounts: { customerId: { LM: [20,10], BR: [5] } }
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

  // Fetch active products
  const productList = await db.select().from(products).where(eq(products.isDeleted, false));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create New Bon</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the transaction details below. Discounts are calculated automatically.
        </p>
      </div>

      <div className="mt-4">
        <TransactionForm
          customers={customerList}
          customerDiscounts={customerDiscounts}
          products={productList}
        />
      </div>
    </div>
  );
}

import { db } from "@/db";
import { customers, products, customerDiscountGroups, customerDiscountDetails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TransactionForm } from "@/components/transaction-form";
import { getTransactionById } from "@/actions/transaction-actions";
import { notFound } from "next/navigation";

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Fetch the existing transaction
  const txRes = await getTransactionById(id);
  if (!txRes.success || !txRes.data) {
    notFound();
  }

  const txData = txRes.data;

  // Construct initial data for the form
  const initialData = {
    transactionDate: new Date(txData.transactionDate),
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

  // Fetch active customers
  const customerList = await db.select().from(customers).where(eq(customers.isDeleted, false));
  
  // Ensure the current customer is in the list even if deleted
  if (!customerList.some((c) => c.id === txData.customerId)) {
    const [missingCustomer] = await db.select().from(customers).where(eq(customers.id, txData.customerId));
    if (missingCustomer) customerList.push(missingCustomer);
  }
  
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
  
  // Add products that might be soft-deleted but are in this transaction
  const missingProductIds = txData.items
    .map((i: any) => i.productId)
    .filter((pid: string) => !productList.some((p) => p.id === pid));
  
  for (const pid of missingProductIds) {
    const [missingProduct] = await db.select().from(products).where(eq(products.id, pid));
    if (missingProduct) productList.push(missingProduct);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Bon: {txData.bonNumber}</h1>
        <p className="text-sm text-muted-foreground">
          Modify the transaction details below.
        </p>
      </div>

      <div className="mt-4">
        <TransactionForm
          customers={customerList}
          customerDiscounts={customerDiscounts}
          products={productList}
          initialData={initialData as any}
          transactionId={id}
        />
      </div>
    </div>
  );
}

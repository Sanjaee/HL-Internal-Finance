import { getBonusStatus } from "@/actions/bonus-actions";
import { BonusClient } from "./bonus-client";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function BonusPage() {
  const res = await getBonusStatus();
  const bonusStatus = res.success && res.data ? res.data : [];
  
  const productList = await db.select().from(products).where(eq(products.isDeleted, false));

  return <BonusClient bonusStatus={bonusStatus} products={productList} />;
}

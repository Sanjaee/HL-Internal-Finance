import { db } from "@/db";
import { customers } from "@/db/schema";
import { PelunasanClient } from "./pelunasan-client";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PelunasanPage() {
  const customerList = await db
    .select({
      id: customers.id,
      name: customers.name,
    })
    .from(customers)
    .orderBy(asc(customers.name));

  return <PelunasanClient customers={customerList} />;
}

import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CustomerDetailClient } from "./customer-detail-client";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));

  if (!customer) {
    return notFound();
  }

  return <CustomerDetailClient customer={customer} />;
}

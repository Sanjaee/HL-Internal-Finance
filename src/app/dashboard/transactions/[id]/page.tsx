import { getTransactionById } from "@/actions/transaction-actions";
import { TransactionDetailClient } from "./transaction-detail-client";
import { notFound } from "next/navigation";

export default async function TransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params; // Next 15 awaits params
  const res = await getTransactionById(id);
  
  if (!res.success || !res.data) {
    return notFound();
  }

  return <TransactionDetailClient tx={res.data} />;
}

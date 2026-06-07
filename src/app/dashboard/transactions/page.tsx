import { getTransactions } from "@/actions/transaction-actions";
import { TransactionTable } from "@/components/transaction-table";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

export default async function TransactionsPage() {
  const res = await getTransactions();
  const transactions = res.success && res.data ? res.data : [];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions (Bon)</h1>
          <p className="text-sm text-muted-foreground">
            Manage your sales invoices, shipping costs, and outstanding payments.
          </p>
        </div>
        <Link href="/dashboard/transactions/create">
          <Button>
            <IconPlus className="mr-2 h-4 w-4" /> Create Bon
          </Button>
        </Link>
      </div>

      <TransactionTable transactions={transactions} />
    </div>
  );
}

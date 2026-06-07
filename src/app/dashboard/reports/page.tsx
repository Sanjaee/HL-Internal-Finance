import { ReportsClient } from "./reports-client";

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recap & Reporting</h1>
        <p className="text-sm text-muted-foreground">
          View financial recaps overall, per customer, and per product type.
        </p>
      </div>
      
      <ReportsClient />
    </div>
  );
}

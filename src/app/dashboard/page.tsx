import { getDashboardMetrics } from "@/actions/dashboard-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCash, IconCoin, IconChartLine, IconFileInvoice } from "@tabler/icons-react";
import { DashboardCharts } from "./dashboard-charts";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  const res = await getDashboardMetrics();
  const metrics = res.success && res.data ? res.data : null;

  if (!metrics) {
    return <div>Failed to load dashboard data.</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to HL Sales & Receivables. Here is the summary of your business performance.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
            <IconFileInvoice className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              Rp {metrics.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding unpaid amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dibayar</CardTitle>
            <IconCash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {metrics.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Collected cash (Omzet + Ongkir)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
            <IconChartLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {metrics.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Recognized revenue from Lunas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laba HL</CardTitle>
            <IconCoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              Rp {metrics.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Recognized net profit</p>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts chartInteractive={metrics.chartInteractive} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Piutang Terbaru</CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest transactions that have not been paid.
            </p>
          </div>
          <Link href="/dashboard/transactions">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Bon Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount Owed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.recentPiutang.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    All clear! No outstanding piutang.
                  </TableCell>
                </TableRow>
              ) : (
                metrics.recentPiutang.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.transactionDate), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/transactions/${t.id}`} className="hover:underline text-primary">
                        {t.bonNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{t.customerName}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">PIUTANG</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      Rp {Number(t.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

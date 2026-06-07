"use client";

import { useState, useEffect } from "react";
import { getCustomerMonthlyReport, bulkSettleMonth } from "@/actions/customer-report-actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IconArrowLeft, IconChecklist } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CustomerDetailClient({ customer }: { customer: any }) {
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSettling, setIsSettling] = useState(false);
  const router = useRouter();

  const fetchReport = async () => {
    setIsLoading(true);
    const res = await getCustomerMonthlyReport(customer.id, Number(month), Number(year));
    if (res.success) {
      setReport(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [month, year, customer.id]);

  const handleBulkSettle = async () => {
    setIsSettling(true);
    const res = await bulkSettleMonth(customer.id, Number(month), Number(year), new Date(paymentDate));
    setIsSettling(false);

    if (res?.success) {
      toast.success("Month settled successfully!");
      setIsSettleModalOpen(false);
      fetchReport();
      router.refresh(); // Refresh overall data
    } else {
      toast.error(res?.error || "Failed to settle month");
    }
  };

  const hasUnpaid = report?.transactions.some((t: any) => t.status === "PIUTANG");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="icon">
              <IconArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">Monthly Activity Report</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 12}).map((_, i) => (
                <SelectItem key={i+1} value={(i+1).toString()}>
                  {format(new Date(2000, i, 1), "MMMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!report || isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading report...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  Rp {report.summary.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sudah Dibayar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  Rp {report.summary.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Omzet Diakui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rp {report.summary.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Laba HL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  Rp {report.summary.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transactions in {format(new Date(Number(year), Number(month) - 1), "MMMM yyyy")}</CardTitle>
              {hasUnpaid && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsSettleModalOpen(true)}>
                  <IconChecklist className="mr-2 h-4 w-4" /> Sudah Lunas (1 Bulan)
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bon Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead className="text-right">Total Tagihan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No transactions found for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.transactions.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell>{format(new Date(t.transactionDate), "dd MMM yyyy")}</TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/transactions/${t.id}`} className="hover:underline text-primary">
                            {t.bonNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.status === "LUNAS" ? "default" : "destructive"} className={t.status === "LUNAS" ? "bg-green-600 hover:bg-green-700" : ""}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">Rp {Number(t.subtotalOmzet).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right font-bold">Rp {Number(t.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isSettleModalOpen} onOpenChange={setIsSettleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle Entire Month</DialogTitle>
            <DialogDescription>
              This will mark all PIUTANG transactions in this month as LUNAS. Omzet and profit will be recognized.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Payment Date</label>
            <Input 
              type="date" 
              value={paymentDate} 
              onChange={(e) => setPaymentDate(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettleModalOpen(false)} disabled={isSettling}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleBulkSettle} disabled={isSettling}>
              {isSettling ? "Processing..." : "Confirm Bulk Lunas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

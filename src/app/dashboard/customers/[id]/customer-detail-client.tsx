"use client";

import { useState, useEffect } from "react";
import { getCustomerMonthlyReport, bulkSettleMonth, getCustomerOutstandingPiutang, bulkSettleAllPiutang } from "@/actions/customer-report-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IconArrowLeft, IconChecklist, IconDownload, IconCalendar, IconLoader2 } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function CustomerDetailClient({ customer }: { customer: any }) {
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(currentYear.toString());

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  const [activeTab, setActiveTab] = useState("outstanding");
  const [report, setReport] = useState<any>(null);
  const [outstandingReport, setOutstandingReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isSettleAllModalOpen, setIsSettleAllModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isSettling, setIsSettling] = useState(false);
  const router = useRouter();

  const fetchReport = async () => {
    setIsLoading(true);
    const [res, outRes] = await Promise.all([
      getCustomerMonthlyReport(customer.id, Number(month), Number(year)),
      getCustomerOutstandingPiutang(customer.id)
    ]);
    if (res.success) setReport(res.data);
    if (outRes.success) setOutstandingReport(outRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [month, year, customer.id]);

  const handleBulkSettle = async () => {
    setIsSettling(true);
    const res = await bulkSettleMonth(customer.id, Number(month), Number(year), paymentDate || new Date());
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

  const handleBulkSettleAll = async () => {
    setIsSettling(true);
    const res = await bulkSettleAllPiutang(customer.id, paymentDate || new Date());
    setIsSettling(false);

    if (res?.success) {
      toast.success("All piutang settled successfully!");
      setIsSettleAllModalOpen(false);
      fetchReport();
      router.refresh();
    } else {
      toast.error(res?.error || "Failed to settle piutang");
    }
  };

  const hasUnpaid = report?.transactions.some((t: any) => t.status === "PIUTANG");

  const handleExportPDF = () => {
    if (!report || report.transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Transaction Report - ${customer.name}`, 14, 15);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Month: ${format(new Date(Number(year), Number(month) - 1), "MMMM yyyy")}`, 14, 22);
    doc.setTextColor(0);

    const tableData = report.transactions.map((t: any) => [
      format(new Date(t.transactionDate), "dd MMM yyyy"),
      t.bonNumber,
      t.status,
      `Rp ${Number(t.subtotalOmzet).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${Number(t.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Date", "Bon Number", "Status", "Omzet", "Total Tagihan"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index >= 3) {
          const text = data.cell.text[0] || "";
          const textLength = text.length;
          
          if (textLength >= 20) {
            data.cell.styles.fontSize = 7;
          } else if (textLength >= 16) {
            data.cell.styles.fontSize = 8;
          }
        }
      }
    });

    doc.save(`Transactions_${customer.name}_${month}_${year}.pdf`);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="icon" className="mt-1 md:mt-0">
              <IconArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight leading-tight">{customer.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Customer Details & Reporting</p>
          </div>
        </div>

      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="outstanding">Outstanding Piutang</TabsTrigger>
          <TabsTrigger value="history">Monthly History</TabsTrigger>
        </TabsList>

        {activeTab === "history" && (
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-full sm:w-[120px]">
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
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <TabsContent value="outstanding" className="space-y-6 mt-0">
          {!outstandingReport || isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Loading data...</span>
            </div>
          ) : (
            <>
              <Card className="border-destructive/50 bg-destructive/5 w-full md:max-w-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Outstanding Piutang (Semua Waktu)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">
                    Rp {outstandingReport.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="whitespace-normal leading-tight">All Unpaid Transactions</CardTitle>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {outstandingReport.transactions.length > 0 && (
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsSettleAllModalOpen(true)}>
                        <IconChecklist className="mr-2 h-4 w-4" /> Bulk Lunas (Semua)
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Bon Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Omzet</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingReport.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No outstanding piutang! All debts are paid.
                          </TableCell>
                        </TableRow>
                      ) : (
                        outstandingReport.transactions.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell>{format(new Date(t.transactionDate), "dd MMM yyyy")}</TableCell>
                            <TableCell className="font-medium">
                              <Link href={`/dashboard/transactions/${t.id}`} className="hover:underline text-primary">
                                {t.bonNumber}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">PIUTANG</Badge>
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
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {!report || isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Loading report...</span>
            </div>
          ) : (
            <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-destructive">
                  Rp {report.summary.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Already Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  Rp {report.summary.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">LM Omzet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-amber-600">
                  Rp {report.summary.totalOmzetLM?.toLocaleString("id-ID", { maximumFractionDigits: 0 }) || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">BR Omzet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">
                  Rp {report.summary.totalOmzetBR?.toLocaleString("id-ID", { maximumFractionDigits: 0 }) || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Omzet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  Rp {report.summary.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">HL Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-primary">
                  Rp {report.summary.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="whitespace-normal leading-tight">Transactions in {format(new Date(Number(year), Number(month) - 1), "MMMM yyyy")}</CardTitle>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleExportPDF}>
                  <IconDownload className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                {hasUnpaid && (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsSettleModalOpen(true)}>
                    <IconChecklist className="mr-2 h-4 w-4" /> Bulk Lunas (1 Month)
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bon Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
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
      </TabsContent>

      <Dialog open={isSettleAllModalOpen} onOpenChange={setIsSettleAllModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle All Outstanding Piutang</DialogTitle>
            <DialogDescription>
              This will mark ALL outstanding PIUTANG for this customer as LUNAS across all months. Omzet and profit will be recognized immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Payment Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettleAllModalOpen(false)} disabled={isSettling}>Cancel</Button>
            <Button onClick={handleBulkSettleAll} disabled={isSettling || !paymentDate} className="bg-green-600 hover:bg-green-700">
              {isSettling ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Settlement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isSettleModalOpen} onOpenChange={setIsSettleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle Entire Month</DialogTitle>
            <DialogDescription>
              This will mark all PIUTANG transactions in this month as LUNAS. Omzet and profit will be recognized.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !paymentDate && "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => {
                        if (date && paymentDate) {
                          date.setHours(paymentDate.getHours(), paymentDate.getMinutes(), 0, 0);
                        }
                        setPaymentDate(date)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-full sm:w-32">
                <label className="text-sm font-medium mb-2 block">Time</label>
                <Input
                  type="time"
                  step="60"
                  value={paymentDate ? format(paymentDate, "HH:mm") : "00:00"}
                  onChange={(e) => {
                    const timeStr = e.target.value;
                    if (paymentDate && timeStr) {
                      const [hours, minutes] = timeStr.split(':');
                      const newDate = new Date(paymentDate);
                      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                      setPaymentDate(newDate);
                    }
                  }}
                  className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettleModalOpen(false)} disabled={isSettling}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleBulkSettle} disabled={isSettling}>
              {isSettling ? "Processing..." : "Confirm Bulk Lunas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

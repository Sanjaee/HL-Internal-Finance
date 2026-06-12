"use client";

import { useState, useEffect } from "react";
import { getOverallRecap, getCustomerRecap, getProductTypeRecap } from "@/actions/report-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function ReportsClient() {
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  const [overallData, setOverallData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [productTypeData, setProductTypeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    const m = Number(month);
    const y = Number(year);
    
    const [overall, cust, prod] = await Promise.all([
      getOverallRecap(m, y),
      getCustomerRecap(m, y),
      getProductTypeRecap(m, y)
    ]);

    if (overall.success) setOverallData(overall.data);
    if (cust.success) setCustomerData(cust.data || []);
    if (prod.success) setProductTypeData(prod.data);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [month, year]);

  const exportCustomerPDF = () => {
    if (customerData.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Customer Recap - ${format(new Date(Number(year), Number(month) - 1), "MMMM yyyy")}`, 14, 15);
    
    const tableData = customerData.map((c: any) => [
      c.customerName,
      `Rp ${c.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalOmzetLM.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalOmzetBR.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
    ]);

    autoTable(doc, {
      startY: 25,
      head: [["Customer", "Piutang", "Dibayar", "Omzet LM", "Omzet BR", "Total Omzet", "Laba HL"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save(`Customer_Recap_${month}_${year}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="overall" className="space-y-4">
        <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="overall">Overall Recap</TabsTrigger>
            <TabsTrigger value="customer">Per Customer</TabsTrigger>
            <TabsTrigger value="product">Per Product Type</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[150px]">
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
        
        <TabsContent value="overall">
          {isLoading || !overallData ? (
            <div className="py-12 text-center text-muted-foreground">Loading recap...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Piutang</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-destructive">Rp {overallData.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sudah Dibayar</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">Rp {overallData.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Omzet</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">Rp {overallData.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Omzet LM</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-amber-600">Rp {overallData.totalOmzetLM.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Omzet BR</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-blue-600">Rp {overallData.totalOmzetBR.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div></CardContent>
              </Card>
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Laba HL</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-primary">Rp {overallData.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div></CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="customer">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Recap</CardTitle>
              <Button variant="outline" size="sm" onClick={exportCustomerPDF}>
                <IconDownload className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right text-destructive">Piutang</TableHead>
                    <TableHead className="text-right">Sudah Dibayar</TableHead>
                    <TableHead className="text-right text-amber-600">Omzet LM</TableHead>
                    <TableHead className="text-right text-blue-600">Omzet BR</TableHead>
                    <TableHead className="text-right font-bold">Total Omzet</TableHead>
                    <TableHead className="text-right text-primary">Laba HL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerData.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No data for this month.</TableCell></TableRow>
                  ) : (
                    customerData.map((c) => (
                      <TableRow key={c.customerId}>
                        <TableCell className="font-medium">{c.customerName}</TableCell>
                        <TableCell className="text-right text-destructive">Rp {c.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right">Rp {c.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right text-amber-600">Rp {c.totalOmzetLM.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right text-blue-600">Rp {c.totalOmzetBR.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right font-bold">Rp {c.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right font-bold text-primary">Rp {c.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product">
          {productTypeData && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-amber-600">LM</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Items Sold</span>
                    <span className="font-bold">{productTypeData.LM.itemsSold}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Total Omzet</span>
                    <span className="font-bold text-xl">Rp {productTypeData.LM.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-muted-foreground">Total Laba</span>
                    <span className="font-bold text-xl text-primary">Rp {productTypeData.LM.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle className="text-blue-600">BR</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Items Sold</span>
                    <span className="font-bold">{productTypeData.BR.itemsSold}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Total Omzet</span>
                    <span className="font-bold text-xl">Rp {productTypeData.BR.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-muted-foreground">Total Laba</span>
                    <span className="font-bold text-xl text-primary">Rp {productTypeData.BR.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

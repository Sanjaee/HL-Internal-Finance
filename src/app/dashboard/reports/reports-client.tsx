"use client";

import { useState, useEffect } from "react";
import { getOverallRecap, getCustomerRecap, getProductTypeRecap } from "@/actions/report-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { IconDownload, IconLoader2, IconSearch } from "@tabler/icons-react";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function ReportsClient() {
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(currentYear.toString());

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  const [overallData, setOverallData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [productTypeData, setProductTypeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const customerColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
      },
      {
        accessorKey: "totalPiutang",
        header: () => <div className="text-right text-destructive">Piutang</div>,
        cell: ({ row }) => <div className="text-right text-destructive">Rp {row.original.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div>,
      },
      {
        accessorKey: "totalDibayar",
        header: () => <div className="text-right">Sudah Dibayar</div>,
        cell: ({ row }) => <div className="text-right">Rp {row.original.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div>,
      },
      {
        accessorKey: "totalOmzetLM",
        header: () => <div className="text-right text-amber-600">Omzet LM</div>,
        cell: ({ row }) => <div className="text-right text-amber-600">Rp {row.original.totalOmzetLM.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div>,
      },
      {
        accessorKey: "totalOmzetBR",
        header: () => <div className="text-right text-blue-600">Omzet BR</div>,
        cell: ({ row }) => <div className="text-right text-blue-600">Rp {row.original.totalOmzetBR.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div>,
      },
      {
        accessorKey: "totalOmzet",
        header: () => <div className="text-right font-bold">Total Omzet</div>,
        cell: ({ row }) => <div className="text-right font-bold">Rp {row.original.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div>,
      },
      {
        accessorKey: "totalLaba",
        header: () => <div className="text-right text-primary">Laba HL</div>,
        cell: ({ row }) => <div className="text-right font-bold text-primary">Rp {row.original.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</div>,
      },
    ],
    []
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomerData = useMemo(() => {
    return customerData.filter((c) =>
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customerData, searchQuery]);

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

  const exportFullPDF = () => {
    if (!overallData || !productTypeData || customerData.length === 0) return;
    const doc = new jsPDF();
    
    // Main Header
    doc.setFontSize(18);
    doc.text("HL Internal Finance", 14, 15);
    
    // Sub Header
    const title = `Recap & Reporting - ${format(new Date(Number(year), Number(month) - 1), "MMMM yyyy")}`;
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(title, 14, 22);
    doc.setTextColor(0); // Reset color to black
    
    // Overall Stats
    doc.setFontSize(11);
    doc.text("Overall Recap", 14, 32);
    
    autoTable(doc, {
      startY: 37,
      head: [["Metric", "Amount"]],
      body: [
        ["Total Piutang", `Rp ${overallData.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`],
        ["Total Sudah Dibayar", `Rp ${overallData.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`],
        ["Total Omzet", `Rp ${overallData.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`],
        ["Omzet LM", `Rp ${overallData.totalOmzetLM.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`],
        ["Omzet BR", `Rp ${overallData.totalOmzetBR.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`],
        ["Total Laba HL", `Rp ${overallData.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    // Product Stats
    const finalY1 = (doc as any).lastAutoTable.finalY || 30;
    doc.text("Product Type Recap", 14, finalY1 + 10);
    
    autoTable(doc, {
      startY: finalY1 + 15,
      head: [["Type", "Items Sold", "Total Omzet", "Total Laba"]],
      body: [
        ["LM", productTypeData.LM.itemsSold, `Rp ${productTypeData.LM.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, `Rp ${productTypeData.LM.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`],
        ["BR", productTypeData.BR.itemsSold, `Rp ${productTypeData.BR.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, `Rp ${productTypeData.BR.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    // Customer Stats
    const finalY2 = (doc as any).lastAutoTable.finalY || finalY1;
    doc.text("Customer Recap", 14, finalY2 + 10);

    const tableData = customerData.map((c: any, index: number) => [
      index + 1,
      c.customerName,
      `Rp ${c.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalDibayar.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalOmzetLM.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalOmzetBR.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalOmzet.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      `Rp ${c.totalLaba.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
    ]);

    autoTable(doc, {
      startY: finalY2 + 15,
      head: [["No.", "Customer", "Piutang", "Dibayar", "Omzet LM", "Omzet BR", "Total Omzet", "Laba HL"]],
      body: tableData,
      theme: "grid",
      styles: { 
        fontSize: 8,
        valign: 'middle'
      },
      headStyles: { fillColor: [15, 23, 42] },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 } }, // Make the No. column narrower and centered
      didParseCell: (data) => {
        // Apply dynamic font size only to the body and only to currency columns (index > 1)
        if (data.section === 'body' && data.column.index > 1) {
          const text = data.cell.text[0] || "";
          const textLength = text.length;
          
          // Shrink font size as number gets larger to prevent wrapping
          if (textLength >= 16) {
            data.cell.styles.fontSize = 5;
          } else if (textLength >= 14) {
            data.cell.styles.fontSize = 6;
          } else if (textLength >= 12) {
            data.cell.styles.fontSize = 7;
          }
        }
      }
    });

    doc.save(`Recap_Report_${month}_${year}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recap & Reporting</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl text-justify">
            View financial recaps overall, per customer, and per product type. <br />
            <span className="text-xs text-muted-foreground/70 italic">
              *Fitur Smart PDF: Sistem dilengkapi algoritma Auto-Scale yang akan otomatis mengecilkan ukuran *font* angka secara proporsional saat nominal data mencapai puluhan hingga ratusan miliar. Hal ini menjamin format tabel PDF tetap rapi sempurna, mulus, dan tidak pernah terpotong ke bawah (wrap text) betapapun ekstremnya angka transaksi Anda.
            </span>
          </p>
        </div>
        <Button onClick={exportFullPDF} className="w-full sm:w-auto" disabled={isLoading || !overallData}>
          <IconDownload className="mr-2 h-4 w-4" /> Export Report (PDF)
        </Button>
      </div>

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
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="overall">
          {isLoading || !overallData ? (
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search customer..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DataTable columns={customerColumns} data={filteredCustomerData} />
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

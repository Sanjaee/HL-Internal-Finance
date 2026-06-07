"use client";

import { useState, useEffect } from "react";
import { getPelunasanData } from "@/actions/pelunasan-actions";
import { markTransactionLunas } from "@/actions/transaction-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import { IconCheck, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PelunasanClient({ customers }: { customers: any[] }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [customerId, setCustomerId] = useState("ALL");
  const [month, setMonth] = useState("ALL");
  const [year, setYear] = useState("ALL");

  // Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedBon, setSelectedBon] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSettling, setIsSettling] = useState(false);

  const router = useRouter();

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getPelunasanData({ customerId, month, year });
    if (res.success) {
      setData(res.data);
    } else {
      toast.error("Failed to load pelunasan data");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [customerId, month, year]);

  const handleSettle = async () => {
    if (!selectedBon) return;
    setIsSettling(true);
    const res = await markTransactionLunas(selectedBon.id, new Date(paymentDate));
    setIsSettling(false);

    if (res?.success) {
      toast.success(`Bon ${selectedBon.bonNumber} marked as LUNAS!`);
      setSettleModalOpen(false);
      fetchData();
      router.refresh();
    } else {
      toast.error(res?.error || "Failed to settle transaction");
    }
  };

  const openSettleModal = (bon: any) => {
    setSelectedBon(bon);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setSettleModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pelunasan</h1>
          <p className="text-muted-foreground mt-1">Manage accounts receivable and settlements.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium">Customer</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Customers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Customers</SelectItem>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Bulan</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="All Months" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Months</SelectItem>
                {Array.from({length: 12}).map((_, i) => (
                  <SelectItem key={i+1} value={(i+1).toString()}>{format(new Date(2000, i, 1), "MMMM")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Tahun</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="All Years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Years</SelectItem>
                {[2024, 2025, 2026, 2027].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={fetchData}>
            <IconSearch className="mr-2 h-4 w-4" /> Filter
          </Button>
        </CardContent>
      </Card>

      {!data || isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <Tabs defaultValue="piutang">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="piutang">Piutang Aktif</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat Pelunasan</TabsTrigger>
          </TabsList>

          <TabsContent value="piutang" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Piutang</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    Rp {data.summary.totalPiutang.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Bon Belum Lunas</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{data.summary.jumlahBonBelumLunas}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Customer Menunggak</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{data.summary.totalCustomerMenunggak}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pelunasan Bulan Ini</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    Rp {data.summary.nilaiPelunasanBulanIni.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No Bon</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Omzet</TableHead>
                      <TableHead className="text-right">Ongkir</TableHead>
                      <TableHead className="text-right">Total Tagihan</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.piutang.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Tidak ada piutang aktif.</TableCell></TableRow>
                    ) : (
                      data.piutang.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            <Link href={`/dashboard/transactions/${p.id}`} className="hover:underline text-primary">{p.bonNumber}</Link>
                          </TableCell>
                          <TableCell>{format(new Date(p.transactionDate), "dd/MM/yy")}</TableCell>
                          <TableCell>{p.customerName}</TableCell>
                          <TableCell className="text-right">Rp {Number(p.subtotalOmzet).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell className="text-right">Rp {Number(p.shippingCost).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell className="text-right font-bold text-destructive">Rp {Number(p.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell className="text-center">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openSettleModal(p)}>
                              <IconCheck className="mr-1 h-4 w-4" /> Lunas
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="riwayat" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tgl Bayar</TableHead>
                      <TableHead>No Bon</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.riwayat.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Belum ada riwayat pelunasan.</TableCell></TableRow>
                    ) : (
                      data.riwayat.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell>{format(new Date(r.paymentDate), "dd MMM yyyy")}</TableCell>
                          <TableCell className="font-medium">
                            <Link href={`/dashboard/transactions/${r.id}`} className="hover:underline text-primary">{r.bonNumber}</Link>
                          </TableCell>
                          <TableCell>{r.customerName}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">Rp {Number(r.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Settle Modal */}
      <Dialog open={settleModalOpen} onOpenChange={setSettleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pelunasan</DialogTitle>
            <DialogDescription>
              Ubah status bon {selectedBon?.bonNumber} menjadi LUNAS.
            </DialogDescription>
          </DialogHeader>
          {selectedBon && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Customer:</span><br/>{selectedBon.customerName}</div>
                <div><span className="text-muted-foreground">Total Tagihan:</span><br/><span className="font-bold text-lg">Rp {Number(selectedBon.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span></div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tanggal Pelunasan *</label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleModalOpen(false)} disabled={isSettling}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSettle} disabled={isSettling}>
              {isSettling ? "Processing..." : "Konfirmasi Lunas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { getPelunasanData } from "@/actions/pelunasan-actions";
import { markTransactionLunas } from "@/actions/transaction-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import { IconCheck, IconSearch, IconCalendar, IconLoader2 } from "@tabler/icons-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

export function PelunasanClient({ customers }: { customers: any[] }) {
  // Filters
  const [customerId, setCustomerId] = useState("ALL");
  const [month, setMonth] = useState("ALL");
  const [year, setYear] = useState("ALL");

  // Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedBon, setSelectedBon] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isSettling, setIsSettling] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pelunasan", customerId, month, year],
    queryFn: async () => {
      const res = await getPelunasanData({ customerId, month, year });
      if (!res.success) throw new Error("Failed to load");
      return res.data;
    },
  });

  const handleSettle = async () => {
    if (!selectedBon) return;
    setIsSettling(true);
    const res = await markTransactionLunas(selectedBon.id, paymentDate || new Date());
    setIsSettling(false);

    if (res?.success) {
      toast.success(`Bon ${selectedBon.bonNumber} marked as LUNAS!`);
      setSettleModalOpen(false);
      refetch();
      router.refresh();
    } else {
      toast.error(res?.error || "Failed to settle transaction");
    }
  };

  const openSettleModal = (bon: any) => {
    setSelectedBon(bon);
    setPaymentDate(new Date());
    setSettleModalOpen(true);
  };

  const filteredPiutang = useMemo(() => {
    return data?.piutang?.filter(
      (p: any) =>
        p.bonNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [data?.piutang, searchQuery]);

  const filteredRiwayat = useMemo(() => {
    return data?.riwayat?.filter(
      (r: any) =>
        r.bonNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [data?.riwayat, searchQuery]);

  const piutangColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "bonNumber",
      header: "No Bon",
      cell: ({ row }) => (
        <Link href={`/dashboard/transactions/${row.original.id}`} className="hover:underline text-primary font-medium">
          {row.original.bonNumber}
        </Link>
      ),
    },
    {
      accessorKey: "transactionDate",
      header: "Tanggal",
      cell: ({ row }) => format(new Date(row.original.transactionDate), "dd/MM/yy"),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
    },
    {
      accessorKey: "subtotalOmzet",
      header: "Omzet",
      cell: ({ row }) => `Rp ${Number(row.original.subtotalOmzet).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
    },
    {
      accessorKey: "shippingCost",
      header: "Ongkir",
      cell: ({ row }) => `Rp ${Number(row.original.shippingCost).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
    },
    {
      accessorKey: "totalAmount",
      header: "Total Tagihan",
      cell: ({ row }) => (
        <span className="font-bold text-destructive">
          Rp {Number(row.original.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openSettleModal(row.original)}>
            <IconCheck className="mr-1 h-4 w-4" /> Lunas
          </Button>
        </div>
      ),
    },
  ], []);

  const riwayatColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "paymentDate",
      header: "Tgl Bayar",
      cell: ({ row }) => format(new Date(row.original.paymentDate), "dd MMM yyyy"),
    },
    {
      accessorKey: "bonNumber",
      header: "No Bon",
      cell: ({ row }) => (
        <Link href={`/dashboard/transactions/${row.original.id}`} className="hover:underline text-primary font-medium">
          {row.original.bonNumber}
        </Link>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
    },
    {
      accessorKey: "totalAmount",
      header: "Nilai",
      cell: ({ row }) => (
        <div className="text-right font-bold text-green-600">
          Rp {Number(row.original.totalAmount).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
        </div>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pelunasan</h1>
          <p className="text-muted-foreground mt-1">Manage accounts receivable and settlements.</p>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Loading...</span>
        </div>
      ) : (
        <>
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

          <Tabs defaultValue="piutang">
            <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by Bon Number or Customer..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="piutang">Piutang Aktif</TabsTrigger>
                <TabsTrigger value="riwayat">Riwayat Pelunasan</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="piutang" className="mt-6 space-y-6">
              <DataTable columns={piutangColumns} data={filteredPiutang} />
            </TabsContent>

            <TabsContent value="riwayat" className="mt-6 space-y-6">
              <DataTable columns={riwayatColumns} data={filteredRiwayat} />
            </TabsContent>
          </Tabs>
        </>
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
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 block">Tanggal Pelunasan *</label>
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
                      onSelect={setPaymentDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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

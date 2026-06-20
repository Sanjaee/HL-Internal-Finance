"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { IconGift, IconSearch } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { BonusRedeemModal } from "./bonus-redeem-modal";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function BonusClient({ bonusStatus, products }: { bonusStatus: any[], products: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "redeem">("all");
  const router = useRouter();

  const filteredBonusStatus = useMemo(() => {
    return bonusStatus.filter((c) => {
      if (filterMode === "redeem" && c.available <= 0) return false;
      return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [bonusStatus, filterMode, searchQuery]);

  const handleClose = () => {
    setSelectedCustomer(null);
    router.refresh();
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "bonusThreshold",
        header: "Threshold",
        cell: ({ row }) => `Rp ${Number(row.original.bonusThreshold).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
      },
      {
        id: "progress",
        header: "Progress (Current Cycle)",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="w-[300px] flex flex-col gap-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Rp {c.currentCycleProgress.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                <span>Rp {Number(c.bonusThreshold).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
              </div>
              <Progress value={c.progressPercent} className="h-2" />
            </div>
          );
        },
      },
      {
        accessorKey: "totalEarned",
        header: "Total Earned",
      },
      {
        id: "available",
        header: "Available",
        cell: ({ row }) => {
          const c = row.original;
          return c.available > 0 ? (
            <Badge className="bg-green-600 hover:bg-green-700">{c.available} Available</Badge>
          ) : (
            <Badge variant="outline">0</Badge>
          );
        },
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex justify-end">
              <Button
                variant={c.available > 0 ? "default" : "outline"}
                disabled={c.available <= 0}
                onClick={() => setSelectedCustomer(c)}
              >
                <IconGift className="mr-2 h-4 w-4" /> Redeem
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bonus Management</h1>
          <p className="text-sm text-muted-foreground">
            Track customer omzet progress and redeem bonuses.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customer..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as any)} className="w-full sm:w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Customers</TabsTrigger>
            <TabsTrigger value="redeem">Ready to Redeem</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <DataTable columns={columns} data={filteredBonusStatus} />

      <BonusRedeemModal
        customer={selectedCustomer}
        products={products}
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && handleClose()}
      />
    </div>
  );
}

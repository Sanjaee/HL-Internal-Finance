"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { IconGift, IconSearch } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { BonusRedeemModal } from "./bonus-redeem-modal";
import { Input } from "@/components/ui/input";

export function BonusClient({ bonusStatus, products }: { bonusStatus: any[], products: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const router = useRouter();

  const filteredBonusStatus = bonusStatus.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setSelectedCustomer(null);
    router.refresh();
  };

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

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customer..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Progress (Current Cycle)</TableHead>
              <TableHead>Total Earned</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBonusStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No active customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBonusStatus.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>Rp {Number(c.bonusThreshold).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className="w-[300px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Rp {c.currentCycleProgress.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                        <span>Rp {Number(c.bonusThreshold).toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                      </div>
                      <Progress value={c.progressPercent} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{c.totalEarned}</TableCell>
                  <TableCell>
                    {c.available > 0 ? (
                      <Badge className="bg-green-600 hover:bg-green-700">{c.available} Available</Badge>
                    ) : (
                      <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={c.available > 0 ? "default" : "outline"}
                      disabled={c.available <= 0}
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <IconGift className="mr-2 h-4 w-4" /> Redeem
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {Math.ceil(filteredBonusStatus.length / ITEMS_PER_PAGE) > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} 
                className={page === 1 ? "pointer-events-none opacity-50" : ""} 
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm font-medium">Page {page} of {Math.ceil(filteredBonusStatus.length / ITEMS_PER_PAGE)}</span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(Math.ceil(filteredBonusStatus.length / ITEMS_PER_PAGE), p + 1)); }} 
                className={page === Math.ceil(filteredBonusStatus.length / ITEMS_PER_PAGE) ? "pointer-events-none opacity-50" : ""} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <BonusRedeemModal
        customer={selectedCustomer}
        products={products}
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && handleClose()}
      />
    </div>
  );
}

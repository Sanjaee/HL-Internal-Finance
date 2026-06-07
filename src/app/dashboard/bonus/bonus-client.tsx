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
import { IconGift } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { BonusRedeemModal } from "./bonus-redeem-modal";

export function BonusClient({ bonusStatus, products }: { bonusStatus: any[], products: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const router = useRouter();

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
            {bonusStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No active customers found.
                </TableCell>
              </TableRow>
            ) : (
              bonusStatus.map((c) => (
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

      <BonusRedeemModal
        customer={selectedCustomer}
        products={products}
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && handleClose()}
      />
    </div>
  );
}

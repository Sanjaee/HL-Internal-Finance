"use client";

import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconAlertTriangle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center bg-background">
      <IconAlertTriangle className="h-20 w-20 text-muted-foreground opacity-50" />
      <h1 className="text-6xl font-extrabold tracking-tight">404</h1>
      <h2 className="text-2xl font-semibold tracking-tight">Oops! Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mt-2">
        Halaman atau data yang Anda cari tidak dapat ditemukan. Mungkin URL-nya salah atau datanya sudah dihapus.
      </p>
      <div className="mt-6 flex gap-4">
        <Button onClick={() => router.back()} size="lg">
          <IconArrowLeft className="mr-2 h-5 w-5" /> Kembali
        </Button>
        <Button variant="outline" onClick={() => router.push("/dashboard")} size="lg">
          Ke Dashboard
        </Button>
      </div>
    </div>
  );
}

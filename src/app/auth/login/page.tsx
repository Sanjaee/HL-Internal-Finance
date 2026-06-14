import { GalleryVerticalEnd } from "lucide-react"
import Image from "next/image"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col items-center justify-center h-full bg-zinc-900 text-zinc-50 p-10 dark:bg-zinc-50 dark:text-zinc-900">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-zinc-800 dark:bg-zinc-200">
            <GalleryVerticalEnd className="size-10" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">HL Internal Finance</h1>
          <p className="text-lg text-zinc-400 dark:text-zinc-500">
            Sistem admin mutakhir yang dirancang khusus untuk mengelola lebih dari <strong>50.000 data transaksi</strong> secara ringan, instan, dan tanpa lag.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <a href="#" className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
            <div className="flex size-6 items-center justify-center rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
              <GalleryVerticalEnd className="size-4" />
            </div>
            HL Internal Finance
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}

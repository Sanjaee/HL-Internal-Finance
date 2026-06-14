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
          <div className="space-y-4 text-left">
            <p className="text-lg font-medium text-zinc-300 dark:text-zinc-700 text-center">
              Performa Ekstrem. Selamat Tinggal <i>Browser Freeze</i>.
            </p>
            <p className="text-base text-zinc-400 dark:text-zinc-500 leading-relaxed text-justify">
              Mimpi buruk terbesar dalam mengelola keuangan adalah aplikasi yang mendadak macet, halaman <i>crash</i>, dan kursor yang tak bisa digerakkan akibat dipaksa menelan puluhan ribu baris data sekaligus.
              <br /><br />
              Sistem ini mendobrak batasan tersebut. Ditenagai oleh <strong>Next.js Server Components</strong>, arsitektur <strong>TanStack Virtualization</strong>, <strong>Optimized Debouncing</strong>, serta manipulasi <i>cache</i> tingkat lanjut, aplikasi ini memotong beban memori secara drastis untuk memproses <strong>20.000+ data transaksi</strong> secara instan. Hasilnya? Beban operasional terberat pun berubah menjadi pengalaman yang mulus, secepat kilat, dan tanpa sedetik pun <i>lag</i>.
            </p>
          </div>
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

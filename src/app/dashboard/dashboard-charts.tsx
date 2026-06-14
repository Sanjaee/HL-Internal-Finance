"use client";

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DashboardCharts({
  chartInteractive,
}: {
  chartInteractive: any[];
}) {
  const [timeRangeLeft, setTimeRangeLeft] = React.useState("90d")
  const [timeRangeRight, setTimeRangeRight] = React.useState("90d")

  const filterData = (range: string) => {
    return chartInteractive.filter((item) => {
      const date = new Date(item.date)
      const referenceDate = new Date() // Use current date
      let daysToSubtract = 90
      if (range === "30d") daysToSubtract = 30
      else if (range === "7d") daysToSubtract = 7
      
      const startDate = new Date(referenceDate)
      startDate.setDate(startDate.getDate() - daysToSubtract)
      return date >= startDate
    })
  }

  const dataLeft = filterData(timeRangeLeft)
  const dataRight = filterData(timeRangeRight)

  return (
    <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
      {/* LEFT CHART: Product Type */}
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Omzet by Product Type</CardTitle>
            <CardDescription>
              Interactive LM & BR revenue
            </CardDescription>
          </div>
          <Select value={timeRangeLeft} onValueChange={setTimeRangeLeft}>
            <SelectTrigger
              className="w-[140px] rounded-lg sm:ml-auto"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 90 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={{
              LM: { label: "LM", color: "#2563eb" },
              BR: { label: "BR", color: "#60a5fa" },
            }}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={dataLeft}>
              <defs>
                <linearGradient id="fillLM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-LM)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-LM)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillBR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-BR)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-BR)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  return new Date(value).toLocaleDateString("id-ID", { month: "short", day: "numeric" })
                }}
              />
              <YAxis 
                tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" labelFormatter={(val) => new Date(val).toLocaleDateString("id-ID")} />}
              />
              <Area dataKey="BR" type="natural" fill="url(#fillBR)" stroke="var(--color-BR)" stackId="a" />
              <Area dataKey="LM" type="natural" fill="url(#fillLM)" stroke="var(--color-LM)" stackId="a" />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* RIGHT CHART: Total Trend */}
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Monthly Omzet Trend</CardTitle>
            <CardDescription>
              Total revenue trend
            </CardDescription>
          </div>
          <Select value={timeRangeRight} onValueChange={setTimeRangeRight}>
            <SelectTrigger
              className="w-[140px] rounded-lg sm:ml-auto"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 90 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={{
              total: { label: "Total Omzet", color: "#3b82f6" },
            }}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={dataRight}>
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  return new Date(value).toLocaleDateString("id-ID", { month: "short", day: "numeric" })
                }}
              />
              <YAxis 
                tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" labelFormatter={(val) => new Date(val).toLocaleDateString("id-ID")} />}
              />
              <Area dataKey="total" type="natural" fill="url(#fillTotal)" stroke="var(--color-total)" />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

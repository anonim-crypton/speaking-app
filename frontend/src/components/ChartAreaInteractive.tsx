"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "Qurilmalar (Desktop va Mobile) interaktiv diagrammasi"

export interface DeviceChartPoint {
  date: string
  desktop: number
  mobile: number
}

// Generate 90-day baseline starting strictly from 2026-10-18 (no earlier dates)
export function generateDefaultChartData(): DeviceChartPoint[] {
  const list: DeviceChartPoint[] = []
  const start = new Date("2026-10-18T00:00:00Z")
  for (let i = 0; i < 90; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
    list.push({
      date: d.toISOString().slice(0, 10),
      desktop: 0,
      mobile: 0,
    })
  }
  return list
}

const defaultChartData = generateDefaultChartData()

const chartConfig = {
  visitors: {
    label: "Qurilmalar",
  },
  desktop: {
    label: "Kompyuter (Desktop)",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Telefon (Mobile)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export interface ChartAreaInteractiveProps {
  data?: DeviceChartPoint[]
}

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  const sourceData = React.useMemo(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Filter out any date strictly before 2026-10-18 to ensure start date is 2026-10-18
      const valid = data.filter((item) => item.date >= "2026-10-18")
      return valid.length > 0 ? valid : defaultChartData
    }
    return defaultChartData
  }, [data])

  const filteredData = React.useMemo(() => {
    let limit = 90
    if (timeRange === "30d") limit = 30
    if (timeRange === "7d") limit = 7
    return sourceData.slice(0, limit)
  }, [sourceData, timeRange])

  const totalDesktop = React.useMemo(
    () => filteredData.reduce((acc, curr) => acc + (curr.desktop || 0), 0),
    [filteredData]
  )
  const totalMobile = React.useMemo(
    () => filteredData.reduce((acc, curr) => acc + (curr.mobile || 0), 0),
    [filteredData]
  )

  return (
    <Card className="pt-0 border-white/10 bg-[#0d1527]/80 backdrop-blur-2xl rounded-3xl shadow-2xl">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-white/10 py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-white text-base sm:text-lg font-bold">
            Qurilmalar Statistikasi (Desktop va Mobile)
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs sm:text-sm">
            18-Oktyabr 2026 dan boshlab ro'yxatdan o'tgan va kirgan qurilmalar dinamikasi
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[170px] rounded-xl border-white/10 bg-[#070d1a] text-zinc-200 text-xs font-medium"
              aria-label="Vaqt oralig'ini tanlang"
            >
              <SelectValue placeholder="Oxirgi 3 oy" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-[#0d1527] text-white">
              <SelectItem value="90d" className="rounded-lg text-xs cursor-pointer hover:bg-white/10">
                90 kunlik ko'rsatkich
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg text-xs cursor-pointer hover:bg-white/10">
                30 kunlik ko'rsatkich
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg text-xs cursor-pointer hover:bg-white/10">
                7 kunlik ko'rsatkich
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>

        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
            <span className="text-zinc-400 block">Jami Kompyuter (Desktop)</span>
            <span className="text-lg font-mono font-bold text-cyan-300">
              {totalDesktop} ta
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-400/20">
            <span className="text-zinc-400 block">Jami Telefon (Mobile)</span>
            <span className="text-lg font-mono font-bold text-indigo-300">
              {totalMobile} ta
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 col-span-2 sm:col-span-1">
            <span className="text-zinc-400 block">Barcha Qurilmalar</span>
            <span className="text-lg font-mono font-bold text-emerald-300">
              {totalDesktop + totalMobile} ta
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

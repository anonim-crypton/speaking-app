"use client"

import React from "react"
import { DonutChart, TooltipProps } from "@/components/DonutChart"
import { Chrome, Mail, Phone } from "lucide-react"

interface DataItem {
  name: string
  amount: number
  key: string
}

export interface DonutChartAuthProvidersProps {
  providers?: {
    google?: number
    password?: number
    phone?: number
  }
}

export function DonutChartAuthProviders({ providers }: DonutChartAuthProvidersProps) {
  const [datas, setDatas] = React.useState<TooltipProps | null>(null)

  const googleCount = Number(providers?.google || 0)
  const passwordCount = Number(providers?.password || 0)
  const phoneCount = Number(providers?.phone || 0)

  const data: DataItem[] = [
    {
      name: "Google hisobi",
      amount: googleCount,
      key: "google",
    },
    {
      name: "Email va parol",
      amount: passwordCount,
      key: "password",
    },
    {
      name: "Telefon raqami",
      amount: phoneCount,
      key: "phone",
    },
  ]

  const sumNumericArray = (arr: number[]): number =>
    arr.reduce((sum, num) => sum + num, 0)

  const countFormatter = (number: number) =>
    `${Intl.NumberFormat("uz-UZ").format(number)} ta foydalanuvchi`

  const payload = datas?.payload?.[0]
  const value = payload?.value ?? 0

  const totalRegistered = sumNumericArray(data.map((d) => d.amount))

  const formattedValue = payload
    ? `${payload.category}: ${countFormatter(value)}`
    : `Jami: ${countFormatter(totalRegistered)}`

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0d1527]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
      <div className="text-center">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-cyan-400">
          Ro'yxatdan O'tish Usullari Bo'yicha Statistika
        </p>
        <p className="mt-2 w-full text-center text-xl sm:text-2xl font-mono font-bold text-white">
          {formattedValue}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Google account, Email & Parol hamda Telefon raqami orqali ro'yxatdan o'tgan foydalanuvchilar soni
        </p>
      </div>

      <DonutChart
        data={data}
        category="name"
        value="amount"
        className="mx-auto mt-6 h-64"
        colors={["cyan", "violet", "emerald"]}
        valueFormatter={(val) => `${val} ta`}
        tooltipCallback={(props) => {
          if (props.active && props.payload && props.payload[0]) {
            setDatas((prev) => {
              if (prev?.payload?.[0]?.category === props.payload?.[0]?.category)
                return prev
              return props
            })
          } else {
            setDatas(null)
          }
          return null
        }}
      />

      {/* Legend / Breakdown Cards */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
              <Chrome className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Google Account</div>
              <div className="text-[11px] text-zinc-400">Google orqali kirganlar</div>
            </div>
          </div>
          <span className="text-base font-mono font-bold text-cyan-300">{googleCount} ta</span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-violet-500/10 border border-violet-400/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Email va Parol</div>
              <div className="text-[11px] text-zinc-400">Standart ro'yxatdan o'tish</div>
            </div>
          </div>
          <span className="text-base font-mono font-bold text-violet-300">{passwordCount} ta</span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Telefon Raqami</div>
              <div className="text-[11px] text-zinc-400">Telefon orqali kirganlar</div>
            </div>
          </div>
          <span className="text-base font-mono font-bold text-emerald-300">{phoneCount} ta</span>
        </div>
      </div>
    </div>
  )
}

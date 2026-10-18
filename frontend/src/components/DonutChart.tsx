"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    category: string;
    value: number;
    color?: string;
    payload?: any;
    [key: string]: any;
  }>;
}

export interface DonutChartProps {
  data: Array<{ [key: string]: any }>;
  category: string;
  value: string;
  colors?: string[];
  className?: string;
  tooltipCallback?: (props: TooltipProps) => any;
  valueFormatter?: (value: number) => string;
}

const COLOR_MAP: Record<string, string> = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  emerald: "#10b981",
  indigo: "#6366f1",
  amber: "#f59e0b",
  rose: "#f43f5e",
  teal: "#14b8a6",
  sky: "#0ea5e9",
  purple: "#a855f7",
};

export function DonutChart({
  data,
  category,
  value,
  colors = ["blue", "violet", "cyan", "emerald"],
  className,
  tooltipCallback,
  valueFormatter = (val) => `${val}`,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const resolveColor = (c: string, index: number): string => {
    if (c.startsWith("#") || c.startsWith("rgb") || c.startsWith("var")) {
      return c;
    }
    return COLOR_MAP[c] || colors[index % colors.length] || "#06b6d4";
  };

  const chartData = data.map((item, index) => ({
    ...item,
    _category: String(item[category] ?? ""),
    _value: Number(item[value] ?? 0),
    _color: resolveColor(colors[index % colors.length] || "cyan", index),
  }));

  // If all values are 0, display an empty placeholder donut ring
  const total = chartData.reduce((acc, curr) => acc + curr._value, 0);

  return (
    <div className={cn("relative flex items-center justify-center h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={(props: any) => {
              if (tooltipCallback) {
                if (props.active && props.payload && props.payload.length > 0) {
                  const p = props.payload[0];
                  const item = p.payload;
                  tooltipCallback({
                    active: true,
                    payload: [
                      {
                        category: item._category,
                        value: item._value,
                        color: item._color,
                        payload: item,
                      },
                    ],
                  });
                } else {
                  tooltipCallback({ active: false });
                }
              }

              if (!props.active || !props.payload?.length) return null;
              const payload = props.payload[0].payload;
              return (
                <div className="rounded-xl border border-white/10 bg-[#0d1527]/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: payload._color }}
                    />
                    <span className="font-semibold text-white">
                      {payload._category}:
                    </span>
                    <span className="font-mono text-cyan-300">
                      {valueFormatter(payload._value)}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          {total === 0 ? (
            <Pie
              data={[{ _category: "Bo'sh", _value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="85%"
              dataKey="_value"
              strokeWidth={0}
              isAnimationActive={false}
            >
              <Cell fill="rgba(255, 255, 255, 0.08)" />
            </Pie>
          ) : (
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="85%"
              paddingAngle={3}
              dataKey="_value"
              nameKey="_category"
              strokeWidth={0}
              isAnimationActive={false}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry._color}
                  style={{
                    filter:
                      activeIndex === index
                        ? `drop-shadow(0 0 10px ${entry._color})`
                        : undefined,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                />
              ))}
            </Pie>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

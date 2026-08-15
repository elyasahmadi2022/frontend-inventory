"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const FINTECH_PRIMARY = "#03C03C";
export const FINTECH_PRIMARY_SOFT = "rgba(0, 102, 255, 0.72)";
export const FINTECH_PRIMARY_FAINT = "rgba(0, 102, 255, 0.42)";
export const FINTECH_NEUTRAL = "rgba(100, 116, 139, 0.55)";

export const FINTECH_CHART_MARGIN = { top: 8, right: 8, left: -4, bottom: 0 };

export const FINTECH_AXIS_TICK = { fontSize: 11, fill: "#94a3b8" };

export const FINTECH_GRID = {
  strokeDasharray: "3 8",
  vertical: false,
  stroke: "#e2e8f0",
  strokeOpacity: 0.9,
};

export const FINTECH_CURSOR = {
  stroke: FINTECH_PRIMARY,
  strokeWidth: 1,
  strokeDasharray: "4 4",
  strokeOpacity: 0.3,
};

type TooltipEntry = {
  color?: string;
  name?: string;
  value?: number;
  dataKey?: string;
};

export function FintechChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  valueFormatter?: (value: number, key?: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-light-border/80 bg-light-surface px-3.5 py-2.5  dark:border-dark-border/80 dark:bg-dark-surface dark:shadow-dark-md">
      {label ? (
        <p className="mb-1.5 text-[11px] font-semibold text-light-text dark:text-dark-text">
          {label}
        </p>
      ) : null}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={entry.dataKey}
            className="flex items-center justify-between gap-5 text-[11px]"
          >
            <span className="flex items-center gap-1.5 text-muted">
              <span
                className="size-1.5 rounded-full"
                style={{ background: entry.color }}
                aria-hidden="true"
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-light-text dark:text-dark-text">
              {valueFormatter
                ? valueFormatter(entry.value ?? 0, entry.dataKey)
                : (entry.value ?? 0).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FintechChartLegend({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
      {children}
    </div>
  );
}

export function FintechLegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-1.5 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function FintechLineGradient({
  id,
  color,
  topOpacity = 0.28,
}: {
  id: string;
  color: string;
  topOpacity?: number;
}) {
  const fillColor = color.startsWith("rgba") ? FINTECH_PRIMARY : color;

  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={fillColor} stopOpacity={topOpacity} />
      <stop offset="55%" stopColor={fillColor} stopOpacity={topOpacity * 0.35} />
      <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
    </linearGradient>
  );
}

type LineAreaSeries = {
  dataKey: string;
  name: string;
  stroke: string;
  gradientId: string;
  gradientTop?: number;
  strokeWidth?: number;
  emphasis?: boolean;
  lineOnly?: boolean;
};

export function FintechLineArea({
  dataKey,
  name,
  stroke,
  gradientId,
  strokeWidth = 2,
  emphasis = false,
  lineOnly = false,
}: LineAreaSeries) {
  const shared = {
    type: "monotone" as const,
    dataKey,
    name,
    stroke,
    strokeWidth: emphasis ? strokeWidth + 0.5 : strokeWidth,
    dot: false,
    isAnimationActive: true,
  };

  if (lineOnly) {
    return (
      <Line
        {...shared}
        activeDot={{ r: 4, fill: stroke, strokeWidth: 0 }}
      />
    );
  }

  return (
    <Area
      {...shared}
      fill={`url(#${gradientId})`}
      activeDot={
        emphasis
          ? { r: 5, fill: stroke, stroke: "#fff", strokeWidth: 2 }
          : { r: 4, fill: stroke, strokeWidth: 0 }
      }
    />
  );
}

type FintechLineAreaChartProps<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T & string;
  series: LineAreaSeries[];
  yTickFormatter?: (value: number) => string;
  tooltipValueFormatter?: (value: number, key?: string) => string;
  height?: number;
};

export function FintechLineAreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  yTickFormatter,
  tooltipValueFormatter,
  height = 280,
  composed = false,
}: FintechLineAreaChartProps<T> & { composed?: boolean }) {
  const Chart = composed ? ComposedChart : AreaChart;
  const fillSeries = series.filter((s) => !s.lineOnly);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data} margin={FINTECH_CHART_MARGIN}>
          <defs>
            {fillSeries.map((s) => (
              <FintechLineGradient
                key={s.gradientId}
                id={s.gradientId}
                color={s.stroke}
                topOpacity={s.gradientTop ?? (s.emphasis ? 0.3 : 0.16)}
              />
            ))}
          </defs>
          <CartesianGrid {...FINTECH_GRID} />
          <XAxis
            dataKey={xKey as string}
            tickLine={false}
            axisLine={false}
            tick={FINTECH_AXIS_TICK}
            dy={8}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={FINTECH_AXIS_TICK}
            width={44}
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            cursor={FINTECH_CURSOR}
            content={
              <FintechChartTooltip valueFormatter={tooltipValueFormatter} />
            }
          />
          {series.map((s) => (
            <FintechLineArea key={s.dataKey} {...s} />
          ))}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

const tooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  borderRadius: "12px",
  fontSize: "12px",
};

function tooltipFormatter(formatter?: (v: number) => string) {
  // Recharts Tooltip formatter accepts varied value types
  return (value: unknown) => {
    const num = typeof value === "number" ? value : Number(value ?? 0);
    return formatter ? formatter(num) : String(num);
  };
}

export function AllocationPieChart({
  data,
  formatter,
}: {
  data: { name: string; value: number }[];
  formatter?: (v: number) => string;
}) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={tooltipFormatter(formatter) as never}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({
  data,
  formatter,
}: {
  data: { label: string; value: number }[];
  formatter?: (v: number) => string;
}) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fill: "var(--chart-text)", fontSize: 11 }}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter(formatter) as never} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({
  data,
  dataKey = "value",
  formatter,
}: {
  data: { label: string; [key: string]: string | number }[];
  dataKey?: string;
  formatter?: (v: number) => string;
}) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="label" tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter(formatter) as never} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#3B82F6"
          fill="url(#colorValue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLineChart({
  data,
  lines,
  formatter,
}: {
  data: { label: string; [key: string]: string | number }[];
  lines: { key: string; color: string; name: string }[];
  formatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="label" tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter(formatter) as never} />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            name={line.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseChart({
  income,
  expenses,
  formatter,
}: {
  income: number;
  expenses: number;
  formatter?: (v: number) => string;
}) {
  const data = [
    { name: "Income", value: income, fill: "#10B981" },
    { name: "Expenses", value: expenses, fill: "#EF4444" },
    { name: "Surplus", value: Math.max(0, income - expenses), fill: "#3B82F6" },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="name" tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter(formatter) as never} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

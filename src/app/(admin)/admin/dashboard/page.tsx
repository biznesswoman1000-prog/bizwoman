//frontend/src/app/(admin)/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { DashboardStats, RevenueChartPoint } from "@/types";
import { apiGet } from "@/lib/api";
import { formatPrice, formatNumber, timeAgo } from "@/lib/utils";
import { Skeleton, ErrorState } from "@/components/shared/loading-spinner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {trend >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {Math.abs(trend)}% from last month
          </span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<{ success: boolean; data: DashboardStats }>(
        "/analytics/dashboard",
      ),
      apiGet<{ success: boolean; data: { chart: RevenueChartPoint[] } }>(
        "/analytics/revenue?period=30",
      ),
    ])
      .then(([statsRes, chartRes]) => {
        setStats((statsRes as any).data as DashboardStats);
        setChartData((chartRes as any).data.chart);
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setIsLoading(false));
  }, []);

  if (error)
    return (
      <div className="p-6">
        <ErrorState message={error} retry={() => window.location.reload()} />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome back. Here's what's happening.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : stats ? (
          <>
            <StatCard
              title="Total Orders"
              value={formatNumber(stats.orders.total)}
              sub={`${stats.orders.today} today`}
              icon={ShoppingCart}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Monthly Revenue"
              value={formatPrice(stats.revenue?.thisMonth || 0)}
              icon={DollarSign}
              trend={stats.revenue?.growth}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              title="Customers"
              value={formatNumber(stats.customers.total)}
              sub={`${stats.customers.newThisMonth} new this month`}
              icon={Users}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              title="Products"
              value={formatNumber(stats.inventory.total)}
              sub={`${stats.inventory.lowStock} low stock`}
              icon={Package}
              color="bg-orange-50 text-orange-600"
            />
          </>
        ) : null}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">
          Revenue — Last 30 Days
        </h2>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => v.slice(5)} // MM-DD
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), "Revenue"]}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#7c3aed" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Alerts row */}
      {stats &&
        (stats.inventory.lowStock > 0 ||
          stats.pending.quotations > 0 ||
          stats.pending.consultations > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.inventory.lowStock > 0 && (
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">
                    {stats.inventory.lowStock} low stock items
                  </p>
                  <Link
                    href="/admin/inventory"
                    className="text-xs text-orange-600 hover:underline"
                  >
                    Review inventory →
                  </Link>
                </div>
              </div>
            )}
            {stats.pending.quotations > 0 && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {stats.pending.quotations} pending quotations
                  </p>
                  <Link
                    href="/admin/quotations"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View quotations →
                  </Link>
                </div>
              </div>
            )}
            {stats.pending.consultations > 0 && (
              <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl p-4">
                <Clock className="w-5 h-5 text-purple-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">
                    {stats.pending.consultations} pending consultations
                  </p>
                  <Link
                    href="/admin/consultations"
                    className="text-xs text-purple-600 hover:underline"
                  >
                    View consultations →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

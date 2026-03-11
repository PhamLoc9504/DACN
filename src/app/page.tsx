'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Tables } from "@/lib/supabaseClient";
import Link from 'next/link';
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Users,
  BarChart3,
  Calendar
} from "lucide-react";
import { motion } from 'framer-motion';

type KPI = {
  tongHangHoa: number;
  tongTonKho: number;
  doanhSoBanHang: number;      // Tổng giá trị bán ra (trừ đơn hủy)
  doanhThuThucTe: number;      // Đã thanh toán
  congNoKhachHang: number;     // Chưa thanh toán
};

export default function Home() {
  const [kpi, setKpi] = useState<KPI>({
    tongHangHoa: 0,
    tongTonKho: 0,
    doanhSoBanHang: 0,
    doanhThuThucTe: 0,
    congNoKhachHang: 0,
  });
  const [sapHet, setSapHet] = useState<Tables["HangHoa"][]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [flowData, setFlowData] = useState<{ month: string; xuat: number; nhap: number }[]>([]);
  const [revPie, setRevPie] = useState<{ name: string; value: number }[]>([]);
  const [topSelling, setTopSelling] = useState<{ mahh: string; tenhh?: string; qty: number; revenue: number }[]>([]);
  const [anomalyMeta, setAnomalyMeta] = useState<{ today: string; avgWindowDays: number; multiplier: number; minTodayQty: number } | null>(null);
  const [anomalyItems, setAnomalyItems] = useState<
    Array<{
      mahh: string;
      tenhh?: string;
      ton?: number | null;
      nhapToday: number;
      xuatToday: number;
      avgNhap7d: number;
      avgXuat7d: number;
      ratioNhap: number;
      ratioXuat: number;
      nhapHigh: boolean;
      xuatHigh: boolean;
    }>
  >([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<(typeof anomalyItems)[number] | null>(null);
  const [anomalyTab, setAnomalyTab] = useState<"info" | "history">("info");
  const [historyRows, setHistoryRows] = useState<
    Array<{ time: string; type: string; qty: number; ending?: number | null; actor?: string | null; ref?: string | null }>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const loadHistory = useCallback(
    async (mahh: string) => {
      try {
        setHistoryLoading(true);
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`/api/dashboard/item-history?mahh=${encodeURIComponent(mahh)}&limit=50&from=${today}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Tải lịch sử thất bại');
        setHistoryRows(data.data || []);
      } catch (err) {
        console.error('Load history error', err);
        setHistoryRows([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    []
  );
  const [dailyRevenue, setDailyRevenue] = useState<{ day: string; revenue: number }[]>([]);
  const [yearlyRevenue, setYearlyRevenue] = useState<{ year: string; revenue: number }[]>([]);
  const [revView, setRevView] = useState<'month' | 'day' | 'year'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const LOW_STOCK_THRESHOLD = 5;

  function parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatNumber(value: number | null | undefined) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("vi-VN") : "0";
  }

  function toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function formatDateTime(value: string | null | undefined) {
    if (!value) return "";
    const s = value.trim();
    const hasTZ = s.toUpperCase().includes("Z") || s.includes("+");
    const hasTime = s.includes("T") && /\d{2}:\d{2}/.test(s);

    // Chỉ ngày: trả về dd/mm/yyyy
    if (!hasTime && !hasTZ && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-");
      return `${d}/${m}/${y}`;
    }

    // Có giờ nhưng không có timezone: coi là giờ Việt Nam
    if (hasTime && !hasTZ) {
      const d = new Date(`${s}+07:00`);
      return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh" });
    }

    // Có timezone: hiển thị theo Asia/Ho_Chi_Minh
    const d = new Date(s);
    return Number.isNaN(d.getTime())
      ? value
      : d.toLocaleString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh" });
  }

  useEffect(() => {
    if (!selectedAnomaly) {
      setHistoryRows([]);
      return;
    }
    setAnomalyTab("info");
    // Khi mở modal, mặc định tab Info; nếu người dùng bấm "Xem lịch sử" sẽ gọi loadHistory
    setHistoryRows([]);
  }, [selectedAnomaly]);

  const loadDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Giới hạn để tránh query quá lớn gây 500 từ PostgREST
      const params = new URLSearchParams({ page: "1", limit: "1000" }).toString();

      const [hhRes, hdRes, topSellRes, anomalyRes] = await Promise.all([
        fetch(`/api/hang-hoa?${params}`, { credentials: "include" }).then((r) => r.json()),
        fetch(`/api/hoa-don?${params}`, { credentials: "include" }).then((r) => r.json()),
        fetch(`/api/dashboard/top-selling`, { credentials: "include" }).then((r) => r.json()),
        fetch(`/api/dashboard/item-anomalies`, { credentials: "include" }).then((r) => r.json()),
      ]);

      if (hhRes.error) {
        console.error('Lỗi tải hàng hóa:', hhRes.error);
        setIsRefreshing(false);
        return;
      }
      if (hdRes.error) {
        console.error('Lỗi tải hóa đơn:', hdRes.error);
      }

      const products = (hhRes.data || []) as Tables["HangHoa"][];
      const invoices = (hdRes.data || []) as Tables["HoaDon"][];

      const totalProducts = hhRes.total ?? products.length;
      const totalStock = products.reduce((sum, p) => sum + toNumber(p.SoLuongTon), 0);

      // Lấy tất cả hóa đơn có liên quan đến phiếu xuất / nhập
      const relatedInvoices = invoices.filter((inv) => inv.SoPX || inv.SoPN);
      const salesInvoices = relatedInvoices.filter((inv) => inv.SoPX);
      const purchaseInvoices = relatedInvoices.filter((inv) => inv.SoPN);
      const salesValid = salesInvoices.filter((inv) => inv.TrangThai !== "Đã hủy");
      const purchaseValid = purchaseInvoices.filter((inv) => inv.TrangThai !== "Đã hủy");
      const flowInvoices = relatedInvoices.filter((inv) => inv.TrangThai !== "Đã hủy");

      // 1. Doanh số bán hàng (trừ đơn hủy)
      const doanhSoBanHang = salesValid.reduce((sum, inv) => sum + toNumber(inv.TongTien), 0);

      // 2. Doanh thu thực tế (Đã thanh toán)
      const doanhThuThucTe = salesValid
        .filter((inv) => inv.TrangThai === "Đã thanh toán")
        .reduce((sum, inv) => sum + toNumber(inv.TongTien), 0);

      // 3. Công nợ khách hàng (Chưa thanh toán)
      const congNoKhachHang = salesValid
        .filter((inv) => inv.TrangThai === "Chưa thanh toán")
        .reduce((sum, inv) => sum + toNumber(inv.TongTien), 0);

      setKpi({
        tongHangHoa: totalProducts,
        tongTonKho: totalStock,
        doanhSoBanHang,
        doanhThuThucTe,
        congNoKhachHang,
      });

      const lowStock = products
        .filter((p) => toNumber(p.SoLuongTon) <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => toNumber(a.SoLuongTon) - toNumber(b.SoLuongTon))
        .slice(0, 50);
      setSapHet(lowStock);

      const monthMap = new Map<string, number>();
      const dayMap = new Map<string, number>();
      const yearMap = new Map<string, number>();

      for (const inv of salesValid) {
        const d = parseDate(inv.NgayLap as any);
        if (!d) continue;
        const amount = toNumber(inv.TongTien);
        if (!amount) continue;

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const monthKey = `${y}-${m}`;
        const dayKey = `${y}-${m}-${day}`;
        const yearKey = String(y);

        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount);
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + amount);
        yearMap.set(yearKey, (yearMap.get(yearKey) || 0) + amount);
      }

      const monthData = Array.from(monthMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, revenue]) => {
          const [y, m] = key.split("-");
          return { month: `${m}/${y}`, revenue };
        });

      const dayEntries = Array.from(dayMap.entries()).map(([key, revenue]) => ({
        key,
        date: new Date(key),
        revenue,
      }));
      dayEntries.sort((a, b) => a.date.getTime() - b.date.getTime());
      const lastDays = dayEntries.slice(-14).map((d) => ({
        day: d.date.toLocaleDateString("vi-VN"),
        revenue: d.revenue,
      }));

      const yearData = Array.from(yearMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([year, revenue]) => ({ year, revenue }));

      setRevenueData(monthData);
      setDailyRevenue(lastDays);
      setYearlyRevenue(yearData);

      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 6);

      const flowMap = new Map<string, { nhap: number; xuat: number }>();
      for (const inv of flowInvoices) {
        const d = parseDate(inv.NgayLap as any);
        if (!d || d < start) continue;
        const key = d.toISOString().slice(0, 10);
        const rec = flowMap.get(key) || { nhap: 0, xuat: 0 };
        const amount = toNumber(inv.TongTien);
        if (inv.SoPX) rec.xuat += amount;
        if (inv.SoPN) rec.nhap += amount;
        flowMap.set(key, rec);
      }

      const flowArr = Array.from(flowMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, v]) => ({
          month: new Date(key).toLocaleDateString("vi-VN", { day: 'numeric', month: 'short' }),
          xuat: v.xuat,
          nhap: v.nhap,
        }));
      setFlowData(flowArr);

      const totalExport = salesValid.reduce((s, i) => s + toNumber(i.TongTien), 0);
      const totalImport = purchaseValid.reduce((s, i) => s + toNumber(i.TongTien), 0);
      setRevPie([
        { name: "Doanh thu bán hàng", value: totalExport },
        { name: "Tổng giá trị hóa đơn nhập", value: totalImport },
      ]);

      if (!topSellRes.error) {
        setTopSelling(topSellRes.data || []);
      }
      if (!anomalyRes.error) {
        setAnomalyMeta(anomalyRes.meta || null);
        setAnomalyItems(anomalyRes.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu dashboard:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refreshData = () => {
    loadDashboard();
  };
  // =========================
  // KPI meta được tính từ dữ liệu thật
  // =========================

  const revenueStats = useMemo(() => {
    if (!revenueData || revenueData.length < 2) {
      return { changeLabel: "—", trend: "neutral" as const };
    }
    const lastTwo = revenueData.slice(-2);
    const prev = lastTwo[0].revenue || 0;
    const curr = lastTwo[1].revenue || 0;
    if (!prev || !Number.isFinite(prev)) {
      return { changeLabel: "—", trend: "neutral" as const };
    }
    const pct = ((curr - prev) / prev) * 100;
    if (!Number.isFinite(pct)) {
      return { changeLabel: "—", trend: "neutral" as const };
    }
    const trend = pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("neutral" as const);
    const changeLabel = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
    return { changeLabel, trend };
  }, [revenueData]);

  const stockStats = useMemo(() => {
    const exportValue = revPie[0]?.value || 0; // Doanh thu bán hàng
    const importValue = revPie[1]?.value || 0; // Giá trị hóa đơn nhập

    if (!exportValue && !importValue) {
      return { label: "Chưa có giao dịch", trend: "neutral" as const };
    }
    if (importValue > exportValue) {
      return { label: "Nhập > Xuất", trend: "up" as const };
    }
    if (importValue < exportValue) {
      return { label: "Xuất > Nhập", trend: "down" as const };
    }
    return { label: "Cân bằng", trend: "neutral" as const };
  }, [revPie]);

  const kpiCards = [
    {
      title: "Tổng Doanh Số",
      value: `₫${(kpi.doanhSoBanHang / 1000000).toFixed(1)}M`,
      // Hiển thị thêm thông tin: Đã thu / Còn nợ
      change: `Thu: ₫${(kpi.doanhThuThucTe / 1000000).toFixed(1)}M • Nợ: ₫${(kpi.congNoKhachHang / 1000000).toFixed(1)}M`,
      trend: revenueStats.trend,
      icon: <DollarSign className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Tổng Tồn Kho",
      value: kpi.tongTonKho.toLocaleString(),
      change: stockStats.label,
      trend: stockStats.trend,
      icon: <Package className="w-5 h-5" />,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200"
    },
    {
      title: "Mặt Hàng",
      value: kpi.tongHangHoa.toLocaleString(),
      change: kpi.tongHangHoa > 0 ? "Hiện tại" : "—",
      trend: "neutral",
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
      borderColor: "border-violet-200"
    },
    {
      title: "Cần Nhập Hàng",
      value: sapHet.length.toString(),
      change: sapHet.length > 5 ? "Cần xử lý" : "Ổn định",
      trend: sapHet.length > 5 ? "down" : "up",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
      borderColor: "border-amber-200"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5fb] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Quản Lý Kho</h1>
            <p className="text-gray-600 mt-1">
              Tổng quan hiệu suất kinh doanh và quản lý kho theo thời gian thực
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Hôm nay</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={refreshData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""} text-gray-600`} />
              <span className="text-sm font-medium text-gray-700">Cập nhật</span>
            </motion.button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.07 }}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className={`p-2 rounded-lg ${card.bgColor} inline-block`}>
                    <div className={`text-white p-1.5 rounded-md bg-gradient-to-br ${card.color}`}>
                      {card.icon}
                    </div>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    card.trend === "up"
                      ? "bg-green-50 text-green-700"
                      : card.trend === "down"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-50 text-gray-700"
                  }`}
                >
                  {card.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : card.trend === "down" ? (
                    <ArrowDownRight className="w-3 h-3" />
                  ) : null}
                  {card.change}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart - full width */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Phân Tích Doanh Thu</h2>
              <p className="text-sm text-gray-500">Xu hướng doanh thu theo ngày, tháng, năm</p>
            </div>
            <div className="flex items-center gap-2">
              {["day", "month", "year"].map((period) => (
                <button
                  key={period}
                  onClick={() => setRevView(period as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    revView === period
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {period === "day" ? "Ngày" : period === "month" ? "Tháng" : "Năm"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revView === "month" ? revenueData : revView === "day" ? dailyRevenue : yearlyRevenue as any}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey={revView === "month" ? "month" : revView === "day" ? "day" : "year"}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(v) => `₫${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")} ₫`, "Doanh thu"]}
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle row: Revenue distribution + Cash flow + Top selling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1">So sánh Doanh thu vs Tổng giá trị nhập</h2>
            <div className="h-2" />

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ percent }) => `${((percent as number) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {revPie.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#10b981" : "#f59e0b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${Number(value).toLocaleString("vi-VN")} ₫`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              {revPie.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: index === 0 ? "#10b981" : "#f59e0b" }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {(item.value / 1000000).toFixed(1)}M ₫
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Flow */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1">Luồng Tiền (7 ngày)</h2>
            <p className="text-sm text-gray-500 mb-4">So sánh nhập và xuất theo ngày</p>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickFormatter={(v) => `₫${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value: any, _name: any, item: any) => [
                      `${Number(value).toLocaleString("vi-VN")} ₫`,
                      item?.dataKey === "nhap" ? "Nhập hàng" : "Xuất hàng",
                    ]}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Bar
                    name="Xuất hàng"
                    dataKey="xuat"
                    fill="#10b981"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar
                    name="Nhập hàng"
                    dataKey="nhap"
                    fill="#8b5cf6"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#10b981]" />
                <span>Xuất hàng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#8b5cf6]" />
                <span>Nhập hàng</span>
              </div>
            </div>
          </div>

          {/* Top Selling */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Sản Phẩm Bán Chạy</h2>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                  Top {Math.min(topSelling.length, 5)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Theo doanh thu và số lượng</p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {topSelling.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {topSelling.slice(0, 5).map((product) => (
                    <Link
                      key={product.mahh}
                      href={`/hang-hoa?q=${encodeURIComponent(product.mahh)}&page=1&limit=10`}
                      className="block p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{product.mahh}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {product.tenhh || product.mahh}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-blue-600 whitespace-nowrap">
                          {(product.revenue / 1000000).toFixed(1)}M ₫
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Đã bán: {product.qty.toLocaleString()}</span>
                        <span>Doanh thu: {(product.revenue / 1000000).toFixed(1)}M</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có dữ liệu bán hàng</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: Low stock + anomalies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <Link href="/hang-hoa?lowStock=1" className="font-semibold text-gray-900 hover:underline">Hàng Sắp Hết</Link>
                </div>
                <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded">
                  {sapHet.length} mặt hàng
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mặt hàng có tồn kho thấp (≤ 5)</p>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {sapHet.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {sapHet.slice(0, 5).map((item) => (
                    <Link
                      key={item.MaHH}
                      href={`/hang-hoa?q=${encodeURIComponent(item.MaHH)}&page=1&limit=10&lowStock=1`}
                      className="block p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{item.MaHH}</span>
                            <span className="text-xs text-gray-500 truncate">{item.TenHH}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            (item.SoLuongTon || 0) <= 2
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.SoLuongTon || 0}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Không có hàng sắp hết</p>
                </div>
              )}
            </div>
          </div>

          {/* Anomalies */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  </div>
                  <h2 className="font-semibold text-gray-900">Hoạt Động Bất Thường</h2>
                </div>
                <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded">
                  {anomalyItems.length} cảnh báo
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cảnh báo theo ngưỡng động (7 ngày gần nhất); xem chi tiết trong modal. Lịch sử hiển thị tối đa 50 dòng.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {anomalyItems.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {anomalyItems.slice(0, 5).map((item) => (
                    <button
                      key={item.mahh}
                      type="button"
                      onClick={() => setSelectedAnomaly(item)}
                      className="block w-full text-left p-3 hover:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{item.mahh}</span>
                            <span className="text-xs text-gray-500 truncate">
                              {item.tenhh || item.mahh}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Tồn: {(item.ton ?? 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 space-y-1">
                            {item.nhapHigh && (
                              <div>Nhập: {item.nhapToday.toLocaleString()} (TB7: {item.avgNhap7d.toFixed(1)} | {item.ratioNhap.toFixed(1)}x)</div>
                            )}
                            {item.xuatHigh && (
                              <div>Xuất: {item.xuatToday.toLocaleString()} (TB7: {item.avgXuat7d.toFixed(1)} | {item.ratioXuat.toFixed(1)}x)</div>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded whitespace-nowrap">
                          {item.nhapHigh && item.xuatHigh
                            ? "Cả hai"
                            : item.xuatHigh
                            ? "Xuất cao"
                            : "Nhập cao"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Không có hoạt động bất thường</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Tổng doanh thu: {(kpi.doanhSoBanHang / 1000000).toFixed(1)}M ₫</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span>Tổng tồn kho: {kpi.tongTonKho.toLocaleString()} sản phẩm</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-violet-500 rounded-full" />
              <span>Cảnh báo: {sapHet.length + anomalyItems.length} sự kiện</span>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly detail modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5">
            {(() => {
              const isNhap = selectedAnomaly.nhapHigh;
              const isXuat = selectedAnomaly.xuatHigh;
              const badgeColor = isNhap && isXuat ? "bg-gradient-to-r from-blue-500 to-amber-500" : isNhap ? "bg-blue-500" : "bg-amber-500";
              const badgeText = isNhap && isXuat ? "Nhập & Xuất bất thường" : isNhap ? "Nhập bất thường" : "Xuất bất thường";
              return (
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${badgeColor}`}>
                      {badgeText}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mt-2">
                      Cảnh báo bất thường - {selectedAnomaly.mahh} {selectedAnomaly.tenhh || ""}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAnomaly(null)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Đóng
                  </button>
                </div>
              );
            })()}

            {/* Tabs */}
            <div className="mt-3 flex items-center gap-2 text-sm">
              {[
                { key: "info", label: "Thông tin chung" },
                { key: "history", label: "Thẻ kho / Lịch sử" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={async () => {
                    setAnomalyTab(tab.key as any);
                    if (tab.key === "history" && selectedAnomaly) {
                      await loadHistory(selectedAnomaly.mahh);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    anomalyTab === tab.key
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {anomalyTab === "info" && (
              <div className="mt-3 space-y-3 text-sm text-gray-800">
                <div>
                  <span className="text-gray-600">Tồn kho hiện tại: </span>
                  <span className="font-semibold">{formatNumber(selectedAnomaly.ton ?? 0)}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-gray-600">Vấn đề:</div>
                  {selectedAnomaly.nhapHigh && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-800">
                      Nhập kho đột biến
                      <div className="mt-1 text-gray-700">
                        <div>Hôm nay nhập: <span className="font-semibold">{formatNumber(selectedAnomaly.nhapToday)}</span></div>
                        <div>Trung bình 7 ngày qua: <span className="font-semibold">{selectedAnomaly.avgNhap7d.toFixed(1)}</span></div>
                        <div className="mt-1 text-sm">Cao gấp {selectedAnomaly.ratioNhap.toFixed(1)} lần mức bình thường.</div>
                      </div>
                    </div>
                  )}
                  {selectedAnomaly.xuatHigh && (
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-amber-800">
                      Xuất kho đột biến
                      <div className="mt-1 text-gray-700">
                        <div>Hôm nay xuất: <span className="font-semibold">{formatNumber(selectedAnomaly.xuatToday)}</span></div>
                        <div>Trung bình 7 ngày qua: <span className="font-semibold">{selectedAnomaly.avgXuat7d.toFixed(1)}</span></div>
                        <div className="mt-1 text-sm">Cao gấp {selectedAnomaly.ratioXuat.toFixed(1)} lần mức bình thường.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {anomalyTab === "history" && (
              <div className="mt-4">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 bg-gray-50 text-gray-600 text-xs font-semibold px-3 py-2">
                    <div>Thời gian</div>
                    <div>Loại</div>
                    <div className="text-right">SL</div>
                    <div className="text-right">Tồn cuối</div>
                    <div>Người thực hiện</div>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                    {historyLoading ? (
                      <div className="px-3 py-3 text-sm text-gray-500">Đang tải lịch sử...</div>
                    ) : historyRows.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-gray-500">Chưa có dữ liệu lịch sử.</div>
                    ) : (
                      historyRows
                        .filter((row) => {
                          const meta: any = anomalyMeta || {};
                          const minNhap = meta.minNhapQty ?? 20;
                          const minXuat = meta.minXuatQty ?? 20;
                          const hardXuat = meta.hardXuatQty ?? 50;
                          if (selectedAnomaly?.nhapHigh && !selectedAnomaly?.xuatHigh) {
                            return row.qty > 0 && row.qty >= minNhap;
                          }
                          if (selectedAnomaly?.xuatHigh && !selectedAnomaly?.nhapHigh) {
                            const abs = Math.abs(row.qty);
                            return row.qty < 0 && (abs >= hardXuat || abs >= minXuat);
                          }
                          // cả hai: áp dụng ngưỡng riêng cho nhập/xuất
                          if (row.qty > 0) return row.qty >= minNhap;
                          const abs = Math.abs(row.qty);
                          return abs >= hardXuat || abs >= minXuat;
                        })
                        .map((row, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-5 items-center px-3 py-2 text-sm text-gray-800"
                        >
                          <div className="text-xs text-gray-600">{formatDateTime(row.time)}</div>
                          <div>{row.type}</div>
                          <div
                            className={`text-right font-semibold ${
                              row.qty > 0
                                ? 'text-emerald-700'
                                : 'text-red-600'
                            }`}
                          >
                            {row.qty > 0 ? `+${row.qty}` : row.qty}
                          </div>
                          <div className="text-right">
                            {row.ending == null ? '—' : formatNumber(row.ending)}
                          </div>
                          <div className="text-xs text-gray-600">{row.actor || "—"}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={async () => {
                  setAnomalyTab("history");
                  if (selectedAnomaly) {
                    await loadHistory(selectedAnomaly.mahh);
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Xem lịch sử giao dịch mã này
              </button>
              <button
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
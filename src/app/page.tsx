"use client";
import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabaseClient";
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
  AreaChart,
  Area,
} from "recharts";
import { ChartPie, Package2, DollarSign, AlertTriangle } from "lucide-react";

type KPI = {
  tongHangHoa: number;
  tongTonKho: number;
  tongDoanhThu: number;
};

export default function Home() {
  const [kpi, setKpi] = useState<KPI>({
    tongHangHoa: 0,
    tongTonKho: 0,
    tongDoanhThu: 0,
  });
  const [sapHet, setSapHet] = useState<Tables["HangHoa"][]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [flowData, setFlowData] = useState<{ month: string; xuat: number; nhap: number }[]>([]);
  const [revPie, setRevPie] = useState<{ name: string; value: number }[]>([]);
  const [topSelling, setTopSelling] = useState<{ mahh: string; tenhh?: string; qty: number; revenue: number }[]>([]);
  const [anomalyItems, setAnomalyItems] = useState<Array<{ mahh: string; tenhh?: string; ton?: number | null; nhap: number; xuat: number; nhapHigh: boolean; xuatHigh: boolean }>>([]);
  const [dailyRevenue, setDailyRevenue] = useState<{ day: string; revenue: number }[]>([]);
  const [yearlyRevenue, setYearlyRevenue] = useState<{ year: string; revenue: number }[]>([]);
  const [revView, setRevView] = useState<'month' | 'day' | 'year'>('month');
  const idleThreshold = 1_000_000; // 1M VND ~ gần như không có giao dịch

  useEffect(() => {
    async function load() {
      const [hhRes, hdRes, topRes, anomalyRes] = await Promise.all([
        fetch("/api/hang-hoa").then((r) => r.json()),
        fetch(`/api/hoa-don?status=${encodeURIComponent('Đã thanh toán')}&limit=10000&page=1`).then((r) => r.json()),
        fetch('/api/dashboard/top-selling').then((r) => r.json()).catch(() => null),
        fetch('/api/dashboard/item-anomalies').then((r) => r.json()).catch(() => null),
      ]);

      const hang = (hhRes.data || []) as Tables["HangHoa"][];
      const invoices = (hdRes.data || []) as Tables["HoaDon"][];
      const tongHangHoa = hang.length;
      const tongTonKho = hang.reduce((s, x) => s + (x.SoLuongTon || 0), 0);
      const tongDoanhThu = invoices.reduce((s, x) => {
        if (x.SoPX) return s + (x.TongTien || 0);
        if (x.SoPN) return s - (x.TongTien || 0);
        return s + (x.TongTien || 0);
      }, 0);
      setKpi({ tongHangHoa, tongTonKho, tongDoanhThu });
      setSapHet(hang.filter((x) => (x.SoLuongTon || 0) <= 5));

      // Doanh thu theo tháng
      const monthMap = new Map<string, number>();
      const monthNhap = new Map<string, number>();
      const monthXuat = new Map<string, number>();
      for (const inv of invoices) {
        if (!inv.NgayLap) continue;
        const d = new Date(inv.NgayLap);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) || 0) + (inv.TongTien || 0));
        if (inv.SoPX) monthXuat.set(key, (monthXuat.get(key) || 0) + (inv.TongTien || 0));
        if (inv.SoPN) monthNhap.set(key, (monthNhap.get(key) || 0) + (inv.TongTien || 0));
      }
      const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      // Lấy tối đa 6 tháng gần nhất để hiển thị
      const last6 = sorted.slice(-6);
      const formatted = last6.map(([key, total]) => {
        const [year, month] = key.split("-");
        return { month: `T${parseInt(month, 10)}/${year.slice(-2)}`, revenue: total };
      });
      setRevenueData(formatted);

      // Dòng tiền nhập/xuất theo ngày (7 ngày gần nhất)
      const dayFlowMap = new Map<string, { xuat: number; nhap: number }>();
      for (const inv of invoices) {
        if (!inv.NgayLap) continue;
        const d = new Date(inv.NgayLap);
        if (isNaN(d.getTime())) continue;
        const key = d.toISOString().slice(0, 10); // yyyy-mm-dd
        const current = dayFlowMap.get(key) || { xuat: 0, nhap: 0 };
        if (inv.SoPX) current.xuat += inv.TongTien || 0;
        if (inv.SoPN) current.nhap += inv.TongTien || 0;
        dayFlowMap.set(key, current);
      }
      const flowDaysSorted = Array.from(dayFlowMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const last7Flow = flowDaysSorted.slice(-7).map(([date, v]) => ({
        month: date.slice(5),
        xuat: v.xuat,
        nhap: v.nhap,
      }));
      setFlowData(last7Flow);

      // Tỷ trọng doanh thu (Xuất) vs chi phí (Nhập)
      const sumXuat = Array.from(monthXuat.values()).reduce((s, v) => s + v, 0);
      const sumNhap = Array.from(monthNhap.values()).reduce((s, v) => s + v, 0);
      setRevPie([
        { name: "Xuất (Doanh thu)", value: sumXuat },
        { name: "Nhập (Chi phí)", value: sumNhap },
      ]);

      // Top selling & customer group
      if (topRes?.data) setTopSelling(topRes.data);
      if (anomalyRes?.data) setAnomalyItems(anomalyRes.data);

      // Doanh thu theo ngày (30 ngày gần nhất)
      const dayMap = new Map<string, number>();
      for (const inv of invoices) {
        if (!inv.NgayLap) continue;
        const d = new Date(inv.NgayLap);
        if (isNaN(d.getTime())) continue;
        const key = d.toISOString().slice(0,10);
        dayMap.set(key, (dayMap.get(key) || 0) + (inv.TongTien || 0));
      }
      const daysSorted = Array.from(dayMap.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
      const last30 = daysSorted.slice(-30).map(([k,v])=>({ day: k.slice(5), revenue: v }));
      setDailyRevenue(last30);

      // Doanh thu theo năm
      const yearMap = new Map<string, number>();
      for (const inv of invoices) {
        if (!inv.NgayLap) continue;
        const d = new Date(inv.NgayLap);
        if (isNaN(d.getTime())) continue;
        const y = String(d.getFullYear());
        yearMap.set(y, (yearMap.get(y) || 0) + (inv.TongTien || 0));
      }
      const years = Array.from(yearMap.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([year, revenue])=>({ year, revenue }));
      setYearlyRevenue(years);
    }
    load();
  }, []);

  const summaryCards = [
    {
      key: "revenue-total",
      label: "Tổng doanh thu",
      value: kpi.tongDoanhThu.toLocaleString("vi-VN"),
      hint: "Tất cả hóa đơn đã thanh toán",
      color: "bg-sky-500",
      icon: <DollarSign className="w-7 h-7 text-white" />,
    },
    {
      key: "stock-qty",
      label: "Tổng tồn kho",
      value: kpi.tongTonKho.toLocaleString("vi-VN"),
      hint: "Số lượng tồn hiện tại",
      color: "bg-emerald-500",
      icon: <Package2 className="w-7 h-7 text-white" />,
    },
    {
      key: "items-count",
      label: "Số mặt hàng",
      value: kpi.tongHangHoa.toLocaleString("vi-VN"),
      hint: "Mặt hàng đang được quản lý",
      color: "bg-amber-500",
      icon: <ChartPie className="w-7 h-7 text-white" />,
    },
    {
      key: "low-stock",
      label: "Hàng sắp hết",
      value: sapHet.length.toLocaleString("vi-VN"),
      hint: "Cần nhập thêm / kiểm tra",
      color: "bg-rose-500",
      icon: <AlertTriangle className="w-7 h-7 text-white" />,
    },
  ];

  return (
    <div className="space-y-6 min-w-0">
      {/* Hàng trên: tổng quan doanh thu kiểu AdminLTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
        {summaryCards.map((card) => (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-md shadow-sm text-white ${card.color}`}
          >
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80 font-semibold">
                  {card.label}
                </div>
                <div className="mt-2 text-3xl font-semibold leading-tight">
                  {card.value}
                </div>
                <div className="mt-1 text-[11px] text-white/80">
                  {card.hint}
                </div>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/10">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hàng 2: Doanh thu & Tỷ trọng */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-w-0">
        <div className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-slate-800">
              Doanh thu theo{" "}
              {revView === "month" ? "tháng" : revView === "day" ? "ngày" : "năm"}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500">Chế độ hiển thị</div>
              <select
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none"
                value={revView}
                onChange={(e) => setRevView(e.target.value as any)}
              >
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
            </div>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height={256} minWidth={0}>
              <LineChart
                data={
                  revView === "month"
                    ? revenueData
                    : revView === "day"
                    ? dailyRevenue
                    : yearlyRevenue
                }
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey={revView === "month" ? "month" : revView === "day" ? "day" : "year"}
                  stroke="#94A3B8"
                />
                <YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1_000_000}M`} />
                <Tooltip formatter={(value: number) => `${Number(value).toLocaleString("vi-VN")} VNĐ`} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm min-w-0">
          <div className="font-semibold text-slate-800 mb-3">
            Tỷ trọng Doanh thu vs Chi phí
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height={256} minWidth={0}>
              <PieChart>
                <Pie
                  data={revPie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={60}
                  paddingAngle={3}
                >
                  {revPie.map((_, i) => (
                    <Cell key={i} fill={["#22c55e", "#f97316"][i % 2]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value: number) => `${Number(value).toLocaleString("vi-VN")} VNĐ`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hàng 3: Tồn kho rủi ro & Bất thường */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <div className="rounded-lg border bg-white p-5 shadow-sm min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div className="font-semibold text-slate-800">Cảnh báo: Hàng sắp hết</div>
            </div>
            <div className="text-xs text-slate-500">
              Tổng {sapHet.length.toLocaleString("vi-VN")} mặt hàng
            </div>
          </div>
          <div className="mt-2 overflow-auto h-60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-slate-50/80 text-slate-600">
                  <th className="py-2 pl-3 pr-4 font-medium">Mã HH</th>
                  <th className="py-2 pr-4 font-medium">Tên hàng</th>
                  <th className="py-2 pr-3 text-right font-medium">Tồn</th>
                </tr>
              </thead>
              <tbody>
                {sapHet.length > 0 ? (
                  sapHet.map((r) => {
                    const stock = r.SoLuongTon || 0;
                    const stockClass =
                      stock <= 2
                        ? "bg-rose-100 text-rose-700 border-rose-200"
                        : "bg-amber-100 text-amber-700 border-amber-200";
                    return (
                      <tr key={r.MaHH} className="border-b last:border-0 hover:bg-slate-50/60 transition">
                        <td className="py-2 pl-3 pr-4 font-medium text-slate-700">{r.MaHH}</td>
                        <td className="py-2 pr-4 text-slate-600 truncate">{r.TenHH}</td>
                        <td className="py-2 pr-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${stockClass}`}
                          >
                            {stock <= 2 ? "⚠️" : "⛅"} {stock}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8">
                      <div className="flex items-center justify-center gap-3 text-slate-500">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                          ✓
                        </span>
                        <span>Không có cảnh báo tồn kho</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <div className="font-semibold text-slate-800">
                  Cảnh báo mặt hàng nhập/xuất bất thường
                </div>
                <div className="text-xs text-slate-500">
                  So sánh với mức trung bình toàn kho
                </div>
              </div>
            </div>
          </div>
          <div className="h-60 w-full min-w-0 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-slate-50/80 text-slate-600">
                  <th className="py-2 pl-3 pr-2 font-medium">Mã HH</th>
                  <th className="py-2 pr-2 font-medium">Tên hàng</th>
                  <th className="py-2 pr-2 font-medium text-right">Tồn</th>
                  <th className="py-2 pr-3 font-medium text-right">Cảnh báo</th>
                </tr>
              </thead>
              <tbody>
                {anomalyItems.length > 0 ? (
                  anomalyItems.map((r) => (
                    <tr key={r.mahh} className="border-b last:border-0 hover:bg-slate-50/60 transition">
                      <td className="py-2 pl-3 pr-2 font-medium text-slate-700">{r.mahh}</td>
                      <td className="py-2 pr-2 text-slate-600 truncate">{r.tenhh || r.mahh}</td>
                      <td className="py-2 pr-2 text-right text-slate-700">
                        {(r.ton ?? 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {r.xuatHigh && r.nhapHigh
                            ? "Nhập & xuất rất cao"
                            : r.xuatHigh
                            ? "Xuất nhiều bất thường"
                            : r.nhapHigh
                            ? "Nhập nhiều bất thường"
                            : "Bất thường"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500 text-sm">
                      Không có mặt hàng nào nhập/xuất bất thường.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hàng 4: Top bán chạy & Dòng tiền 6 tháng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <div className="rounded-lg border bg-white p-5 shadow-sm min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-500 text-lg">
                🏆
              </span>
              <div>
                <div className="font-semibold text-slate-800">Top sản phẩm bán chạy</div>
                <div className="text-xs text-slate-500">Theo số lượng xuất</div>
              </div>
            </div>
          </div>
          <div className="overflow-auto h-60">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-slate-50/80 text-slate-600">
                  <th className="py-2 pl-3 pr-4 font-medium">Mã HH</th>
                  <th className="py-2 pr-4 font-medium">Tên hàng</th>
                  <th className="py-2 pr-4 font-medium text-right">Đã bán</th>
                  <th className="py-2 pr-3 font-medium text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {topSelling.map((r) => (
                  <tr key={r.mahh} className="border-b last:border-0 hover:bg-slate-50/60 transition">
                    <td className="py-2 pl-3 pr-4 font-medium text-slate-700">{r.mahh}</td>
                    <td className="py-2 pr-4 text-slate-600 truncate">{r.tenhh || r.mahh}</td>
                    <td className="py-2 pr-4 text-right">
                      {r.qty.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2 pr-3 text-right text-sky-600 font-semibold">
                      {r.revenue.toLocaleString("vi-VN")} ₫
                    </td>
                  </tr>
                ))}
                {topSelling.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={4}>
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm lg:col-span-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-semibold text-slate-800">
                Trị giá nhập / xuất (7 ngày gần nhất)
              </div>
              {flowData.some((m) => Math.abs(m.xuat) + Math.abs(m.nhap) < idleThreshold) && (
                <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    Một số tháng trị giá nhập/xuất rất thấp – cần xem lại các mặt hàng ít luân chuyển.
                  </span>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500">Theo hóa đơn đã thanh toán</div>
          </div>
          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <AreaChart data={flowData} stackOffset="none">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1_000_000}M`} />
                <Tooltip formatter={(value: number) => `${(value as number).toLocaleString("vi-VN")} VNĐ`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="nhap"
                  name="Nhập"
                  stroke="#cbd5f5"
                  strokeWidth={2}
                  fill="#e5e7eb"
                  fillOpacity={0.8}
                  activeDot={false}
                />
                <Area
                  type="monotone"
                  dataKey="xuat"
                  name="Xuất"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="#38bdf8"
                  fillOpacity={0.7}
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

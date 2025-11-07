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
  const [custGroup, setCustGroup] = useState<{ name: string; value: number }[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<{ day: string; revenue: number }[]>([]);
  const [yearlyRevenue, setYearlyRevenue] = useState<{ year: string; revenue: number }[]>([]);
  const [revView, setRevView] = useState<'month' | 'day' | 'year'>('month');

  useEffect(() => {
    async function load() {
      const [hhRes, hdRes, topRes, custRes] = await Promise.all([
        fetch("/api/hang-hoa").then((r) => r.json()),
        fetch(`/api/hoa-don?status=${encodeURIComponent('Đã thanh toán')}&limit=10000&page=1`).then((r) => r.json()),
        fetch('/api/dashboard/top-selling').then((r) => r.json()).catch(() => null),
        fetch('/api/dashboard/customers-by-group').then((r) => r.json()).catch(() => null),
      ]);

      const hang = (hhRes.data || []) as Tables["HangHoa"][];
      const invoices = (hdRes.data || []) as Tables["HoaDon"][];
      const tongHangHoa = hang.length;
      const tongTonKho = hang.reduce((s, x) => s + (x.SoLuongTon || 0), 0);
      const tongDoanhThu = invoices.reduce((s, x) => s + (x.TongTien || 0), 0);
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

      // Dòng tiền nhập/xuất theo tháng (6 tháng gần nhất)
      const last6Keys = last6.map(([k]) => k);
      const flow = last6Keys.map((k) => {
        const [year, month] = k.split("-");
        const label = `T${parseInt(month, 10)}/${year.slice(-2)}`;
        return {
          month: label,
          xuat: monthXuat.get(k) || 0,
          nhap: monthNhap.get(k) || 0,
        };
      });
      setFlowData(flow);

      // Tỷ trọng doanh thu (Xuất) vs chi phí (Nhập)
      const sumXuat = Array.from(monthXuat.values()).reduce((s, v) => s + v, 0);
      const sumNhap = Array.from(monthNhap.values()).reduce((s, v) => s + v, 0);
      setRevPie([
        { name: "Xuất (Doanh thu)", value: sumXuat },
        { name: "Nhập (Chi phí)", value: sumNhap },
      ]);

      // Top selling & customer group
      if (topRes?.data) setTopSelling(topRes.data);
      if (custRes?.data) setCustGroup(custRes.data);

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


  return (
    <div className="space-y-8 min-w-0">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        {[
          {
            label: "Tổng số hàng hóa",
            value: kpi.tongHangHoa,
            icon: <Package2 className="w-6 h-6 text-sky-600" />,
            gradient: "from-sky-50 to-blue-50",
          },
          {
            label: "Tổng tồn kho",
            value: kpi.tongTonKho,
            icon: <ChartPie className="w-6 h-6 text-indigo-600" />,
            gradient: "from-indigo-50 to-blue-50",
          },
          {
            label: "Doanh thu (VNĐ)",
            value: kpi.tongDoanhThu.toLocaleString("vi-VN"),
            icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
            gradient: "from-emerald-50 to-teal-50",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`rounded-2xl border bg-gradient-to-br ${card.gradient} p-5 shadow-sm hover:shadow-md transition-shadow min-h-[92px]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">{card.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-800">
                  {card.value}
                </div>
              </div>
              <div className="p-3 rounded-full bg-white/70 shadow-inner">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Revenue chart + Stock warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-slate-800">📊 Doanh thu theo {revView === 'month' ? 'tháng' : revView === 'day' ? 'ngày' : 'năm'}</div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500">Cập nhật gần đây</div>
              <select
                className="bg-[#fce7ec] border border-[#f9dfe3] rounded-lg px-2 py-1 text-xs text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none"
                value={revView}
                onChange={(e) => setRevView(e.target.value as any)}
              >
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
            </div>
          </div>
          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <LineChart data={revView === 'month' ? revenueData : revView === 'day' ? dailyRevenue : yearlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey={revView === 'month' ? 'month' : revView === 'day' ? 'day' : 'year'} stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip formatter={(value: number) => `${Number(value).toLocaleString('vi-VN')} VNĐ`} />
                <Line type="monotone" dataKey="revenue" stroke="#0EA5E9" strokeWidth={2.2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm min-w-0">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cảnh báo: Hàng sắp hết
          </div>
          <div className="mt-4 overflow-auto h-60">
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
            stock <= 2 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200';
          return (
            <tr key={r.MaHH} className="border-b last:border-0 hover:bg-slate-50/60 transition">
              <td className="py-2 pl-3 pr-4 font-medium text-slate-700">{r.MaHH}</td>
              <td className="py-2 pr-4 text-slate-600 truncate">{r.TenHH}</td>
              <td className="py-2 pr-3 text-right">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${stockClass}`}>
                  {stock <= 2 ? '⚠️' : '⛅'} {stock}
                </span>
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan={3} className="py-8">
            <div className="flex items-center justify-center gap-3 text-slate-500">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">✓</span>
              <span>Không có cảnh báo tồn kho</span>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
        </div>
      </div>

      {/* Row 2: Flow line + Revenue/Cost pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-slate-800">📈 Dòng tiền nhập / xuất (6 tháng)</div>
            <div className="text-xs text-slate-500">Theo hóa đơn đã thanh toán</div>
          </div>
          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <LineChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')} VNĐ`} />
                <Legend />
                <Line type="monotone" dataKey="xuat" name="Xuất" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="nhap" name="Nhập" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm min-w-0">
          <div className="font-semibold text-slate-800">🧮 Tỷ trọng Doanh thu vs Chi phí</div>
          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <PieChart>
                <Pie data={revPie} dataKey="value" nameKey="name" outerRadius={90} innerRadius={60} paddingAngle={3}>
                  {revPie.map((_, i) => (
                    <Cell key={i} fill={["#22c55e", "#f97316"][i % 2]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value: number) => `${Number(value).toLocaleString('vi-VN')} VNĐ`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Top selling + Customers by region */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-slate-800">🏆 Top sản phẩm bán chạy</div>
            <div className="text-xs text-slate-500">Theo số lượng xuất</div>
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
                  <tr key={r.mahh} className="border-b last:border-0">
                    <td className="py-2 pl-3 pr-4 font-medium text-slate-700">{r.mahh}</td>
                    <td className="py-2 pr-4 text-slate-600 truncate">{r.tenhh || r.mahh}</td>
                    <td className="py-2 pr-4 text-right">{r.qty.toLocaleString('vi-VN')}</td>
                    <td className="py-2 pr-3 text-right text-[#d47b8a] font-semibold">{r.revenue.toLocaleString('vi-VN')} ₫</td>
                  </tr>
                ))}
                {topSelling.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={4}>Không có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm min-w-0">
          <div className="font-semibold text-slate-800">👥 Khách hàng theo khu vực</div>
          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height={240} minWidth={0}>
              <PieChart>
                <Pie data={custGroup} dataKey="value" nameKey="name" outerRadius={90} innerRadius={60} paddingAngle={3}>
                  {custGroup.map((_, i) => (
                    <Cell key={i} fill={["#0ea5e9", "#f97316", "#22c55e", "#e11d48", "#8b5cf6", "#14b8a6", "#f59e0b", "#64748b"][i % 8]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* End Revenue sections */}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabaseClient";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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

  useEffect(() => {
    async function load() {
      const [hhRes, hdRes] = await Promise.all([
        fetch("/api/hang-hoa").then((r) => r.json()),
        fetch(`/api/hoa-don?status=${encodeURIComponent('Đã thanh toán')}&limit=10000&page=1`).then((r) => r.json()),
      ]);

      const hang = (hhRes.data || []) as Tables["HangHoa"][];
      const invoices = (hdRes.data || []) as Tables["HoaDon"][];
      const tongHangHoa = hang.length;
      const tongTonKho = hang.reduce((s, x) => s + (x.SoLuongTon || 0), 0);
      const tongDoanhThu = invoices.reduce((s, x) => s + (x.TongTien || 0), 0);
      setKpi({ tongHangHoa, tongTonKho, tongDoanhThu });
      setSapHet(hang.filter((x) => (x.SoLuongTon || 0) <= 5));

      // Tính doanh thu theo tháng từ dữ liệu thật
      const monthMap = new Map<string, number>();
      for (const inv of invoices) {
        if (!inv.NgayLap) continue;
        const d = new Date(inv.NgayLap);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) || 0) + (inv.TongTien || 0));
      }
      const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      // Lấy tối đa 6 tháng gần nhất để hiển thị
      const last6 = sorted.slice(-6);
      const formatted = last6.map(([key, total]) => {
        const [year, month] = key.split("-");
        return { month: `T${parseInt(month, 10)}/${year.slice(-2)}`, revenue: total };
      });
      setRevenueData(formatted);
    }
    load();
  }, []);


  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            className={`rounded-2xl border bg-gradient-to-br ${card.gradient} p-6 shadow-sm hover:shadow-md transition-shadow`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-slate-800">📊 Doanh thu theo tháng</div>
            <div className="text-xs text-slate-500">Cập nhật gần đây</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip
                  cursor={{ fill: "#F1F5F9" }}
                  formatter={(value: number) => `${value.toLocaleString("vi-VN")} VNĐ`}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#0EA5E9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cảnh báo: Hàng sắp hết
          </div>
          <div className="mt-4 overflow-auto max-h-64">
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
    </div>
  );
}

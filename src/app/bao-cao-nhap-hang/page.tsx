'use client';

import { useEffect, useState } from 'react';
import {
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	Legend,
} from 'recharts';
import { TrendingUp, Package, DollarSign, Calendar } from 'lucide-react';

type ReportData = {
	totalPhieu: number;
	totalValue: number;
	totalQuantity: number;
	byMonth: { month: string; count: number; value: number }[];
	byNCC: { name: string; value: number; count: number }[];
	byProduct: { name: string; quantity: number; value: number }[];
};

export default function BaoCaoNhapHangPage() {
	const [data, setData] = useState<ReportData>({
		totalPhieu: 0,
		totalValue: 0,
		totalQuantity: 0,
		byMonth: [],
		byNCC: [],
		byProduct: [],
	});
	const [loading, setLoading] = useState(true);
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');

	useEffect(() => {
		const now = new Date();
		const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
		setFromDate(firstDay.toISOString().split('T')[0]);
		setToDate(now.toISOString().split('T')[0]);
	}, []);

	useEffect(() => {
		if (fromDate && toDate) {
			loadReport();
		}
	}, [fromDate, toDate]);

	async function loadReport() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('from', fromDate);
			params.set('to', toDate);
			params.set('limit', '10000');
			params.set('page', '1');

			const res = await fetch(`/api/phieu-nhap?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());

			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const phieuList = res.data || [];
			const totalPhieu = phieuList.length;

			// Lấy chi tiết tất cả phiếu
			const allChiTiet: any[] = [];
			for (const phieu of phieuList) {
				const detailRes = await fetch(`/api/phieu-nhap/${phieu.SoPN}`, {
					credentials: 'include',
				}).then((r) => r.json());
				if (detailRes.chiTiet) {
					allChiTiet.push(...detailRes.chiTiet.map((ct: any) => ({ ...ct, sopn: phieu.SoPN, mancc: phieu.MaNCC })));
				}
			}

			const totalValue = allChiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
			const totalQuantity = allChiTiet.reduce((sum, ct) => sum + (ct.SLNhap || 0), 0);

			// Thống kê theo tháng
			const monthMap = new Map<string, { count: number; value: number }>();
			phieuList.forEach((p: any) => {
				if (p.NgayNhap) {
					const date = new Date(p.NgayNhap);
					const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					const current = monthMap.get(key) || { count: 0, value: 0 };
					const phieuValue = allChiTiet.filter((ct) => ct.sopn === p.SoPN).reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
					monthMap.set(key, { count: current.count + 1, value: current.value + phieuValue });
				}
			});
			const byMonth = Array.from(monthMap.entries())
				.map(([month, data]) => ({
					month: month.slice(5) + '/' + month.slice(0, 4),
					count: data.count,
					value: data.value,
				}))
				.sort((a, b) => a.month.localeCompare(b.month));

			// Thống kê theo nhà cung cấp
			const nccMap = new Map<string, { value: number; count: number }>();
			phieuList.forEach((p: any) => {
				if (p.MaNCC) {
					const current = nccMap.get(p.MaNCC) || { value: 0, count: 0 };
					const phieuValue = allChiTiet.filter((ct) => ct.sopn === p.SoPN).reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
					nccMap.set(p.MaNCC, { value: current.value + phieuValue, count: current.count + 1 });
				}
			});
			const byNCC = Array.from(nccMap.entries())
				.map(([name, data]) => ({ name, value: data.value, count: data.count }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 10);

			// Thống kê theo sản phẩm
			const productMap = new Map<string, { quantity: number; value: number; name: string }>();
			allChiTiet.forEach((ct) => {
				const current = productMap.get(ct.MaHH) || { quantity: 0, value: 0, name: ct.TenHH || ct.MaHH };
				productMap.set(ct.MaHH, {
					name: current.name,
					quantity: current.quantity + (ct.SLNhap || 0),
					value: current.value + parseFloat(ct.TongTien || '0'),
				});
			});
			const byProduct = Array.from(productMap.entries())
				.map(([_, data]) => ({ name: data.name, quantity: data.quantity, value: data.value }))
				.sort((a, b) => b.quantity - a.quantity)
				.slice(0, 10);

			setData({
				totalPhieu,
				totalValue,
				totalQuantity,
				byMonth,
				byNCC,
				byProduct,
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	const COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#e11d48', '#8b5cf6', '#14b8a6', '#f59e0b', '#64748b'];

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-semibold text-[#d47b8a]">📊 Báo cáo nhập hàng</h1>
					<div className="flex gap-3">
						<input
							type="date"
							className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm"
							value={fromDate}
							onChange={(e) => setFromDate(e.target.value)}
						/>
						<span className="self-center">đến</span>
						<input
							type="date"
							className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm"
							value={toDate}
							onChange={(e) => setToDate(e.target.value)}
						/>
					</div>
				</div>

				{loading ? (
					<div className="text-center py-10 text-gray-500">Đang tải...</div>
				) : (
					<>
						{/* KPI Cards */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-gray-600">Tổng số phiếu</div>
										<div className="text-2xl font-bold text-gray-800 mt-1">{data.totalPhieu}</div>
									</div>
									<Package className="w-8 h-8 text-blue-600" />
								</div>
							</div>
							<div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-gray-600">Tổng giá trị</div>
										<div className="text-2xl font-bold text-gray-800 mt-1">{data.totalValue.toLocaleString('vi-VN')} ₫</div>
									</div>
									<DollarSign className="w-8 h-8 text-green-600" />
								</div>
							</div>
							<div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-gray-600">Tổng số lượng</div>
										<div className="text-2xl font-bold text-gray-800 mt-1">{data.totalQuantity.toLocaleString('vi-VN')}</div>
									</div>
									<TrendingUp className="w-8 h-8 text-purple-600" />
								</div>
							</div>
						</div>

						{/* Charts */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
							{/* Theo tháng */}
							<div className="rounded-xl border bg-white p-4 shadow-sm">
								<div className="font-semibold text-gray-800 mb-4">📈 Nhập hàng theo tháng</div>
								<div className="h-64">
									<ResponsiveContainer width="100%" height={240}>
										<LineChart data={data.byMonth}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
											<XAxis dataKey="month" stroke="#94A3B8" />
											<YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
											<Tooltip formatter={(value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`} />
											<Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} dot={false} />
										</LineChart>
									</ResponsiveContainer>
								</div>
							</div>

							{/* Theo nhà cung cấp */}
							<div className="rounded-xl border bg-white p-4 shadow-sm">
								<div className="font-semibold text-gray-800 mb-4">🏭 Top nhà cung cấp</div>
								<div className="h-64">
									<ResponsiveContainer width="100%" height={240}>
										<BarChart data={data.byNCC}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
											<XAxis dataKey="name" stroke="#94A3B8" />
											<YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
											<Tooltip formatter={(value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`} />
											<Bar dataKey="value" fill="#22c55e" />
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>

						{/* Top sản phẩm */}
						<div className="rounded-xl border bg-white p-4 shadow-sm">
							<div className="font-semibold text-gray-800 mb-4">📦 Top sản phẩm nhập nhiều nhất</div>
							<div className="overflow-x-auto">
								<table className="min-w-full text-sm">
									<thead>
										<tr className="text-left bg-gray-50 text-gray-600 border-b">
											<th className="py-2 px-4 font-medium">STT</th>
											<th className="py-2 px-4 font-medium">Tên sản phẩm</th>
											<th className="py-2 px-4 font-medium text-right">Số lượng</th>
											<th className="py-2 px-4 font-medium text-right">Giá trị</th>
										</tr>
									</thead>
									<tbody>
										{data.byProduct.map((p, i) => (
											<tr key={i} className="border-b hover:bg-gray-50">
												<td className="py-2 px-4">{i + 1}</td>
												<td className="py-2 px-4">{p.name}</td>
												<td className="py-2 px-4 text-right">{p.quantity.toLocaleString('vi-VN')}</td>
												<td className="py-2 px-4 text-right font-medium text-[#d47b8a]">{p.value.toLocaleString('vi-VN')} ₫</td>
											</tr>
										))}
										{data.byProduct.length === 0 && (
											<tr>
												<td colSpan={4} className="py-6 text-center text-gray-500">Không có dữ liệu</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}


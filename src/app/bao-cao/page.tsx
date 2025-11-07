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
import { TrendingUp, Package, DollarSign, Calendar, Download, Search } from 'lucide-react';
import Button from '@/components/Button';

type TabType = 'nhap' | 'xuat' | 'doanh-thu' | 'ton-kho' | 'tim-kiem';

type NhapData = {
	totalPhieu: number;
	totalValue: number;
	totalQuantity: number;
	byMonth: { month: string; count: number; value: number }[];
	byNCC: { name: string; value: number; count: number }[];
	byProduct: { name: string; quantity: number; value: number }[];
};

type XuatData = {
	totalPhieu: number;
	totalValue: number;
	totalQuantity: number;
	byMonth: { month: string; count: number; value: number }[];
	byNV: { name: string; value: number; count: number }[];
	byProduct: { name: string; quantity: number; value: number }[];
};

type DoanhThuData = {
	byMonth: { month: string; revenue: number }[];
	totalRevenue: number;
	totalInvoices: number;
};

type TonKhoData = {
	totalProducts: number;
	totalQuantity: number;
	totalValue: number;
	lowStock: { name: string; quantity: number }[];
	byCategory: { name: string; quantity: number; value: number }[];
};

export default function BaoCaoPage() {
	const [activeTab, setActiveTab] = useState<TabType>('nhap');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [searchQuery, setSearchQuery] = useState('');

	// Data states
	const [nhapData, setNhapData] = useState<NhapData | null>(null);
	const [xuatData, setXuatData] = useState<XuatData | null>(null);
	const [doanhThuData, setDoanhThuData] = useState<DoanhThuData | null>(null);
	const [tonKhoData, setTonKhoData] = useState<TonKhoData | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const now = new Date();
		const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
		setFromDate(firstDay.toISOString().split('T')[0]);
		setToDate(now.toISOString().split('T')[0]);
	}, []);

	useEffect(() => {
		if (fromDate && toDate) {
			if (activeTab === 'nhap') loadNhapReport();
			else if (activeTab === 'xuat') loadXuatReport();
			else if (activeTab === 'doanh-thu') loadDoanhThuReport();
			else if (activeTab === 'ton-kho') loadTonKhoReport();
		}
	}, [fromDate, toDate, activeTab]);

	async function loadNhapReport() {
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

			setNhapData({
				totalPhieu: phieuList.length,
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

	async function loadXuatReport() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('from', fromDate);
			params.set('to', toDate);
			params.set('limit', '10000');
			params.set('page', '1');

			const res = await fetch(`/api/phieu-xuat?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());

			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const phieuList = res.data || [];
			const allChiTiet: any[] = [];
			for (const phieu of phieuList) {
				const detailRes = await fetch(`/api/phieu-xuat/${phieu.SoPX}`, {
					credentials: 'include',
				}).then((r) => r.json());
				if (detailRes.chiTiet) {
					allChiTiet.push(...detailRes.chiTiet.map((ct: any) => ({ ...ct, sopx: phieu.SoPX, manv: phieu.MaNV })));
				}
			}

			const totalValue = allChiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
			const totalQuantity = allChiTiet.reduce((sum, ct) => sum + (ct.SLXuat || 0), 0);

			const monthMap = new Map<string, { count: number; value: number }>();
			phieuList.forEach((p: any) => {
				if (p.NgayXuat) {
					const date = new Date(p.NgayXuat);
					const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					const current = monthMap.get(key) || { count: 0, value: 0 };
					const phieuValue = allChiTiet.filter((ct) => ct.sopx === p.SoPX).reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
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

			const nvMap = new Map<string, { value: number; count: number }>();
			phieuList.forEach((p: any) => {
				if (p.MaNV) {
					const current = nvMap.get(p.MaNV) || { value: 0, count: 0 };
					const phieuValue = allChiTiet.filter((ct) => ct.sopx === p.SoPX).reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
					nvMap.set(p.MaNV, { value: current.value + phieuValue, count: current.count + 1 });
				}
			});
			const byNV = Array.from(nvMap.entries())
				.map(([name, data]) => ({ name, value: data.value, count: data.count }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 10);

			const productMap = new Map<string, { quantity: number; value: number; name: string }>();
			allChiTiet.forEach((ct) => {
				const current = productMap.get(ct.MaHH) || { quantity: 0, value: 0, name: ct.TenHH || ct.MaHH };
				productMap.set(ct.MaHH, {
					name: current.name,
					quantity: current.quantity + (ct.SLXuat || 0),
					value: current.value + parseFloat(ct.TongTien || '0'),
				});
			});
			const byProduct = Array.from(productMap.entries())
				.map(([_, data]) => ({ name: data.name, quantity: data.quantity, value: data.value }))
				.sort((a, b) => b.quantity - a.quantity)
				.slice(0, 10);

			setXuatData({
				totalPhieu: phieuList.length,
				totalValue,
				totalQuantity,
				byMonth,
				byNV,
				byProduct,
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	async function loadDoanhThuReport() {
		setLoading(true);
		try {
			const res = await fetch(`/api/hoa-don?status=${encodeURIComponent('Đã thanh toán')}&limit=10000&page=1`, {
				credentials: 'include',
			}).then((r) => r.json());

			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const invoices = res.data || [];
			const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.TongTien || 0), 0);

			const monthMap = new Map<string, number>();
			invoices.forEach((inv: any) => {
				if (inv.NgayLap) {
					const date = new Date(inv.NgayLap);
					const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					monthMap.set(key, (monthMap.get(key) || 0) + (inv.TongTien || 0));
				}
			});
			const byMonth = Array.from(monthMap.entries())
				.map(([month, revenue]) => ({
					month: month.slice(5) + '/' + month.slice(0, 4),
					revenue,
				}))
				.sort((a, b) => a.month.localeCompare(b.month));

			setDoanhThuData({
				byMonth,
				totalRevenue,
				totalInvoices: invoices.length,
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	async function loadTonKhoReport() {
		setLoading(true);
		try {
			const res = await fetch('/api/hang-hoa?limit=10000&page=1', {
				credentials: 'include',
			}).then((r) => r.json());

			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const products = res.data || [];
			const totalQuantity = products.reduce((sum: number, p: any) => sum + (p.SoLuongTon || 0), 0);
			const totalValue = products.reduce((sum: number, p: any) => sum + (p.SoLuongTon || 0) * (p.DonGia || 0), 0);
			const lowStock = products
				.filter((p: any) => (p.SoLuongTon || 0) <= 10)
				.map((p: any) => ({ name: p.TenHH || p.MaHH, quantity: p.SoLuongTon || 0 }))
				.slice(0, 20);

			setTonKhoData({
				totalProducts: products.length,
				totalQuantity,
				totalValue,
				lowStock,
				byCategory: [],
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	function handleExport() {
		alert('Chức năng xuất báo cáo (PDF/CSV) sẽ được triển khai trong phiên bản tiếp theo.');
	}

	const tabs = [
		{ id: 'nhap' as TabType, label: '📥 Báo cáo phiếu Nhập', icon: Package },
		{ id: 'xuat' as TabType, label: '📤 Báo cáo phiếu Xuất', icon: Package },
		{ id: 'doanh-thu' as TabType, label: '💰 Thống kê doanh thu', icon: DollarSign },
		{ id: 'ton-kho' as TabType, label: '📦 Thống kê tồn kho', icon: TrendingUp },
		{ id: 'tim-kiem' as TabType, label: '🔍 Tra cứu - Tìm kiếm', icon: Search },
	];

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-semibold text-[#d47b8a]">📊 Thống kê - Báo cáo hàng hóa</h1>
					<div className="flex gap-3 items-center">
						<input
							type="date"
							className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm"
							value={fromDate}
							onChange={(e) => setFromDate(e.target.value)}
						/>
						<span className="text-sm text-gray-600">đến</span>
						<input
							type="date"
							className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm"
							value={toDate}
							onChange={(e) => setToDate(e.target.value)}
						/>
						<Button variant="secondary" onClick={handleExport}>
							<Download className="w-4 h-4 mr-2" />
							Xuất báo cáo
						</Button>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 mb-6 border-b border-[#f5ebe0]">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
									activeTab === tab.id
										? 'border-[#d47b8a] text-[#d47b8a] bg-[#fce7ec]/30'
										: 'border-transparent text-gray-600 hover:text-[#d47b8a] hover:border-[#d47b8a]/50'
								}`}
							>
								<div className="flex items-center gap-2">
									<Icon className="w-4 h-4" />
									{tab.label}
								</div>
							</button>
						);
					})}
				</div>

				{/* Content */}
				{loading ? (
					<div className="text-center py-10 text-gray-500">Đang tải...</div>
				) : (
					<>
						{activeTab === 'nhap' && nhapData && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng số phiếu</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{nhapData.totalPhieu}</div>
											</div>
											<Package className="w-8 h-8 text-blue-600" />
										</div>
									</div>
									<div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng giá trị</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{nhapData.totalValue.toLocaleString('vi-VN')} ₫</div>
											</div>
											<DollarSign className="w-8 h-8 text-green-600" />
										</div>
									</div>
									<div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng số lượng</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{nhapData.totalQuantity.toLocaleString('vi-VN')}</div>
											</div>
											<TrendingUp className="w-8 h-8 text-purple-600" />
										</div>
									</div>
								</div>
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<div className="rounded-xl border bg-white p-4 shadow-sm">
										<div className="font-semibold text-gray-800 mb-4">📈 Nhập hàng theo tháng</div>
										<div className="h-64">
											<ResponsiveContainer width="100%" height={240}>
												<LineChart data={nhapData.byMonth}>
													<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
													<XAxis dataKey="month" stroke="#94A3B8" />
													<YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
													<Tooltip formatter={(value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`} />
													<Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} dot={false} />
												</LineChart>
											</ResponsiveContainer>
										</div>
									</div>
									<div className="rounded-xl border bg-white p-4 shadow-sm">
										<div className="font-semibold text-gray-800 mb-4">🏭 Top nhà cung cấp</div>
										<div className="h-64">
											<ResponsiveContainer width="100%" height={240}>
												<BarChart data={nhapData.byNCC}>
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
												{nhapData.byProduct.map((p, i) => (
													<tr key={i} className="border-b hover:bg-gray-50">
														<td className="py-2 px-4">{i + 1}</td>
														<td className="py-2 px-4">{p.name}</td>
														<td className="py-2 px-4 text-right">{p.quantity.toLocaleString('vi-VN')}</td>
														<td className="py-2 px-4 text-right font-medium text-[#d47b8a]">{p.value.toLocaleString('vi-VN')} ₫</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'xuat' && xuatData && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng số phiếu</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{xuatData.totalPhieu}</div>
											</div>
											<Package className="w-8 h-8 text-blue-600" />
										</div>
									</div>
									<div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng giá trị</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{xuatData.totalValue.toLocaleString('vi-VN')} ₫</div>
											</div>
											<DollarSign className="w-8 h-8 text-green-600" />
										</div>
									</div>
									<div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng số lượng</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{xuatData.totalQuantity.toLocaleString('vi-VN')}</div>
											</div>
											<TrendingUp className="w-8 h-8 text-purple-600" />
										</div>
									</div>
								</div>
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<div className="rounded-xl border bg-white p-4 shadow-sm">
										<div className="font-semibold text-gray-800 mb-4">📈 Xuất hàng theo tháng</div>
										<div className="h-64">
											<ResponsiveContainer width="100%" height={240}>
												<LineChart data={xuatData.byMonth}>
													<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
													<XAxis dataKey="month" stroke="#94A3B8" />
													<YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
													<Tooltip formatter={(value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`} />
													<Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} dot={false} />
												</LineChart>
											</ResponsiveContainer>
										</div>
									</div>
									<div className="rounded-xl border bg-white p-4 shadow-sm">
										<div className="font-semibold text-gray-800 mb-4">👔 Top nhân viên</div>
										<div className="h-64">
											<ResponsiveContainer width="100%" height={240}>
												<BarChart data={xuatData.byNV}>
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
								<div className="rounded-xl border bg-white p-4 shadow-sm">
									<div className="font-semibold text-gray-800 mb-4">📦 Top sản phẩm xuất nhiều nhất</div>
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
												{xuatData.byProduct.map((p, i) => (
													<tr key={i} className="border-b hover:bg-gray-50">
														<td className="py-2 px-4">{i + 1}</td>
														<td className="py-2 px-4">{p.name}</td>
														<td className="py-2 px-4 text-right">{p.quantity.toLocaleString('vi-VN')}</td>
														<td className="py-2 px-4 text-right font-medium text-[#d47b8a]">{p.value.toLocaleString('vi-VN')} ₫</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'doanh-thu' && doanhThuData && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng doanh thu</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{doanhThuData.totalRevenue.toLocaleString('vi-VN')} ₫</div>
											</div>
											<DollarSign className="w-8 h-8 text-green-600" />
										</div>
									</div>
									<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng số hóa đơn</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{doanhThuData.totalInvoices}</div>
											</div>
											<Package className="w-8 h-8 text-blue-600" />
										</div>
									</div>
								</div>
								<div className="rounded-xl border bg-white p-4 shadow-sm">
									<div className="font-semibold text-gray-800 mb-4">📈 Doanh thu theo tháng</div>
									<div className="h-64">
										<ResponsiveContainer width="100%" height={240}>
											<LineChart data={doanhThuData.byMonth}>
												<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
												<XAxis dataKey="month" stroke="#94A3B8" />
												<YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
												<Tooltip formatter={(value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`} />
												<Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
											</LineChart>
										</ResponsiveContainer>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'ton-kho' && tonKhoData && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng số sản phẩm</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{tonKhoData.totalProducts}</div>
											</div>
											<Package className="w-8 h-8 text-blue-600" />
										</div>
									</div>
									<div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng số lượng tồn</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{tonKhoData.totalQuantity.toLocaleString('vi-VN')}</div>
											</div>
											<TrendingUp className="w-8 h-8 text-green-600" />
										</div>
									</div>
									<div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-gray-600">Tổng giá trị tồn</div>
												<div className="text-2xl font-bold text-gray-800 mt-1">{tonKhoData.totalValue.toLocaleString('vi-VN')} ₫</div>
											</div>
											<DollarSign className="w-8 h-8 text-purple-600" />
										</div>
									</div>
								</div>
								<div className="rounded-xl border bg-white p-4 shadow-sm">
									<div className="font-semibold text-gray-800 mb-4">⚠️ Sản phẩm sắp hết hàng (≤ 10)</div>
									<div className="overflow-x-auto">
										<table className="min-w-full text-sm">
											<thead>
												<tr className="text-left bg-gray-50 text-gray-600 border-b">
													<th className="py-2 px-4 font-medium">STT</th>
													<th className="py-2 px-4 font-medium">Tên sản phẩm</th>
													<th className="py-2 px-4 font-medium text-right">Số lượng tồn</th>
												</tr>
											</thead>
											<tbody>
												{tonKhoData.lowStock.map((p, i) => (
													<tr key={i} className="border-b hover:bg-gray-50">
														<td className="py-2 px-4">{i + 1}</td>
														<td className="py-2 px-4">{p.name}</td>
														<td className="py-2 px-4 text-right font-medium text-red-600">{p.quantity}</td>
													</tr>
												))}
												{tonKhoData.lowStock.length === 0 && (
													<tr>
														<td colSpan={3} className="py-6 text-center text-gray-500">Không có sản phẩm nào sắp hết hàng</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'tim-kiem' && (
							<div className="space-y-6">
								<div className="rounded-xl border bg-white p-4 shadow-sm">
									<div className="flex gap-3 mb-4">
										<input
											type="text"
											className="flex-1 bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
											placeholder="Tìm kiếm hàng hóa, phiếu nhập, phiếu xuất..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
										/>
										<Button onClick={() => alert('Chức năng tìm kiếm sẽ được triển khai trong phiên bản tiếp theo.')}>
											<Search className="w-4 h-4 mr-2" />
											Tìm kiếm
										</Button>
									</div>
									<div className="text-center py-10 text-gray-500">
										<Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
										<p>Chức năng tra cứu - tìm kiếm sẽ được triển khai trong phiên bản tiếp theo.</p>
									</div>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

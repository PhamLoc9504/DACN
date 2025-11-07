'use client';

import { useEffect, useState } from 'react';
import { type Tables } from '@/lib/supabaseClient';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Pagination from '@/components/Pagination';
import { Users, MessageSquare, Gift, Star, Search, Shield, Plus, Edit, Trash2, Eye, Send, Bell, TrendingUp, Award } from 'lucide-react';
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
} from 'recharts';

type TabType = 'thong-tin' | 'kenh-thong-tin' | 'khuyen-mai' | 'danh-gia' | 'tim-kiem' | 'bao-ve' | 'thong-ke';

type KhachHang = Tables['KhachHang'];

type ThongBao = {
	id: string;
	tieuDe: string;
	noiDung: string;
	ngayTao: string;
	trangThai: 'chua-gui' | 'da-gui';
};

type KhuyenMai = {
	id: string;
	tenKM: string;
	moTa: string;
	ngayBatDau: string;
	ngayKetThuc: string;
	giamGia: number;
	trangThai: 'dang-dien-ra' | 'sap-dien-ra' | 'ket-thuc';
};

type DanhGia = {
	id: string;
	makh: string;
	tenkh: string;
	diem: number;
	noiDung: string;
	ngayDanhGia: string;
};

export default function ChamSocKhachHangPage() {
	const [activeTab, setActiveTab] = useState<TabType>('thong-tin');
	const [khachHangList, setKhachHangList] = useState<KhachHang[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);
	const [q, setQ] = useState('');

	// Modal states
	const [openModal, setOpenModal] = useState(false);
	const [openDetailModal, setOpenDetailModal] = useState(false);
	const [editing, setEditing] = useState<KhachHang | null>(null);
	const [selectedKH, setSelectedKH] = useState<KhachHang | null>(null);
	const [form, setForm] = useState<Partial<KhachHang>>({
		MaKH: '',
		TenKH: '',
		SDT: '',
		DiaChi: '',
	});

	// Thông báo states
	const [thongBaoList, setThongBaoList] = useState<ThongBao[]>([]);
	const [openThongBaoModal, setOpenThongBaoModal] = useState(false);
	const [thongBaoForm, setThongBaoForm] = useState<Partial<ThongBao>>({
		tieuDe: '',
		noiDung: '',
	});

	// Khuyến mãi states
	const [khuyenMaiList, setKhuyenMaiList] = useState<KhuyenMai[]>([]);
	const [openKhuyenMaiModal, setOpenKhuyenMaiModal] = useState(false);
	const [khuyenMaiForm, setKhuyenMaiForm] = useState<Partial<KhuyenMai>>({
		tenKM: '',
		moTa: '',
		ngayBatDau: '',
		ngayKetThuc: '',
		giamGia: 0,
		trangThai: 'sap-dien-ra',
	});

	// Đánh giá states
	const [danhGiaList, setDanhGiaList] = useState<DanhGia[]>([]);

	// Thống kê states
	const [statsLoading, setStatsLoading] = useState(false);
	const [stats, setStats] = useState<any>(null);
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');

	useEffect(() => {
		const now = new Date();
		const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
		setFromDate(firstDay.toISOString().split('T')[0]);
		setToDate(now.toISOString().split('T')[0]);
	}, []);

	useEffect(() => {
		if (activeTab === 'thong-tin') {
			loadKhachHang();
		} else if (activeTab === 'kenh-thong-tin') {
			loadThongBao();
		} else if (activeTab === 'khuyen-mai') {
			loadKhuyenMai();
		} else if (activeTab === 'danh-gia') {
			loadDanhGia();
		} else if (activeTab === 'thong-ke') {
			loadStats();
		}
	}, [activeTab, page, limit, q]);

	useEffect(() => {
		if (activeTab === 'thong-ke' && fromDate && toDate) {
			loadStats();
		}
	}, [fromDate, toDate]);

	async function loadKhachHang() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (q) params.set('q', q);
			params.set('page', String(page));
			params.set('limit', String(limit));
			const res = await fetch(`/api/khach-hang?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());
			if (res.error) {
				alert(res.error);
				return;
			}
			setKhachHangList(res.data || []);
			setTotal(res.total || 0);
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	async function loadThongBao() {
		// Mock data - trong thực tế sẽ gọi API
		setThongBaoList([
			{
				id: '1',
				tieuDe: 'Chương trình khuyến mãi mùa hè',
				noiDung: 'Giảm giá 20% cho tất cả sản phẩm',
				ngayTao: new Date().toISOString(),
				trangThai: 'chua-gui',
			},
		]);
	}

	async function loadKhuyenMai() {
		// Mock data - trong thực tế sẽ gọi API
		setKhuyenMaiList([
			{
				id: '1',
				tenKM: 'Khuyến mãi mùa hè',
				moTa: 'Giảm giá 20% cho tất cả sản phẩm',
				ngayBatDau: new Date().toISOString().split('T')[0],
				ngayKetThuc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				giamGia: 20,
				trangThai: 'dang-dien-ra',
			},
		]);
	}

	async function loadDanhGia() {
		// Mock data - trong thực tế sẽ gọi API
		setDanhGiaList([
			{
				id: '1',
				makh: 'KH001',
				tenkh: 'Nguyễn Văn A',
				diem: 5,
				noiDung: 'Dịch vụ rất tốt, sản phẩm chất lượng',
				ngayDanhGia: new Date().toISOString(),
			},
		]);
	}

	async function loadStats() {
		setStatsLoading(true);
		try {
			const [khRes, hdRes] = await Promise.all([
				fetch('/api/khach-hang?limit=10000&page=1', { credentials: 'include' }).then((r) => r.json()),
				fetch(`/api/hoa-don?limit=10000&page=1&status=${encodeURIComponent('Đã thanh toán')}`, {
					credentials: 'include',
				}).then((r) => r.json()),
			]);
			const customers: KhachHang[] = khRes.data || [];
			const invoices: any[] = hdRes.data || [];

			const customerRevenue = new Map<string, { tenkh: string; totalOrders: number; totalRevenue: number }>();
			invoices.forEach((inv: any) => {
				if (inv.MaKH) {
					const current = customerRevenue.get(inv.MaKH) || { tenkh: inv.MaKH, totalOrders: 0, totalRevenue: 0 };
					customerRevenue.set(inv.MaKH, {
						tenkh: current.tenkh,
						totalOrders: current.totalOrders + 1,
						totalRevenue: current.totalRevenue + (inv.TongTien || 0),
					});
				}
			});

			customers.forEach((c) => {
				const data = customerRevenue.get(c.MaKH);
				if (data) {
					data.tenkh = c.TenKH || c.MaKH;
				}
			});

			const topCustomers = Array.from(customerRevenue.entries())
				.map(([makh, data]) => ({ makh, ...data }))
				.sort((a, b) => b.totalRevenue - a.totalRevenue)
				.slice(0, 10);

			const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.TongTien || 0), 0);
			const averageOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

			const monthMap = new Map<string, { count: number; revenue: number }>();
			invoices.forEach((inv: any) => {
				if (inv.NgayLap) {
					const date = new Date(inv.NgayLap);
					const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					const current = monthMap.get(key) || { count: 0, revenue: 0 };
					monthMap.set(key, {
						count: current.count + 1,
						revenue: current.revenue + (inv.TongTien || 0),
					});
				}
			});
			const byMonth = Array.from(monthMap.entries())
				.map(([month, data]) => ({
					month: month.slice(5) + '/' + month.slice(0, 4),
					count: data.count,
					revenue: data.revenue,
				}))
				.sort((a, b) => a.month.localeCompare(b.month));

			setStats({
				totalCustomers: customers.length,
				vipCustomers: Math.floor(customers.length * 0.2),
				totalRevenue,
				averageOrderValue,
				byMonth,
				topCustomers,
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setStatsLoading(false);
		}
	}

	async function handleCreate() {
		try {
			const res = await fetch('/api/khach-hang', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data.error || 'Tạo khách hàng thất bại');
				return;
			}
			setOpenModal(false);
			resetForm();
			loadKhachHang();
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
	}

	async function handleUpdate() {
		if (!editing) return;
		try {
			const res = await fetch(`/api/khach-hang/${editing.MaKH}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data.error || 'Cập nhật khách hàng thất bại');
				return;
			}
			setOpenModal(false);
			resetForm();
			loadKhachHang();
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
	}

	async function handleDelete(makh: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
		try {
			const res = await fetch(`/api/khach-hang/${makh}`, {
				method: 'DELETE',
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data.error || 'Xóa khách hàng thất bại');
				return;
			}
			loadKhachHang();
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
	}

	async function openDetail(makh: string) {
		try {
			const res = await fetch(`/api/khach-hang/${makh}`, {
				credentials: 'include',
			}).then((r) => r.json());
			if (res.error) {
				alert(res.error);
				return;
			}
			setSelectedKH(res.data);
			setOpenDetailModal(true);
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
	}

	function openCreate() {
		setEditing(null);
		resetForm();
		setOpenModal(true);
	}

	function openEdit(kh: KhachHang) {
		setEditing(kh);
		setForm({
			MaKH: kh.MaKH,
			TenKH: kh.TenKH || '',
			SDT: kh.SDT || '',
			DiaChi: kh.DiaChi || '',
		});
		setOpenModal(true);
	}

	function resetForm() {
		setForm({
			MaKH: '',
			TenKH: '',
			SDT: '',
			DiaChi: '',
		});
	}

	const tabs = [
		{ id: 'thong-tin' as TabType, label: '👥 Thông tin khách hàng', icon: Users },
		{ id: 'kenh-thong-tin' as TabType, label: '📢 Kênh thông tin', icon: MessageSquare },
		{ id: 'khuyen-mai' as TabType, label: '🎁 Thông tin khuyến mãi', icon: Gift },
		{ id: 'danh-gia' as TabType, label: '⭐ Đánh giá', icon: Star },
		{ id: 'thong-ke' as TabType, label: '📊 Thống kê', icon: TrendingUp },
		{ id: 'tim-kiem' as TabType, label: '🔍 Tìm kiếm - Tra cứu', icon: Search },
		{ id: 'bao-ve' as TabType, label: '🛡️ Bảo vệ quyền lợi', icon: Shield },
	];

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-3xl font-bold text-[#d47b8a] flex items-center gap-3">
						<span className="text-4xl">💎</span>
						<span>Chăm sóc khách hàng VIP Pro</span>
					</h1>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 mb-6 border-b border-[#f5ebe0] overflow-x-auto">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
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
						{/* Tab: Thông tin khách hàng */}
						{activeTab === 'thong-tin' && (
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="flex gap-3 items-center flex-1">
										<input
											type="text"
											className="flex-1 bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
											placeholder="Tìm kiếm khách hàng..."
											value={q}
											onChange={(e) => {
												setPage(1);
												setQ(e.target.value);
											}}
										/>
									</div>
									<Button onClick={openCreate}>
										<Plus className="w-4 h-4 mr-2" />
										Thêm khách hàng
									</Button>
								</div>

								<div className="rounded-xl border bg-white overflow-hidden shadow-sm">
									<table className="min-w-full text-sm">
										<thead>
											<tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
												<th className="py-3 px-4 font-medium">Mã KH</th>
												<th className="py-3 px-4 font-medium">Tên KH</th>
												<th className="py-3 px-4 font-medium">Số điện thoại</th>
												<th className="py-3 px-4 font-medium">Địa chỉ</th>
												<th className="py-3 px-4 font-medium text-center">Thao tác</th>
											</tr>
										</thead>
										<tbody>
											{khachHangList.map((kh) => (
												<tr key={kh.MaKH} className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition">
													<td className="py-3 px-4 font-medium">{kh.MaKH}</td>
													<td className="py-3 px-4">{kh.TenKH}</td>
													<td className="py-3 px-4 text-gray-700">{kh.SDT || '-'}</td>
													<td className="py-3 px-4 text-gray-700">{kh.DiaChi || '-'}</td>
													<td className="py-3 px-4">
														<div className="flex gap-2 justify-center">
															<button
																onClick={() => openDetail(kh.MaKH)}
																className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
															>
																<Eye className="w-3 h-3 inline mr-1" />
																Xem
															</button>
															<button
																onClick={() => openEdit(kh)}
																className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
															>
																<Edit className="w-3 h-3 inline mr-1" />
																Sửa
															</button>
															<button
																onClick={() => handleDelete(kh.MaKH)}
																className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
															>
																<Trash2 className="w-3 h-3 inline mr-1" />
																Xóa
															</button>
														</div>
													</td>
												</tr>
											))}
											{khachHangList.length === 0 && (
												<tr>
													<td colSpan={5} className="py-10 text-center text-gray-500">
														Không có dữ liệu
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>

								<div className="flex justify-center">
									<Pagination page={page} limit={limit} total={total} onChange={setPage} />
								</div>
							</div>
						)}

						{/* Tab: Kênh thông tin */}
						{activeTab === 'kenh-thong-tin' && (
							<div className="space-y-6">
								<div className="flex justify-end">
									<Button onClick={() => setOpenThongBaoModal(true)}>
										<Plus className="w-4 h-4 mr-2" />
										Tạo thông báo
									</Button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{thongBaoList.map((tb) => (
										<div key={tb.id} className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
											<div className="flex items-start justify-between mb-2">
												<h3 className="font-semibold text-gray-800">{tb.tieuDe}</h3>
												<span
													className={`px-2 py-1 text-xs rounded ${
														tb.trangThai === 'da-gui' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
													}`}
												>
													{tb.trangThai === 'da-gui' ? 'Đã gửi' : 'Chưa gửi'}
												</span>
											</div>
											<p className="text-sm text-gray-600 mb-3">{tb.noiDung}</p>
											<div className="flex gap-2">
												<Button variant="secondary">
													<Send className="w-3 h-3 mr-1" />
													Gửi
												</Button>
												<Button variant="secondary">
													<Bell className="w-3 h-3 mr-1" />
													Thông báo
												</Button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Tab: Khuyến mãi */}
						{activeTab === 'khuyen-mai' && (
							<div className="space-y-6">
								<div className="flex justify-end">
									<Button onClick={() => setOpenKhuyenMaiModal(true)}>
										<Plus className="w-4 h-4 mr-2" />
										Tạo khuyến mãi
									</Button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{khuyenMaiList.map((km) => (
										<div key={km.id} className="rounded-xl border bg-gradient-to-br from-pink-50 to-rose-100 p-4 shadow-sm hover:shadow-md transition">
											<div className="flex items-start justify-between mb-2">
												<h3 className="font-bold text-gray-800">{km.tenKM}</h3>
												<span className="px-2 py-1 text-xs bg-[#d47b8a] text-white rounded font-semibold">
													-{km.giamGia}%
												</span>
											</div>
											<p className="text-sm text-gray-600 mb-3">{km.moTa}</p>
											<div className="text-xs text-gray-500">
												<p>Từ: {new Date(km.ngayBatDau).toLocaleDateString('vi-VN')}</p>
												<p>Đến: {new Date(km.ngayKetThuc).toLocaleDateString('vi-VN')}</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Tab: Đánh giá */}
						{activeTab === 'danh-gia' && (
							<div className="space-y-4">
								{danhGiaList.map((dg) => (
									<div key={dg.id} className="rounded-xl border bg-white p-4 shadow-sm">
										<div className="flex items-start justify-between mb-2">
											<div>
												<div className="font-semibold text-gray-800">{dg.tenkh}</div>
												<div className="text-sm text-gray-500">{dg.makh}</div>
											</div>
											<div className="flex items-center gap-1">
												{Array.from({ length: 5 }).map((_, i) => (
													<Star
														key={i}
														className={`w-4 h-4 ${i < dg.diem ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
													/>
												))}
											</div>
										</div>
										<p className="text-sm text-gray-600">{dg.noiDung}</p>
										<div className="text-xs text-gray-400 mt-2">
											{new Date(dg.ngayDanhGia).toLocaleDateString('vi-VN')}
										</div>
									</div>
								))}
							</div>
						)}

						{/* Tab: Thống kê */}
						{activeTab === 'thong-ke' && (
							<div className="space-y-6">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-xl font-semibold text-gray-800">Thống kê khách hàng</h2>
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
									</div>
								</div>

								{statsLoading ? (
									<div className="text-center py-10 text-gray-500">Đang tải...</div>
								) : stats ? (
									<>
										{/* KPI Cards */}
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
											<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
												<div className="flex items-center justify-between">
													<div>
														<div className="text-sm text-gray-600">Tổng số khách hàng</div>
														<div className="text-2xl font-bold text-gray-800 mt-1">{stats.totalCustomers}</div>
													</div>
													<Users className="w-8 h-8 text-blue-600" />
												</div>
											</div>
											<div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
												<div className="flex items-center justify-between">
													<div>
														<div className="text-sm text-gray-600">Khách hàng VIP</div>
														<div className="text-2xl font-bold text-gray-800 mt-1">{stats.vipCustomers}</div>
													</div>
													<Award className="w-8 h-8 text-green-600" />
												</div>
											</div>
											<div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
												<div className="flex items-center justify-between">
													<div>
														<div className="text-sm text-gray-600">Tổng doanh thu</div>
														<div className="text-2xl font-bold text-gray-800 mt-1">{stats.totalRevenue.toLocaleString('vi-VN')} ₫</div>
													</div>
													<TrendingUp className="w-8 h-8 text-purple-600" />
												</div>
											</div>
											<div className="rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100 p-4 shadow-sm">
												<div className="flex items-center justify-between">
													<div>
														<div className="text-sm text-gray-600">Giá trị đơn hàng TB</div>
														<div className="text-2xl font-bold text-gray-800 mt-1">{stats.averageOrderValue.toLocaleString('vi-VN')} ₫</div>
													</div>
													<Star className="w-8 h-8 text-orange-600" />
												</div>
											</div>
										</div>

										{/* Biểu đồ */}
										<div className="rounded-xl border bg-white p-4 shadow-sm">
											<div className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
												<TrendingUp className="w-5 h-5 text-[#d47b8a]" />
												Doanh thu theo tháng
											</div>
											<div className="h-64">
												<ResponsiveContainer width="100%" height={240}>
													<LineChart data={stats.byMonth}>
														<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
														<XAxis dataKey="month" stroke="#94A3B8" />
														<YAxis stroke="#94A3B8" tickFormatter={(v) => `${v / 1000000}M`} />
														<Tooltip formatter={(value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`} />
														<Line type="monotone" dataKey="revenue" stroke="#d47b8a" strokeWidth={2} dot={false} />
													</LineChart>
												</ResponsiveContainer>
											</div>
										</div>

										{/* Top khách hàng */}
										<div className="rounded-xl border bg-white p-4 shadow-sm">
											<div className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
												<Star className="w-5 h-5 text-[#d47b8a]" />
												Top 10 khách hàng theo doanh thu
											</div>
											<div className="overflow-x-auto">
												<table className="min-w-full text-sm">
													<thead>
														<tr className="text-left bg-gray-50 text-gray-600 border-b">
															<th className="py-2 px-4 font-medium">STT</th>
															<th className="py-2 px-4 font-medium">Mã KH</th>
															<th className="py-2 px-4 font-medium">Tên khách hàng</th>
															<th className="py-2 px-4 font-medium text-right">Số đơn hàng</th>
															<th className="py-2 px-4 font-medium text-right">Tổng doanh thu</th>
														</tr>
													</thead>
													<tbody>
														{stats.topCustomers.map((c: any, i: number) => (
															<tr key={c.makh} className="border-b hover:bg-gray-50">
																<td className="py-2 px-4">{i + 1}</td>
																<td className="py-2 px-4 font-medium">{c.makh}</td>
																<td className="py-2 px-4">{c.tenkh}</td>
																<td className="py-2 px-4 text-right">{c.totalOrders}</td>
																<td className="py-2 px-4 text-right font-medium text-[#d47b8a]">{c.totalRevenue.toLocaleString('vi-VN')} ₫</td>
															</tr>
														))}
														{stats.topCustomers.length === 0 && (
															<tr>
																<td colSpan={5} className="py-6 text-center text-gray-500">
																	Chưa có dữ liệu
																</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										</div>
									</>
								) : (
									<div className="text-center py-10 text-gray-500">Không có dữ liệu</div>
								)}
							</div>
						)}

						{/* Tab: Tìm kiếm */}
						{activeTab === 'tim-kiem' && (
							<div className="space-y-6">
								<div className="rounded-xl border bg-white p-6 shadow-sm">
									<div className="flex gap-3 mb-4">
										<input
											type="text"
											className="flex-1 bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
											placeholder="Tìm kiếm khách hàng, hóa đơn, đánh giá..."
										/>
										<Button>
											<Search className="w-4 h-4 mr-2" />
											Tìm kiếm
										</Button>
									</div>
									<div className="text-center py-10 text-gray-500">
										<Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
										<p>Nhập từ khóa để tìm kiếm thông tin khách hàng</p>
									</div>
								</div>
							</div>
						)}

						{/* Tab: Bảo vệ quyền lợi */}
						{activeTab === 'bao-ve' && (
							<div className="space-y-6">
								<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-100 p-6 shadow-sm">
									<h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
										<Shield className="w-6 h-6 text-blue-600" />
										Bảo vệ quyền lợi khách hàng
									</h2>
									<div className="space-y-4 text-sm text-gray-700">
										<div className="bg-white rounded-lg p-4">
											<h3 className="font-semibold mb-2">1. Quyền được thông tin</h3>
											<p>Khách hàng có quyền được cung cấp đầy đủ thông tin về sản phẩm, dịch vụ.</p>
										</div>
										<div className="bg-white rounded-lg p-4">
											<h3 className="font-semibold mb-2">2. Quyền được bảo vệ dữ liệu</h3>
											<p>Thông tin cá nhân của khách hàng được bảo mật tuyệt đối.</p>
										</div>
										<div className="bg-white rounded-lg p-4">
											<h3 className="font-semibold mb-2">3. Quyền khiếu nại</h3>
											<p>Khách hàng có quyền khiếu nại về chất lượng sản phẩm, dịch vụ.</p>
										</div>
										<div className="bg-white rounded-lg p-4">
											<h3 className="font-semibold mb-2">4. Quyền được đền bù</h3>
											<p>Khách hàng được đền bù nếu sản phẩm, dịch vụ không đúng cam kết.</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Modal: Create/Edit Khách hàng */}
			<Modal open={openModal} onClose={() => setOpenModal(false)} title={editing ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (editing) handleUpdate();
						else handleCreate();
					}}
					className="space-y-4"
				>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Mã KH *</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={form.MaKH}
							onChange={(e) => setForm({ ...form, MaKH: e.target.value })}
							required
							disabled={!!editing}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Tên KH *</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={form.TenKH || ''}
							onChange={(e) => setForm({ ...form, TenKH: e.target.value })}
							required
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Số điện thoại</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={form.SDT || ''}
							onChange={(e) => setForm({ ...form, SDT: e.target.value })}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Địa chỉ</label>
						<textarea
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={form.DiaChi || ''}
							onChange={(e) => setForm({ ...form, DiaChi: e.target.value })}
							rows={3}
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="secondary" onClick={() => setOpenModal(false)}>
							Hủy
						</Button>
						<Button type="submit">{editing ? '💾 Lưu' : '➕ Tạo'}</Button>
					</div>
				</form>
			</Modal>

			{/* Modal: Detail Khách hàng */}
			<Modal open={openDetailModal} onClose={() => setOpenDetailModal(false)} title={`Chi tiết khách hàng ${selectedKH?.MaKH}`}>
				{selectedKH && (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-gray-500">Mã KH:</span>
								<span className="ml-2 font-medium">{selectedKH.MaKH}</span>
							</div>
							<div>
								<span className="text-gray-500">Tên KH:</span>
								<span className="ml-2 font-medium">{selectedKH.TenKH}</span>
							</div>
							<div>
								<span className="text-gray-500">Số điện thoại:</span>
								<span className="ml-2">{selectedKH.SDT || '-'}</span>
							</div>
							<div>
								<span className="text-gray-500">Địa chỉ:</span>
								<span className="ml-2">{selectedKH.DiaChi || '-'}</span>
							</div>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="secondary" onClick={() => setOpenDetailModal(false)}>
								Đóng
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}


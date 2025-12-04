'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { type Tables } from '@/lib/supabaseClient';
import { formatVietnamDate } from '@/lib/dateUtils';
import { Truck, Eye, CheckCircle, Package, MapPin, Calendar, CreditCard, User } from 'lucide-react';

type VanChuyenRow = Tables['Dovi_VanChuyen'] & {
	HoaDon?: {
		MaHD: string;
		NgayLap: string | null;
		MaKH: string | null;
		TongTien: number | null;
		TrangThai: string;
		HinhThucGiao: string | null;
		PhuongThucTT: string | null;
	};
	KhachHang?: {
		MaKH: string;
		TenKH: string | null;
		SDT: string | null;
		DiaChi: string | null;
	};
};

const TRANG_THAI = ['Chờ lấy hàng', 'Đang giao', 'Đã giao', 'Đã hủy'];

export default function VanChuyenPage() {
	const [rows, setRows] = useState<VanChuyenRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [q, setQ] = useState('');
	const [status, setStatus] = useState('');
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	// Modal states
	const [openDetailModal, setOpenDetailModal] = useState(false);
	const [openStatusModal, setOpenStatusModal] = useState(false);
	const [selectedVC, setSelectedVC] = useState<VanChuyenRow | null>(null);
	const [newStatus, setNewStatus] = useState('');

	useEffect(() => {
		loadData();
	}, [q, page, limit, status]);

	async function loadData() {
		setLoading(true);
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (status) params.set('status', status);
		params.set('page', String(page));
		params.set('limit', String(limit));

		try {
			const res = await fetch(`/api/van-chuyen?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());
			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}
			setRows(res.data || []);
			setTotal(res.total || 0);
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
		setLoading(false);
	}

	async function openDetail(vc: VanChuyenRow) {
		setSelectedVC(vc);
		setOpenDetailModal(true);
	}

	function openStatusUpdate(vc: VanChuyenRow) {
		setSelectedVC(vc);
		setNewStatus(vc.TrangThai);
		setOpenStatusModal(true);
	}

	async function handleStatusUpdate() {
		if (!selectedVC || !newStatus) return;
		try {
			const res = await fetch(`/api/van-chuyen?mavc=${selectedVC.MaVC}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ TrangThai: newStatus }),
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data.error || 'Cập nhật trạng thái thất bại');
				return;
			}
			setOpenStatusModal(false);
			loadData();
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'Chờ lấy hàng':
				return 'bg-yellow-100 text-yellow-800 border-yellow-300';
			case 'Đang giao':
				return 'bg-blue-100 text-blue-800 border-blue-300';
			case 'Đã giao':
				return 'bg-green-100 text-green-800 border-green-300';
			case 'Đã hủy':
				return 'bg-red-100 text-red-800 border-red-300';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-300';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'Chờ lấy hàng':
				return <Package className="w-4 h-4" />;
			case 'Đang giao':
				return <Truck className="w-4 h-4" />;
			case 'Đã giao':
				return <CheckCircle className="w-4 h-4" />;
			default:
				return <Package className="w-4 h-4" />;
		}
	}

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			{/* --- Bộ lọc & tìm kiếm --- */}
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<h1 className="text-2xl font-semibold mb-5 text-[#d47b8a]">🚚 Quản lý vận chuyển</h1>
				<div className="grid md:grid-cols-3 gap-4">
					{/* Ô tìm kiếm */}
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
							placeholder="Nhập mã VC, mã HĐ hoặc địa chỉ nhận..."
							value={q}
							onChange={(e) => {
								setPage(1);
								setQ(e.target.value);
							}}
						/>
					</div>

					{/* Lọc trạng thái */}
					<div>
						<label className="block text-sm mb-1 text-gray-500">Trạng thái</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={status}
							onChange={(e) => {
								setPage(1);
								setStatus(e.target.value);
							}}
						>
							<option value="">Tất cả</option>
							{TRANG_THAI.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Hiển thị số lượng */}
				<div className="mt-4">
					<label className="block text-sm mb-1 text-gray-500">Hiển thị</label>
					<select
						className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition max-w-xs"
						value={limit}
						onChange={(e) => {
							setPage(1);
							setLimit(parseInt(e.target.value));
						}}
					>
						<option value={10}>10</option>
						<option value={20}>20</option>
						<option value={50}>50</option>
					</select>
				</div>
			</div>

			{/* --- Bảng dữ liệu --- */}
			<div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
							<th className="py-3 px-4 font-medium">Mã VC</th>
							<th className="py-3 px-4 font-medium">Mã HĐ</th>
							<th className="py-3 px-4 font-medium">Khách hàng</th>
							<th className="py-3 px-4 font-medium">Địa chỉ nhận</th>
							<th className="py-3 px-4 font-medium">Ngày giao</th>
							<th className="py-3 px-4 font-medium">Trạng thái</th>
							<th className="py-3 px-4 font-medium text-center">Hành động</th>
						</tr>
					</thead>

					<tbody>
						{/* Skeleton */}
						{loading &&
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={`sk-${i}`} className="border-b border-[#f5ebe0] animate-pulse">
									{Array.from({ length: 7 }).map((_, j) => (
										<td key={j} className="py-3 px-4">
											<div className="h-4 w-20 bg-[#f9dfe3] rounded" />
										</td>
									))}
								</tr>
							))}

						{/* Dữ liệu */}
						{!loading &&
							rows.map((r) => (
								<tr
									key={r.MaVC}
									className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition cursor-pointer"
									onClick={() => openDetail(r)}
								>
									<td className="py-3 px-4 font-medium">{r.MaVC}</td>
									<td className="py-3 px-4">
										{r.HoaDon ? (
											<span className="font-medium text-[#d47b8a]">{r.HoaDon.MaHD}</span>
										) : (
											r.MaHD || '-'
										)}
									</td>
									<td className="py-3 px-4">
										{r.KhachHang ? (
											<div>
												<div className="font-medium">{r.KhachHang.TenKH || '-'}</div>
												<div className="text-xs text-gray-500">{r.KhachHang.SDT || ''}</div>
											</div>
										) : (
											'-'
										)}
									</td>
									<td className="py-3 px-4 text-gray-700 max-w-xs truncate">
										{r.DiaChiNhan || '-'}
									</td>
									<td className="py-3 px-4 text-gray-600">
										{r.NgayGiao ? formatVietnamDate(r.NgayGiao) : '-'}
									</td>
									<td className="py-3 px-4">
										<span
											className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
												r.TrangThai
											)}`}
										>
											{getStatusIcon(r.TrangThai)}
											{r.TrangThai}
										</span>
									</td>
									<td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
										<div className="flex gap-2 justify-center">
											<button
												onClick={() => openDetail(r)}
												className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition flex items-center gap-1"
											>
												<Eye className="w-3 h-3" />
												Chi tiết
											</button>
											<button
												onClick={() => openStatusUpdate(r)}
												className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition flex items-center gap-1"
											>
												<CheckCircle className="w-3 h-3" />
												Cập nhật
											</button>
										</div>
									</td>
								</tr>
							))}

						{/* Không có dữ liệu */}
						{!loading && rows.length === 0 && (
							<tr>
								<td colSpan={7} className="py-10 text-center text-gray-500 bg-white">
									<div className="mx-auto h-10 w-10 rounded-full bg-[#fce7ec] mb-3" />
									Không có dữ liệu
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* --- Phân trang --- */}
			<div className="flex justify-center pt-4">
				<Pagination page={page} limit={limit} total={total} onChange={setPage} />
			</div>

			{/* Modal: Chi tiết */}
			<Modal
				open={openDetailModal}
				onClose={() => setOpenDetailModal(false)}
				title={`Chi tiết vận chuyển ${selectedVC?.MaVC}`}
			>
				{selectedVC && (
					<div className="space-y-4">
						{/* Thông tin vận chuyển */}
						<div className="bg-[#f9f5f1] rounded-xl p-4 space-y-3">
							<h3 className="font-semibold text-[#d47b8a] flex items-center gap-2">
								<Truck className="w-5 h-5" />
								Thông tin vận chuyển
							</h3>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<span className="text-gray-500">Mã VC:</span>
									<span className="ml-2 font-medium">{selectedVC.MaVC}</span>
								</div>
								<div>
									<span className="text-gray-500">Mã HĐ:</span>
									<span className="ml-2 font-medium">{selectedVC.MaHD || '-'}</span>
								</div>
								<div>
									<span className="text-gray-500">Ngày giao:</span>
									<span className="ml-2">
										{selectedVC.NgayGiao ? formatVietnamDate(selectedVC.NgayGiao) : '-'}
									</span>
								</div>
								<div>
									<span className="text-gray-500">Trạng thái:</span>
									<span
										className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
											selectedVC.TrangThai
										)}`}
									>
										{getStatusIcon(selectedVC.TrangThai)}
										{selectedVC.TrangThai}
									</span>
								</div>
								<div className="col-span-2">
									<span className="text-gray-500 flex items-start gap-2">
										<MapPin className="w-4 h-4 mt-0.5" />
										Địa chỉ nhận:
									</span>
									<span className="ml-2">{selectedVC.DiaChiNhan || '-'}</span>
								</div>
							</div>
						</div>

						{/* Thông tin hóa đơn */}
						{selectedVC.HoaDon && (
							<div className="bg-blue-50 rounded-xl p-4 space-y-3">
								<h3 className="font-semibold text-blue-700 flex items-center gap-2">
									<CreditCard className="w-5 h-5" />
									Thông tin hóa đơn
								</h3>
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div>
										<span className="text-gray-500">Mã HĐ:</span>
										<span className="ml-2 font-medium">{selectedVC.HoaDon.MaHD}</span>
									</div>
									<div>
										<span className="text-gray-500">Ngày lập:</span>
										<span className="ml-2">
											{selectedVC.HoaDon.NgayLap ? formatVietnamDate(selectedVC.HoaDon.NgayLap) : '-'}
										</span>
									</div>
									<div>
										<span className="text-gray-500">Tổng tiền:</span>
										<span className="ml-2 font-medium text-green-600">
											{selectedVC.HoaDon.TongTien
												? new Intl.NumberFormat('vi-VN').format(selectedVC.HoaDon.TongTien) + ' đ'
												: '-'}
										</span>
									</div>
									<div>
										<span className="text-gray-500">Trạng thái:</span>
										<span className="ml-2">{selectedVC.HoaDon.TrangThai}</span>
									</div>
									<div>
										<span className="text-gray-500">Hình thức giao:</span>
										<span className="ml-2">{selectedVC.HoaDon.HinhThucGiao || '-'}</span>
									</div>
									<div>
										<span className="text-gray-500">Phương thức TT:</span>
										<span className="ml-2">{selectedVC.HoaDon.PhuongThucTT || '-'}</span>
									</div>
								</div>
							</div>
						)}

						{/* Thông tin khách hàng */}
						{selectedVC.KhachHang && (
							<div className="bg-green-50 rounded-xl p-4 space-y-3">
								<h3 className="font-semibold text-green-700 flex items-center gap-2">
									<User className="w-5 h-5" />
									Thông tin khách hàng
								</h3>
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div>
										<span className="text-gray-500">Mã KH:</span>
										<span className="ml-2 font-medium">{selectedVC.KhachHang.MaKH}</span>
									</div>
									<div>
										<span className="text-gray-500">Tên KH:</span>
										<span className="ml-2 font-medium">{selectedVC.KhachHang.TenKH || '-'}</span>
									</div>
									<div>
										<span className="text-gray-500">SĐT:</span>
										<span className="ml-2">{selectedVC.KhachHang.SDT || '-'}</span>
									</div>
									<div>
										<span className="text-gray-500">Địa chỉ:</span>
										<span className="ml-2">{selectedVC.KhachHang.DiaChi || '-'}</span>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</Modal>

			{/* Modal: Cập nhật trạng thái */}
			<Modal
				open={openStatusModal}
				onClose={() => setOpenStatusModal(false)}
				title="Cập nhật trạng thái vận chuyển"
			>
				{selectedVC && (
					<div className="space-y-4">
						<div>
							<label className="block text-sm mb-2 text-gray-500">Trạng thái hiện tại</label>
							<div
								className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(
									selectedVC.TrangThai
								)}`}
							>
								{getStatusIcon(selectedVC.TrangThai)}
								<span className="font-medium">{selectedVC.TrangThai}</span>
							</div>
						</div>
						<div>
							<label className="block text-sm mb-2 text-gray-500">Trạng thái mới *</label>
							<select
								className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
								value={newStatus}
								onChange={(e) => setNewStatus(e.target.value)}
							>
								{TRANG_THAI.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onClick={() => setOpenStatusModal(false)}>
								Hủy
							</Button>
							<Button onClick={handleStatusUpdate}>💾 Cập nhật</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}

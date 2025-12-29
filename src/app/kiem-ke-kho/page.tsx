'use client';

import { useEffect, useState } from 'react';
import { type Tables } from '@/lib/supabaseClient';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Pagination from '@/components/Pagination';
import { formatVietnamDate } from '@/lib/dateUtils';
import { ClipboardCheck, Package, AlertTriangle, CheckCircle, XCircle, Plus, Edit, Trash2, Eye, FileText, Download, Search, Calendar, Filter } from 'lucide-react';

type HangHoa = Tables['HangHoa'];

type KiemKe = {
	id: string;
	maKK: string;
	ngayKiemKe: string;
	nguoiKiemKe: string;
	trangThai: 'dang-tien-hanh' | 'hoan-thanh' | 'huy-bo';
	ghiChu?: string;
	chiTiet: ChiTietKiemKe[];
};

type ChiTietKiemKe = {
	mahh: string;
	tenhh: string;
	soLuongSach: number; // Số lượng theo sổ sách
	soLuongThucTe: number; // Số lượng thực tế
	chenhLech: number; // Chênh lệch = thực tế - sổ sách
	lyDo?: string;
};

export default function KiemKeKhoPage() {
	const [kiemKeList, setKiemKeList] = useState<KiemKe[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);
	const [q, setQ] = useState('');
	const [trangThai, setTrangThai] = useState('');

	// Modal states
	const [openModal, setOpenModal] = useState(false);
	const [openDetailModal, setOpenDetailModal] = useState(false);
	const [openChiTietModal, setOpenChiTietModal] = useState(false);
	const [editing, setEditing] = useState<KiemKe | null>(null);
	const [selectedKK, setSelectedKK] = useState<KiemKe | null>(null);
	const [hangHoaList, setHangHoaList] = useState<HangHoa[]>([]);
	const [chiTietKiemKe, setChiTietKiemKe] = useState<ChiTietKiemKe[]>([]);

	const [form, setForm] = useState<Partial<KiemKe>>({
		maKK: '',
		ngayKiemKe: new Date().toISOString().split('T')[0],
		nguoiKiemKe: '',
		trangThai: 'dang-tien-hanh',
		ghiChu: '',
	});

	useEffect(() => {
		loadData();
		loadHangHoa();
	}, [q, page, limit, trangThai]);

	async function loadData() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('page', String(page));
			params.set('limit', String(limit));
			if (q) params.set('q', q);
			if (trangThai) params.set('trangThai', trangThai);
			const res = await fetch(`/api/kiem-ke?${params.toString()}`, { credentials: 'include' });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Không tải được dữ liệu kiểm kê');
			const list: KiemKe[] = (data.data || []).map((row: any) => ({
				id: row.id,
				maKK: row.maKK,
				ngayKiemKe: row.ngayKiemKe,
				nguoiKiemKe: row.nguoiKiemKe,
				trangThai: row.trangThai,
				ghiChu: row.ghiChu,
				chiTiet: [],
			}));
			setKiemKeList(list);
			setTotal(data.total || list.length);
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	async function loadHangHoa() {
		try {
			const res = await fetch('/api/hang-hoa?limit=10000&page=1', {
				credentials: 'include',
			}).then((r) => r.json());
			if (res.error) {
				alert(res.error);
				return;
			}
			setHangHoaList(res.data || []);
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
	}

	function openCreate() {
		setEditing(null);
		setForm({
			maKK: `KK${String(Date.now()).slice(-6)}`,
			ngayKiemKe: new Date().toISOString().split('T')[0],
			nguoiKiemKe: '',
			trangThai: 'dang-tien-hanh',
			ghiChu: '',
		});
		setChiTietKiemKe([]);
		setOpenModal(true);
	}

	function openEdit(kk: KiemKe) {
		setEditing(kk);
		setForm({
			maKK: kk.maKK,
			ngayKiemKe: kk.ngayKiemKe,
			nguoiKiemKe: kk.nguoiKiemKe,
			trangThai: kk.trangThai,
			ghiChu: kk.ghiChu,
		});
		setChiTietKiemKe(kk.chiTiet || []);
		setOpenModal(true);
	}

	function openDetail(kk: KiemKe) {
		setSelectedKK(kk);
		setOpenDetailModal(true);
	}

	function openChiTiet(kk: KiemKe) {
		setSelectedKK(kk);
		setOpenChiTietModal(true);
	}

	function addChiTiet() {
		const newChiTiet: ChiTietKiemKe = {
			mahh: '',
			tenhh: '',
			soLuongSach: 0,
			soLuongThucTe: 0,
			chenhLech: 0,
			lyDo: '',
		};
		setChiTietKiemKe([...chiTietKiemKe, newChiTiet]);
	}

	function updateChiTiet(index: number, field: keyof ChiTietKiemKe, value: any) {
		const updated = [...chiTietKiemKe];
		updated[index] = { ...updated[index], [field]: value };
		if (field === 'soLuongThucTe' || field === 'soLuongSach') {
			updated[index].chenhLech = (updated[index].soLuongThucTe || 0) - (updated[index].soLuongSach || 0);
		}
		if (field === 'mahh') {
			const hh = hangHoaList.find((h) => h.MaHH === value);
			if (hh) {
				updated[index].tenhh = hh.TenHH || '';
				updated[index].soLuongSach = hh.SoLuongTon || 0;
			}
		}
		setChiTietKiemKe(updated);
	}

	function removeChiTiet(index: number) {
		setChiTietKiemKe(chiTietKiemKe.filter((_, i) => i !== index));
	}

	async function handleSave() {
		if (!form.maKK || !form.ngayKiemKe || !form.nguoiKiemKe) {
			alert('Vui lòng điền đầy đủ thông tin');
			return;
		}
		if (chiTietKiemKe.length === 0) {
			alert('Vui lòng thêm ít nhất một chi tiết kiểm kê');
			return;
		}
		try {
			const payload = {
				maKK: form.maKK,
				ngayKiemKe: form.ngayKiemKe,
				nguoiKiemKe: form.nguoiKiemKe,
				trangThai: form.trangThai,
				ghiChu: form.ghiChu,
				chiTiet: chiTietKiemKe,
			};
			let res;
			if (editing) {
				res = await fetch(`/api/kiem-ke/${editing.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(payload),
				});
			} else {
				res = await fetch('/api/kiem-ke', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(payload),
				});
			}
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Lưu phiếu kiểm kê thất bại');
			alert('Lưu phiếu kiểm kê thành công');
			setOpenModal(false);
			resetForm();
			loadData();
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra khi lưu phiếu');
		}
	}

	function resetForm() {
		setForm({
			maKK: '',
			ngayKiemKe: new Date().toISOString().split('T')[0],
			nguoiKiemKe: '',
			trangThai: 'dang-tien-hanh',
			ghiChu: '',
		});
		setChiTietKiemKe([]);
	}

	function getTrangThaiLabel(status: string) {
		switch (status) {
			case 'dang-tien-hanh':
				return 'Đang tiến hành';
			case 'hoan-thanh':
				return 'Hoàn thành';
			case 'huy-bo':
				return 'Hủy bỏ';
			default:
				return status;
		}
	}

	function getTrangThaiColor(status: string) {
		switch (status) {
			case 'dang-tien-hanh':
				return 'bg-yellow-100 text-yellow-700';
			case 'hoan-thanh':
				return 'bg-green-100 text-green-700';
			case 'huy-bo':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	const filtered = kiemKeList.filter((kk) => {
		if (q && !kk.maKK.toLowerCase().includes(q.toLowerCase()) && !kk.nguoiKiemKe.toLowerCase().includes(q.toLowerCase())) {
			return false;
		}
		if (trangThai && kk.trangThai !== trangThai) {
			return false;
		}
		return true;
	});

	const tongPhieu = kiemKeList.length;
	const tongDangTienHanh = kiemKeList.filter((kk) => kk.trangThai === 'dang-tien-hanh').length;
	const tongHoanThanh = kiemKeList.filter((kk) => kk.trangThai === 'hoan-thanh').length;
	const tongHuyBo = kiemKeList.filter((kk) => kk.trangThai === 'huy-bo').length;
	const tongChenhLechSelected = selectedKK
		? selectedKK.chiTiet?.reduce((sum, ct) => sum + (ct.chenhLech || 0), 0)
		: 0;

	return (
		<div className="space-y-6 bg-slate-100 min-h-screen p-6 text-slate-900">
			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
					<div>
						<div className="text-xs uppercase tracking-wide opacity-80 mb-1">Tổng phiếu kiểm kê</div>
						<div className="text-2xl font-bold">{tongPhieu}</div>
					</div>
					<div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
						<ClipboardCheck className="w-5 h-5" />
					</div>
				</div>
				<div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
					<div>
						<div className="text-xs uppercase tracking-wide opacity-80 mb-1">Đang tiến hành</div>
						<div className="text-2xl font-bold">{tongDangTienHanh}</div>
						<div className="text-xs opacity-80 mt-1">Hoàn thành: {tongHoanThanh}</div>
					</div>
					<div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
						<AlertTriangle className="w-5 h-5" />
					</div>
				</div>
				<div className="bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
					<div>
						<div className="text-xs uppercase tracking-wide opacity-80 mb-1">Đã hoàn thành</div>
						<div className="text-2xl font-bold">{tongHoanThanh}</div>
						<div className="text-xs opacity-80 mt-1">Hủy bỏ: {tongHuyBo}</div>
					</div>
					<div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20">
						<CheckCircle className="w-5 h-5" />
					</div>
				</div>
				<div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
					<div>
						<div className="text-xs uppercase tracking-wide opacity-80 mb-1">Tổng chênh lệch (phiếu đang xem)</div>
						<div className="text-2xl font-bold">{selectedKK ? (tongChenhLechSelected > 0 ? `+${tongChenhLechSelected}` : tongChenhLechSelected) : '--'}</div>
						<div className="text-[11px] opacity-70 mt-1">Chỉ tính trên phiếu đang mở chi tiết</div>
					</div>
					<div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10">
						<Package className="w-5 h-5" />
					</div>
				</div>
			</div>

			<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3 tracking-tight">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 shadow-md shadow-sky-500/40">
							<ClipboardCheck className="w-5 h-5" />
						</span>
						Quản lý kiểm kê kho
					</h1>
					<Button onClick={openCreate}>
						<Plus className="w-4 h-4 mr-2" />
						Tạo phiếu kiểm kê
					</Button>
				</div>

				{/* Filters */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-slate-600">Tìm kiếm</label>
						<input
							type="text"
							className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-slate-400"
							placeholder="Mã kiểm kê, người kiểm kê..."
							value={q}
							onChange={(e) => {
								setPage(1);
								setQ(e.target.value);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-slate-600">Trạng thái</label>
						<select
							className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
							value={trangThai}
							onChange={(e) => {
								setPage(1);
								setTrangThai(e.target.value);
							}}
						>
							<option value="">Tất cả</option>
							<option value="dang-tien-hanh">Đang tiến hành</option>
							<option value="hoan-thanh">Hoàn thành</option>
							<option value="huy-bo">Hủy bỏ</option>
						</select>
					</div>
				</div>

				{/* Table */}
				<div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left bg-slate-50 text-slate-600 border-b border-gray-200">
								<th className="py-3 px-4 font-medium">Mã KK</th>
								<th className="py-3 px-4 font-medium">Ngày kiểm kê</th>
								<th className="py-3 px-4 font-medium">Người kiểm kê</th>
								<th className="py-3 px-4 font-medium">Số lượng sản phẩm</th>
								<th className="py-3 px-4 font-medium">Trạng thái</th>
								<th className="py-3 px-4 font-medium text-center">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{loading &&
								Array.from({ length: 5 }).map((_, i) => (
									<tr key={i} className="border-b border-gray-200 animate-pulse">
										{Array.from({ length: 6 }).map((_, j) => (
											<td key={j} className="py-3 px-4">
												<div className="h-4 w-20 bg-slate-200 rounded" />
											</td>
										))}
									</tr>
								))}

							{!loading &&
								filtered.map((kk) => (
									<tr 
										key={kk.id} 
										className="border-b border-gray-200 hover:bg-slate-50 transition cursor-pointer"
										onClick={() => openDetail(kk)}
									>
										<td className="py-3 px-4 font-medium">{kk.maKK}</td>
										<td className="py-3 px-4 text-slate-700">{formatVietnamDate(kk.ngayKiemKe)}</td>
										<td className="py-3 px-4 text-slate-700">{kk.nguoiKiemKe}</td>
										<td className="py-3 px-4 text-slate-700">{kk.chiTiet?.length || 0}</td>
										<td className="py-3 px-4">
											<span className={`px-2 py-1 text-xs rounded font-medium ${getTrangThaiColor(kk.trangThai)}`}>
												{getTrangThaiLabel(kk.trangThai)}
											</span>
										</td>
										<td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
											<div className="flex gap-2 justify-center">
												<button
													onClick={() => openChiTiet(kk)}
													className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
												>
													<FileText className="w-3 h-3 inline mr-1" />
													Chi tiết
												</button>
												{kk.trangThai === 'dang-tien-hanh' && (
													<button
														onClick={() => openEdit(kk)}
														className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
													>
														<Edit className="w-3 h-3 inline mr-1" />
														Sửa
													</button>
												)}
											</div>
										</td>
									</tr>
								))}

							{!loading && filtered.length === 0 && (
								<tr>
									<td colSpan={6} className="py-10 text-center text-slate-500 bg-white">
										<div className="mx-auto h-10 w-10 rounded-full bg-slate-200 mb-3" />
										Không có dữ liệu
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				<div className="flex justify-center pt-4">
					<Pagination page={page} limit={limit} total={total} onChange={setPage} />
				</div>
			</div>

			{/* Modal: Create/Edit */}
			<Modal
				open={openModal}
				onClose={() => setOpenModal(false)}
				title={editing ? 'Sửa phiếu kiểm kê' : 'Tạo phiếu kiểm kê mới'}
			>
				<div className="space-y-5">
					{/* Thông tin chung */}
					<div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
						<div className="mb-3 flex items-center justify-between">
							<p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
								<ClipboardCheck className="w-4 h-4 text-sky-500" />
								Thông tin phiếu kiểm kê
							</p>
							<span className="text-[11px] px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">
								{editing ? 'Chỉnh sửa' : 'Phiếu mới'}
							</span>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-xs font-medium text-slate-600 mb-1">Mã kiểm kê *</label>
								<input
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition"
									value={form.maKK}
									onChange={(e) => setForm({ ...form, maKK: e.target.value })}
									required
									disabled={!!editing}
								/>
							</div>
							<div>
								<label className="block text-xs font-medium text-slate-600 mb-1">Ngày kiểm kê *</label>
								<input
									type="date"
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition"
									value={form.ngayKiemKe}
									onChange={(e) => setForm({ ...form, ngayKiemKe: e.target.value })}
									required
								/>
							</div>
							<div>
								<label className="block text-xs font-medium text-slate-600 mb-1">Người kiểm kê *</label>
								<input
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition"
									value={form.nguoiKiemKe}
									onChange={(e) => setForm({ ...form, nguoiKiemKe: e.target.value })}
									required
								/>
							</div>
							<div>
								<label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
								<select
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition"
									value={form.trangThai}
									onChange={(e) => setForm({ ...form, trangThai: e.target.value as any })}
								>
									<option value="dang-tien-hanh">Đang tiến hành</option>
									<option value="hoan-thanh">Hoàn thành</option>
									<option value="huy-bo">Hủy bỏ</option>
								</select>
							</div>
						</div>
						<div className="mt-3">
							<label className="block text-xs font-medium text-slate-600 mb-1">Ghi chú</label>
							<textarea
								className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition"
								rows={3}
								value={form.ghiChu}
								onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
								placeholder="Ghi chú về phiếu kiểm kê..."
							/>
						</div>
					</div>

					{/* Chi tiết kiểm kê */}
					<div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
						<div className="flex items-center justify-between mb-3">
							<div>
								<p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
									<FileText className="w-4 h-4 text-sky-500" />
									Chi tiết kiểm kê *
								</p>
								<p className="text-[11px] text-slate-500 mt-0.5">Chọn hàng hóa và nhập số lượng thực tế</p>
							</div>
							<Button variant="secondary" onClick={addChiTiet}>
								<Plus className="w-3 h-3 mr-1" />
								Thêm sản phẩm
							</Button>
						</div>
						<div className="space-y-3 max-h-96 overflow-y-auto pr-1">
							{chiTietKiemKe.map((ct, index) => (
								<div key={index} className="border border-sky-100 rounded-xl p-3 bg-white/80 shadow-sm">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
										<div>
											<label className="block text-xs mb-1 text-slate-600">Mã hàng hóa *</label>
											<select
												className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none"
												value={ct.mahh}
												onChange={(e) => updateChiTiet(index, 'mahh', e.target.value)}
												required
											>
												<option value="">-- Chọn hàng hóa --</option>
												{hangHoaList.map((hh) => (
													<option key={hh.MaHH} value={hh.MaHH}>
														{hh.MaHH} - {hh.TenHH}
													</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-xs mb-1 text-slate-600">Tên hàng hóa</label>
											<input
												className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
												value={ct.tenhh}
												readOnly
											/>
										</div>
										<div>
											<label className="block text-xs mb-1 text-slate-600">Số lượng sổ sách</label>
											<input
												type="number"
												className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
												value={ct.soLuongSach}
												onChange={(e) => updateChiTiet(index, 'soLuongSach', parseInt(e.target.value) || 0)}
											/>
										</div>
										<div>
											<label className="block text-xs mb-1 text-slate-600">Số lượng thực tế *</label>
											<input
												type="number"
												className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
												value={ct.soLuongThucTe}
												onChange={(e) => updateChiTiet(index, 'soLuongThucTe', parseInt(e.target.value) || 0)}
												required
											/>
										</div>
										<div>
											<label className="block text-xs mb-1 text-slate-600">Chênh lệch</label>
											<input
												type="number"
												className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-medium ${
													ct.chenhLech > 0 ? 'text-emerald-600' : ct.chenhLech < 0 ? 'text-rose-600' : 'text-slate-600'
												}`}
												value={ct.chenhLech}
												readOnly
											/>
										</div>
										<div>
											<label className="block text-xs mb-1 text-slate-600">Lý do</label>
											<input
												className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
												value={ct.lyDo || ''}
												onChange={(e) => updateChiTiet(index, 'lyDo', e.target.value)}
												placeholder="Lý do chênh lệch..."
											/>
										</div>
									</div>
									<button
										type="button"
										onClick={() => removeChiTiet(index)}
										className="mt-2 text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
									>
										<Trash2 className="w-3 h-3" />
										<span>Xóa dòng này</span>
									</button>
								</div>
							))}
							{chiTietKiemKe.length === 0 && (
								<div className="text-center py-4 text-slate-400 text-sm">Chưa có chi tiết kiểm kê</div>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-3">
						<Button variant="secondary" onClick={() => setOpenModal(false)}>
							Hủy
						</Button>
						<Button onClick={handleSave}>
							{editing ? '💾 Lưu' : '➕ Tạo'}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Modal: Detail - Design đẹp hơn với chi tiết */}
			<Modal open={openDetailModal} onClose={() => setOpenDetailModal(false)} title="">
				{selectedKK && (
					<div className="space-y-6">
						{/* Header với gradient */}
						<div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white p-6 rounded-xl -mt-6 -mx-6 mb-4">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-bold mb-1">Chi tiết phiếu kiểm kê</h2>
									<p className="text-amber-100 text-sm">Inventory Check Details</p>
								</div>
								<div className="text-right">
									<div className="text-sm text-amber-100 mb-1">Mã phiếu</div>
									<div className="text-3xl font-bold">{selectedKK.maKK}</div>
								</div>
							</div>
						</div>

						{/* Thông tin phiếu */}
						<div className="grid md:grid-cols-2 gap-4">
							<div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100">
								<div className="flex items-center gap-2 mb-3">
									<div className="w-2 h-2 bg-amber-600 rounded-full"></div>
									<h3 className="font-semibold text-gray-800">Thông tin cơ bản</h3>
								</div>
								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span className="text-gray-600">Ngày kiểm kê:</span>
										<span className="font-medium text-gray-900">{new Date(selectedKK.ngayKiemKe).toLocaleDateString('vi-VN')}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Người kiểm kê:</span>
										<span className="font-medium text-gray-900">{selectedKK.nguoiKiemKe}</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-br from-red-50 to-pink-50 p-5 rounded-xl border border-red-100">
								<div className="flex items-center gap-2 mb-3">
									<div className="w-2 h-2 bg-red-600 rounded-full"></div>
									<h3 className="font-semibold text-gray-800">Trạng thái</h3>
								</div>
								<div className="space-y-3 text-sm">
									<div className="flex justify-between items-center">
										<span className="text-gray-600">Trạng thái:</span>
										<span className={`px-3 py-1 text-xs rounded-full font-semibold ${getTrangThaiColor(selectedKK.trangThai)}`}>
											{getTrangThaiLabel(selectedKK.trangThai)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Số sản phẩm:</span>
										<span className="font-bold text-gray-900">{selectedKK.chiTiet?.length || 0}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Ghi chú */}
						{selectedKK.ghiChu && (
							<div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
								<div className="text-sm font-semibold text-gray-700 mb-2">📝 Ghi chú:</div>
								<p className="text-sm text-gray-600">{selectedKK.ghiChu}</p>
							</div>
						)}

						{/* Chi tiết kiểm kê */}
						{selectedKK.chiTiet && selectedKK.chiTiet.length > 0 ? (
							<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
								<div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
									<h3 className="font-semibold text-gray-800 flex items-center gap-2">
										📋 Chi tiết kiểm kê ({selectedKK.chiTiet.length} sản phẩm)
									</h3>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="bg-gray-50 border-b border-gray-200">
												<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
												<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã HH</th>
												<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tên hàng</th>
												<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Sổ sách</th>
												<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thực tế</th>
												<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Chênh lệch</th>
												<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lý do</th>
											</tr>
										</thead>
										<tbody>
											{selectedKK.chiTiet.map((ct, i) => (
												<tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
													<td className="px-4 py-3 text-sm text-gray-600">{i + 1}</td>
													<td className="px-4 py-3 text-sm font-medium text-gray-900">{ct.mahh}</td>
													<td className="px-4 py-3 text-sm text-gray-700">{ct.tenhh}</td>
													<td className="px-4 py-3 text-sm text-right text-gray-600">{ct.soLuongSach}</td>
													<td className="px-4 py-3 text-sm text-right text-gray-700">{ct.soLuongThucTe}</td>
													<td className={`px-4 py-3 text-sm text-right font-semibold ${
														ct.chenhLech > 0 ? 'text-green-600' : ct.chenhLech < 0 ? 'text-red-600' : 'text-gray-600'
													}`}>
														{ct.chenhLech > 0 ? '+' : ''}{ct.chenhLech}
													</td>
													<td className="px-4 py-3 text-sm text-gray-600">{ct.lyDo || '-'}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						) : (
							<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
								<p className="text-yellow-800 font-medium">Chưa có chi tiết kiểm kê</p>
							</div>
						)}

						{/* Actions */}
						<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
							<Button variant="secondary" onClick={() => setOpenDetailModal(false)}>
								Đóng
							</Button>
							{selectedKK.trangThai === 'dang-tien-hanh' && (
								<Button onClick={() => { setOpenDetailModal(false); openEdit(selectedKK); }}>
									✏️ Sửa
								</Button>
							)}
						</div>
					</div>
				)}
			</Modal>

			{/* Modal: Chi tiết kiểm kê */}
			<Modal open={openChiTietModal} onClose={() => setOpenChiTietModal(false)} title={`Chi tiết kiểm kê ${selectedKK?.maKK}`}>
				{selectedKK && (
					<div className="space-y-4">
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left bg-gray-50 text-gray-600 border-b">
										<th className="py-2 px-4 font-medium">STT</th>
										<th className="py-2 px-4 font-medium">Mã HH</th>
										<th className="py-2 px-4 font-medium">Tên hàng hóa</th>
										<th className="py-2 px-4 font-medium text-right">Sổ sách</th>
										<th className="py-2 px-4 font-medium text-right">Thực tế</th>
										<th className="py-2 px-4 font-medium text-right">Chênh lệch</th>
										<th className="py-2 px-4 font-medium">Lý do</th>
									</tr>
								</thead>
								<tbody>
									{selectedKK.chiTiet?.map((ct, i) => (
										<tr key={i} className="border-b hover:bg-gray-50">
											<td className="py-2 px-4">{i + 1}</td>
											<td className="py-2 px-4 font-medium">{ct.mahh}</td>
											<td className="py-2 px-4">{ct.tenhh}</td>
											<td className="py-2 px-4 text-right">{ct.soLuongSach}</td>
											<td className="py-2 px-4 text-right">{ct.soLuongThucTe}</td>
											<td
												className={`py-2 px-4 text-right font-medium ${
													ct.chenhLech > 0 ? 'text-green-600' : ct.chenhLech < 0 ? 'text-red-600' : 'text-gray-600'
												}`}
											>
												{ct.chenhLech > 0 ? '+' : ''}
												{ct.chenhLech}
											</td>
											<td className="py-2 px-4 text-sm text-gray-600">{ct.lyDo || '-'}</td>
										</tr>
									))}
									{(!selectedKK.chiTiet || selectedKK.chiTiet.length === 0) && (
										<tr>
											<td colSpan={7} className="py-6 text-center text-gray-500">
												Chưa có chi tiết
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onClick={() => setOpenChiTietModal(false)}>
								Đóng
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}


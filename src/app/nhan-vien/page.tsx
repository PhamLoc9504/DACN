'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { Edit3, Trash2 } from 'lucide-react';

type Row = {
	MaNV: string;
	HoTen: string | null;
	NgaySinh: string | null;
	ChucVu: string | null;
		DienThoai: string | null;
};

export default function NhanVienPage() {
	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState(true);
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	const [openModal, setOpenModal] = useState(false);
	const [openDetailModal, setOpenDetailModal] = useState(false);
	const [editing, setEditing] = useState<Row | null>(null);
	const [selectedNV, setSelectedNV] = useState<Row | null>(null);
	const [form, setForm] = useState({ MaNV: '', HoTen: '', NgaySinh: '', ChucVu: '', DienThoai: '' });
	const [saving, setSaving] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function loadData() {
		setLoading(true);
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		params.set('page', String(page));
		params.set('limit', String(limit));
		const res = await fetch(`/api/nhan-vien?${params.toString()}`).then((r) => r.json());
		setRows(res.data || []);
		setTotal(res.total || 0);
		setLoading(false);
	}

	function openDetail(row: Row) {
		setSelectedNV(row);
		setOpenDetailModal(true);
	}

	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [q, page, limit]);

	function openCreateModal() {
		setEditing(null);
		setForm({ MaNV: '', HoTen: '', NgaySinh: '', ChucVu: '', DienThoai: '' });
		setErrorMsg(null);
		setOpenModal(true);
	}

	function openEditModal(row: Row) {
		setEditing(row);
		setForm({
			MaNV: row.MaNV,
			HoTen: row.HoTen || '',
			NgaySinh: row.NgaySinh || '',
			ChucVu: row.ChucVu || '',
			DienThoai: row.DienThoai || '',
		});
		setErrorMsg(null);
		setOpenModal(true);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setErrorMsg(null);
		try {
			const payload = {
				MaNV: form.MaNV.trim(),
				HoTen: form.HoTen.trim(),
				NgaySinh: form.NgaySinh || null,
				ChucVu: form.ChucVu || null,
				DienThoai: form.DienThoai || null,
			};
			const method = editing ? 'PUT' : 'POST';
			const url = editing ? `/api/nhan-vien/${editing.MaNV}` : '/api/nhan-vien';
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (!res.ok) {
				setErrorMsg(data.error || 'Không thể lưu dữ liệu');
				return;
			}
			setOpenModal(false);
			loadData();
		} catch (err: any) {
			setErrorMsg(err.message || 'Có lỗi xảy ra');
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(maNV: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
		const res = await fetch(`/api/nhan-vien/${maNV}`, { method: 'DELETE' });
		const data = await res.json();
		if (!res.ok) {
			alert(data.error || 'Xóa thất bại');
			return;
		}
		loadData();
	}

	return (
		<div className="space-y-6 bg-slate-100 min-h-screen p-6 text-slate-900">
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
					<h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 text-white text-lg shadow-md">
							👩‍💼
						</span>
						<span>Quản lý nhân viên</span>
					</h1>
					<Button onClick={openCreateModal}>➕ Thêm nhân viên</Button>
				</div>
				<div className="grid md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm mb-1 text-slate-600">Tìm kiếm</label>
						<input
							className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-slate-400"
							placeholder="Tên hoặc SĐT..."
							value={q}
							onChange={(e) => {
								setPage(1);
								setQ(e.target.value);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-slate-600">Hiển thị</label>
						<select
							className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition"
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
			</div>

			<div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left bg-slate-50 text-slate-600 border-b border-gray-200">
							<th className="py-3 px-4 font-medium">Mã NV</th>
							<th className="py-3 px-4 font-medium">Họ tên</th>
							<th className="py-3 px-4 font-medium">Ngày sinh</th>
							<th className="py-3 px-4 font-medium">Chức vụ</th>
							<th className="py-3 px-4 font-medium">Điện thoại</th>
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
							rows.map((r) => (
								<tr
									key={r.MaNV}
									className="border-b border-gray-200 hover:bg-slate-50 transition cursor-pointer"
									onClick={() => openDetail(r)}
								>
									<td className="py-3 px-4 font-medium text-slate-700">{r.MaNV}</td>
									<td className="py-3 px-4">{r.HoTen}</td>
									<td className="py-3 px-4 text-slate-600">{r.NgaySinh || '-'}</td>
									<td className="py-3 px-4 text-indigo-600 font-semibold">{r.ChucVu || '-'}</td>
									<td className="py-3 px-4 text-slate-700">{r.DienThoai || '-'}</td>
								</tr>
							))}

						{!loading && rows.length === 0 && (
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

			<Modal
				open={openModal}
				onClose={() => {
					setOpenModal(false);
					setErrorMsg(null);
				}}
				title={editing ? 'Sửa nhân viên' : 'Thêm nhân viên'}
			>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm mb-1 text-slate-600">Mã nhân viên *</label>
							<input
								className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
								value={form.MaNV}
								onChange={(e) => setForm({ ...form, MaNV: e.target.value })}
								placeholder="VD: NV01"
								required
								disabled={!!editing}
							/>
						</div>
						<div>
							<label className="block text-sm mb-1 text-slate-600">Họ tên *</label>
							<input
								className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
								value={form.HoTen}
								onChange={(e) => setForm({ ...form, HoTen: e.target.value })}
								required
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm mb-1 text-slate-600">Ngày sinh</label>
							<input
								type="date"
								className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
								value={form.NgaySinh}
								onChange={(e) => setForm({ ...form, NgaySinh: e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-sm mb-1 text-slate-600">Chức vụ</label>
							<input
								className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
								value={form.ChucVu}
								onChange={(e) => setForm({ ...form, ChucVu: e.target.value })}
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm mb-1 text-slate-600">Điện thoại</label>
						<input
							className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
							value={form.DienThoai}
							onChange={(e) => setForm({ ...form, DienThoai: e.target.value })}
							placeholder="VD: 090..."
						/>
					</div>
					{errorMsg && (
						<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
							{errorMsg}
						</div>
					)}
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={() => setOpenModal(false)}>
							Hủy
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm mới'}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}

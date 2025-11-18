'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import TableActions from '@/components/TableActions';
import { Edit3, Trash2 } from 'lucide-react';
import type { Tables } from '@/lib/supabaseClient';

type Row = Tables['NhaCC'];

export default function NhaCungCapPage() {
	const [rows, setRows] = useState<Row[]>([]);
	const [q, setQ] = useState('');
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	const [openModal, setOpenModal] = useState(false);
	const [editing, setEditing] = useState<Row | null>(null);
	const [form, setForm] = useState({ MaNCC: '', TenNCC: '', DiaChi: '', SDT: '' });
	const [saving, setSaving] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function loadData() {
		setLoading(true);
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		params.set('page', String(page));
		params.set('limit', String(limit));
		const res = await fetch(`/api/nha-cc?${params.toString()}`).then((r) => r.json());
		setRows(res.data || []);
		setTotal(res.total || 0);
		setLoading(false);
	}

	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [q, page, limit]);

	function openCreateModal() {
		setEditing(null);
		setForm({ MaNCC: '', TenNCC: '', DiaChi: '', SDT: '' });
		setErrorMsg(null);
		setOpenModal(true);
	}

	function openEditModal(row: Row) {
		setEditing(row);
		setForm({
			MaNCC: row.MaNCC,
			TenNCC: row.TenNCC || '',
			DiaChi: row.DiaChi || '',
			SDT: row.SDT || '',
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
				MaNCC: form.MaNCC.trim(),
				TenNCC: form.TenNCC.trim(),
				DiaChi: form.DiaChi || null,
				SDT: form.SDT || null,
			};
			const method = editing ? 'PUT' : 'POST';
			const url = editing ? `/api/nha-cc/${editing.MaNCC}` : '/api/nha-cc';
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

	async function handleDelete(maNCC: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) return;
		const res = await fetch(`/api/nha-cc/${maNCC}`, { method: 'DELETE' });
		const data = await res.json();
		if (!res.ok) {
			alert(data.error || 'Xóa thất bại');
			return;
		}
		loadData();
	}

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
					<h1 className="text-2xl font-semibold mb-0 text-[#d47b8a]">🏢 Quản lý nhà cung cấp</h1>
					<Button onClick={openCreateModal}>➕ Thêm nhà cung cấp</Button>
				</div>
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
							placeholder="Nhập tên hoặc SĐT nhà cung cấp..."
							value={q}
							onChange={(e) => {
								setPage(1);
								setQ(e.target.value);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Hiển thị</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
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

			<div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
							<th className="py-3 px-4 font-medium">Mã NCC</th>
							<th className="py-3 px-4 font-medium">Tên nhà cung cấp</th>
							<th className="py-3 px-4 font-medium">SĐT</th>
							<th className="py-3 px-4 font-medium">Địa chỉ</th>
							<th className="py-3 px-4 font-medium">Thao tác</th>
						</tr>
					</thead>
					<tbody>
						{loading &&
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={i} className="border-b border-[#f5ebe0] animate-pulse">
									{Array.from({ length: 5 }).map((_, j) => (
										<td key={j} className="py-3 px-4">
											<div className="h-4 w-24 bg-[#f9dfe3] rounded" />
										</td>
									))}
								</tr>
							))}

						{!loading &&
							rows.map((r) => (
								<tr key={r.MaNCC} className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition">
									<td className="py-3 px-4 font-medium">{r.MaNCC}</td>
									<td className="py-3 px-4">{r.TenNCC}</td>
									<td className="py-3 px-4 text-gray-700">{r.SDT || '-'}</td>
									<td className="py-3 px-4 text-gray-600">{r.DiaChi || '-'}</td>
									<td className="py-3 px-4">
										<TableActions
											actions={[
												{
													label: 'Sửa',
													icon: <Edit3 className="w-3.5 h-3.5" />,
													onClick: () => openEditModal(r),
													tone: 'edit',
												},
												{
													label: 'Xóa',
													icon: <Trash2 className="w-3.5 h-3.5" />,
													onClick: () => handleDelete(r.MaNCC),
													tone: 'danger',
												},
											]}
										/>
									</td>
								</tr>
							))}

						{!loading && rows.length === 0 && (
							<tr>
								<td colSpan={5} className="py-10 text-center text-gray-500 bg-white">
									<div className="mx-auto h-10 w-10 rounded-full bg-[#fce7ec] mb-3" />
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
				title={editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
			>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm mb-1 text-gray-500">Mã nhà cung cấp *</label>
							<input
								className="w-full border rounded px-3 py-2"
								value={form.MaNCC}
								onChange={(e) => setForm({ ...form, MaNCC: e.target.value })}
								required
								disabled={!!editing}
							/>
						</div>
						<div>
							<label className="block text-sm mb-1 text-gray-500">Tên nhà cung cấp *</label>
							<input
								className="w-full border rounded px-3 py-2"
								value={form.TenNCC}
								onChange={(e) => setForm({ ...form, TenNCC: e.target.value })}
								required
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Số điện thoại</label>
						<input
							className="w-full border rounded px-3 py-2"
							value={form.SDT}
							onChange={(e) => setForm({ ...form, SDT: e.target.value })}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Địa chỉ</label>
						<textarea
							className="w-full border rounded px-3 py-2"
							rows={3}
							value={form.DiaChi}
							onChange={(e) => setForm({ ...form, DiaChi: e.target.value })}
						/>
					</div>
					{errorMsg && (
						<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
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

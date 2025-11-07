'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { type Tables } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function KhachHangPage() {
	const [rows, setRows] = useState<Tables['KhachHang'][]>([]);
	const [q, setQ] = useState('');
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	// Modal states
	const [openModal, setOpenModal] = useState(false);
	const [openDetailModal, setOpenDetailModal] = useState(false);
	const [editing, setEditing] = useState<Tables['KhachHang'] | null>(null);
	const [selectedKH, setSelectedKH] = useState<Tables['KhachHang'] | null>(null);
	const [form, setForm] = useState<Partial<Tables['KhachHang']>>({
		MaKH: '',
		TenKH: '',
		SDT: '',
		DiaChi: '',
	});

	useEffect(() => {
		loadData();
	}, [q, page, limit]);

	async function loadData() {
		setLoading(true);
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		params.set('page', String(page));
		params.set('limit', String(limit));
		const res = await fetch(`/api/khach-hang?${params.toString()}`, {
			credentials: 'include',
		}).then((r) => r.json());
		if (res.error) {
			alert(res.error);
			setLoading(false);
			return;
		}
		setRows(res.data || []);
		setTotal(res.total || 0);
		setLoading(false);
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
			loadData();
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
			loadData();
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
			loadData();
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

	function openEdit(kh: Tables['KhachHang']) {
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

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			{/* --- Bộ lọc & tìm kiếm --- */}
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<div className="flex items-center justify-between mb-5">
					<h1 className="text-2xl font-semibold text-[#d47b8a]">👥 Quản lý khách hàng</h1>
					<Button onClick={openCreate}>
						<Plus className="w-4 h-4 mr-2" />
						Thêm khách hàng
					</Button>
				</div>
				<div className="grid md:grid-cols-3 gap-4">
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
							placeholder="Nhập tên, SĐT hoặc mã KH..."
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

			{/* --- Bảng dữ liệu --- */}
			<div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
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
						{loading &&
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={`sk-${i}`} className="border-b border-[#f5ebe0] animate-pulse">
									{Array.from({ length: 5 }).map((_, j) => (
										<td key={j} className="py-3 px-4">
											<div className="h-4 w-28 bg-[#f9dfe3] rounded" />
										</td>
									))}
								</tr>
							))}

						{!loading &&
							rows.map((r) => (
								<tr key={r.MaKH} className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition">
									<td className="py-3 px-4 font-medium">{r.MaKH}</td>
									<td className="py-3 px-4">{r.TenKH}</td>
									<td className="py-3 px-4 text-gray-700">{r.SDT || '-'}</td>
									<td className="py-3 px-4 text-gray-700">{r.DiaChi || '-'}</td>
									<td className="py-3 px-4">
										<div className="flex gap-2 justify-center">
											<button
												onClick={() => openDetail(r.MaKH)}
												className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
											>
												<Eye className="w-3 h-3 inline mr-1" />
												Xem
											</button>
											<button
												onClick={() => openEdit(r)}
												className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
											>
												<Edit className="w-3 h-3 inline mr-1" />
												Sửa
											</button>
											<button
												onClick={() => handleDelete(r.MaKH)}
												className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
											>
												<Trash2 className="w-3 h-3 inline mr-1" />
												Xóa
											</button>
										</div>
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

			{/* --- Phân trang --- */}
			<div className="flex justify-center pt-4">
				<Pagination page={page} limit={limit} total={total} onChange={setPage} />
			</div>

			{/* Modal: Create/Edit */}
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
							value={form.TenKH}
							onChange={(e) => setForm({ ...form, TenKH: e.target.value })}
							required
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Số điện thoại</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={form.SDT}
							onChange={(e) => setForm({ ...form, SDT: e.target.value })}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Địa chỉ</label>
						<textarea
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={form.DiaChi}
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

			{/* Modal: Detail */}
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

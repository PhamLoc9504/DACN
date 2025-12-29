'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { formatVietnamDate } from '@/lib/dateUtils';
import {
	ASSIGNABLE_ROLES,
	ROLE_BADGE_COLORS,
	ROLE_DISPLAY_NAME,
	UserRole,
	resolveUserRole,
} from '@/lib/roles';
import ErrorDisplay from '@/components/ErrorDisplay';
import { handleApiError, formatErrorForDisplay } from '@/lib/errorHandler';

type TaiKhoan = {
	MaTK: string;
	TenDangNhap: string;
	MaNV: string | null;
	VaiTro: string;
	TrangThai: string;
	NgayTao: string | null;
	LanDangNhapCuoi: string | null;
};

type NhanVien = {
	MaNV: string;
	HoTen: string | null;
};

export default function QuanLyTaiKhoanPage() {
	const [rows, setRows] = useState<TaiKhoan[]>([]);
	const [nhanVienList, setNhanVienList] = useState<NhanVien[]>([]);
	const [q, setQ] = useState('');
	const [vaitro, setVaitro] = useState('');
	const [trangthai, setTrangthai] = useState('');
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState<TaiKhoan | null>(null);
	const [formData, setFormData] = useState({
		tendangnhap: '',
		matkhau: '',
		manv: '',
		vaitro: UserRole.WAREHOUSE_STAFF,
		trangthai: 'Hoạt động',
	});
	const [error, setError] = useState<ReturnType<typeof formatErrorForDisplay> | null>(null);

	useEffect(() => {
		loadData();
		loadNhanVien();
	}, [q, vaitro, trangthai, page, limit]);

	async function loadData() {
		setLoading(true);
		setError(null);
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (vaitro) params.set('vaitro', vaitro);
		if (trangthai) params.set('trangthai', trangthai);
		params.set('page', String(page));
		params.set('limit', String(limit));
		try {
			const res = await fetch(`/api/tai-khoan?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());
			if (res.error) {
				const appError = handleApiError(res);
				setError(formatErrorForDisplay(appError));
				setLoading(false);
				return;
			}
			setRows(res.data || []);
			setTotal(res.total || 0);
			setLoading(false);
		} catch (err) {
			const appError = handleApiError(err);
			setError(formatErrorForDisplay(appError));
			setLoading(false);
		}
	}

	async function loadNhanVien() {
		const res = await fetch('/api/nhan-vien', {
			credentials: 'include',
		}).then((r) => r.json());
		if (res.data) {
			setNhanVienList(res.data);
		}
	}

	function openModal(item?: TaiKhoan) {
		if (item) {
			setEditing(item);
			setFormData({
				tendangnhap: item.TenDangNhap,
				matkhau: '',
				manv: item.MaNV || '',
				vaitro: resolveUserRole(item.VaiTro) ?? UserRole.WAREHOUSE_STAFF,
				trangthai: item.TrangThai,
			});
		} else {
			setEditing(null);
			setFormData({
				tendangnhap: '',
				matkhau: '',
				manv: '',
				vaitro: UserRole.WAREHOUSE_STAFF,
				trangthai: 'Hoạt động',
			});
		}
		setShowModal(true);
	}

	function closeModal() {
		setShowModal(false);
		setEditing(null);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!editing && !formData.matkhau) {
			const appError = handleApiError({ error: 'Vui lòng nhập mật khẩu', statusCode: 400 });
			setError(formatErrorForDisplay(appError));
			return;
		}

		try {
			const url = editing ? `/api/tai-khoan/${editing.MaTK}` : '/api/tai-khoan';
			const method = editing ? 'PUT' : 'POST';
			const body: any = {
				manv: formData.manv || null,
				vaitro: formData.vaitro,
				trangthai: formData.trangthai,
			};
			if (formData.matkhau) {
				body.matkhau = formData.matkhau;
			}
			if (!editing) {
				body.tendangnhap = formData.tendangnhap;
			}

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				credentials: 'include',
			});

			const data = await res.json();
			if (!res.ok) {
				const appError = handleApiError(data);
				setError(formatErrorForDisplay(appError));
				return;
			}

			closeModal();
			loadData();
		} catch (err: any) {
			const appError = handleApiError(err);
			setError(formatErrorForDisplay(appError));
		}
	}

	async function handleDelete(matk: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;

		try {
			const res = await fetch(`/api/tai-khoan/${matk}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			const data = await res.json();
			if (!res.ok) {
				const appError = handleApiError(data);
				setError(formatErrorForDisplay(appError));
				return;
			}

			loadData();
		} catch (err: any) {
			const appError = handleApiError(err);
			setError(formatErrorForDisplay(appError));
		}
	}

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			{error && (
				<ErrorDisplay
					error={error}
					onDismiss={() => setError(null)}
				/>
			)}
			{/* --- Bộ lọc & tìm kiếm --- */}
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<div className="flex items-center justify-between mb-5">
					<h1 className="text-2xl font-semibold text-[#d47b8a]">🔐 Quản lý tài khoản</h1>
					<Button onClick={() => openModal()}>➕ Tạo tài khoản</Button>
				</div>
				<div className="grid md:grid-cols-4 gap-4">
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
							placeholder="Tên đăng nhập hoặc mã tài khoản..."
							value={q}
							onChange={(e) => {
								setPage(1);
								setQ(e.target.value);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Vai trò</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={vaitro}
							onChange={(e) => {
								setPage(1);
								setVaitro(e.target.value);
							}}
						>
							<option value="">Tất cả</option>
							{ASSIGNABLE_ROLES.map((role) => (
								<option key={role} value={role}>
									{ROLE_DISPLAY_NAME[role]}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Trạng thái</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={trangthai}
							onChange={(e) => {
								setPage(1);
								setTrangthai(e.target.value);
							}}
						>
							<option value="">Tất cả</option>
							<option value="Hoạt động">Hoạt động</option>
							<option value="Khóa">Khóa</option>
						</select>
					</div>
				</div>
			</div>

			{/* --- Bảng dữ liệu --- */}
			<div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
							<th className="py-3 px-4 font-medium">Mã TK</th>
							<th className="py-3 px-4 font-medium">Tên đăng nhập</th>
							<th className="py-3 px-4 font-medium">Mã NV</th>
							<th className="py-3 px-4 font-medium">Vai trò</th>
							<th className="py-3 px-4 font-medium">Trạng thái</th>
							<th className="py-3 px-4 font-medium">Ngày tạo</th>
							<th className="py-3 px-4 font-medium">Hành động</th>
						</tr>
					</thead>
					<tbody>
						{loading &&
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={`sk-${i}`} className="border-b border-[#f5ebe0] animate-pulse">
									{Array.from({ length: 7 }).map((_, j) => (
										<td key={j} className="py-3 px-4">
											<div className="h-4 w-28 bg-[#f9dfe3] rounded" />
										</td>
									))}
								</tr>
							))}

						{!loading &&
							rows.map((r) => (
								<tr
									key={r.MaTK}
									className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition cursor-pointer"
									onClick={() => openModal(r)}
								>
									<td className="py-3 px-4 font-medium">{r.MaTK}</td>
									<td className="py-3 px-4">{r.TenDangNhap}</td>
									<td className="py-3 px-4 text-gray-600">{r.MaNV || '-'}</td>
									<td className="py-3 px-4">
										{(() => {
											const resolvedRole = resolveUserRole(r.VaiTro);
											const badgeColor = resolvedRole ? ROLE_BADGE_COLORS[resolvedRole] : '#9ca3af';
											const badgeLabel = resolvedRole ? ROLE_DISPLAY_NAME[resolvedRole] : r.VaiTro;
											return (
												<span
													className="px-2 py-1 rounded-full text-xs font-semibold"
													style={{
														color: badgeColor,
														backgroundColor: `${badgeColor}1a`,
													}}
												>
													{badgeLabel}
												</span>
											);
										})()}
									</td>
									<td className="py-3 px-4">
										<span className={`px-2 py-1 rounded-full text-xs font-semibold ${
											r.TrangThai === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
										}`}>
											{r.TrangThai}
										</span>
									</td>
									<td className="py-3 px-4 text-gray-600 text-xs">
										{r.NgayTao ? formatVietnamDate(r.NgayTao) : '-'}
									</td>
									<td className="py-3 px-4">
										<div className="flex gap-2">
											<button
												onClick={() => openModal(r)}
												className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
											>
												✏️ Sửa
											</button>
											<button
												onClick={() => handleDelete(r.MaTK)}
												className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
											>
												🗑️ Xóa
											</button>
										</div>
									</td>
								</tr>
							))}

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

			{/* --- Modal tạo/sửa --- */}
			<Modal open={showModal} onClose={closeModal} title={editing ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}>
				<form onSubmit={handleSubmit} className="space-y-4">
					{!editing && (
						<div>
							<label className="block text-sm mb-1 text-gray-500">Tên đăng nhập *</label>
							<input
								type="text"
								className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
								value={formData.tendangnhap}
								onChange={(e) => setFormData({ ...formData, tendangnhap: e.target.value })}
								required
							/>
						</div>
					)}
					<div>
						<label className="block text-sm mb-1 text-gray-500">
							Mật khẩu {editing ? '(để trống nếu không đổi)' : '*'}
						</label>
						<input
							type="password"
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={formData.matkhau}
							onChange={(e) => setFormData({ ...formData, matkhau: e.target.value })}
							required={!editing}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Nhân viên (tùy chọn)</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={formData.manv}
							onChange={(e) => setFormData({ ...formData, manv: e.target.value })}
						>
							<option value="">-- Không gán --</option>
							{nhanVienList.map((nv) => (
								<option key={nv.MaNV} value={nv.MaNV}>
									{nv.MaNV} - {nv.HoTen || 'N/A'}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Vai trò *</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={formData.vaitro}
							onChange={(e) => setFormData({ ...formData, vaitro: e.target.value as UserRole })}
							required
						>
							{ASSIGNABLE_ROLES.map((role) => (
								<option key={role} value={role}>
									{ROLE_DISPLAY_NAME[role]}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Trạng thái *</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={formData.trangthai}
							onChange={(e) => setFormData({ ...formData, trangthai: e.target.value })}
							required
						>
							<option value="Hoạt động">Hoạt động</option>
							<option value="Khóa">Khóa</option>
						</select>
					</div>
					<div className="flex gap-3 pt-4">
						<Button type="submit" className="flex-1">
							{editing ? '💾 Lưu thay đổi' : '➕ Tạo mới'}
						</Button>
						<Button type="button" onClick={closeModal} variant="secondary" className="flex-1">
							Hủy
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}


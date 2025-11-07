'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import Button from '@/components/Button';

type AuditLog = {
	id: number;
	maTk: string;
	maNV: string | null;
	loaiHanhDong: string;
	bang: string | null;
	idRecord: string | null;
	chiTiet: string | null;
	ipAddress: string;
	userAgent: string;
	thoiGian: string;
	trangThai: string;
	loi: string | null;
};

const LOAI_HANH_DONG = ['', 'DANG_NHAP', 'DANG_XUAT', 'TAO', 'SUA', 'XOA', 'XEM', 'XUAT_BAO_CAO', 'XUAT_CSV', 'XUAT_PDF'];
const BANG = ['', 'hoadon', 'phieunhap', 'phieuxuat', 'hanghoa', 'khachhang', 'nhacc', 'nhanvien', 'taikhoan'];

export default function NhatKyPage() {
	const [rows, setRows] = useState<AuditLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(50);
	const [total, setTotal] = useState(0);
	const [filters, setFilters] = useState({
		loai: '',
		bang: '',
		from: '',
		to: '',
	});

	useEffect(() => {
		async function load() {
			setLoading(true);
			const params = new URLSearchParams();
			params.set('page', String(page));
			params.set('limit', String(limit));
			if (filters.loai) params.set('loai', filters.loai);
			if (filters.bang) params.set('bang', filters.bang);
			if (filters.from) params.set('from', filters.from);
			if (filters.to) params.set('to', filters.to);
			const res = await fetch(`/api/audit-log?${params.toString()}`, {
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
		load();
	}, [page, limit, filters]);

	function getActionLabel(loai: string): string {
		const map: Record<string, string> = {
			DANG_NHAP: '🔐 Đăng nhập',
			DANG_XUAT: '🚪 Đăng xuất',
			TAO: '➕ Tạo mới',
			SUA: '✏️ Sửa',
			XOA: '🗑️ Xóa',
			XEM: '👁️ Xem',
			XUAT_BAO_CAO: '📊 Xuất báo cáo',
			XUAT_CSV: '📄 Xuất CSV',
			XUAT_PDF: '📑 Xuất PDF',
			CAP_NHAT_TRANG_THAI: '🔄 Cập nhật trạng thái',
		};
		return map[loai] || loai;
	}

	function getStatusColor(status: string): string {
		if (status === 'THANH_CONG') return 'text-green-600';
		if (status === 'THAT_BAI') return 'text-red-600';
		return 'text-yellow-600';
	}

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<h1 className="text-2xl font-semibold text-[#d47b8a] mb-5">📋 Nhật ký hoạt động</h1>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
					<div>
						<label className="block text-sm mb-1 text-gray-500">Loại hành động</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm"
							value={filters.loai}
							onChange={(e) => {
								setFilters({ ...filters, loai: e.target.value });
								setPage(1);
							}}
						>
							{LOAI_HANH_DONG.map((l) => (
								<option key={l} value={l}>
									{l || 'Tất cả'}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Bảng</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm"
							value={filters.bang}
							onChange={(e) => {
								setFilters({ ...filters, bang: e.target.value });
								setPage(1);
							}}
						>
							{BANG.map((b) => (
								<option key={b} value={b}>
									{b || 'Tất cả'}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Từ ngày</label>
						<input
							type="date"
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm"
							value={filters.from}
							onChange={(e) => {
								setFilters({ ...filters, from: e.target.value });
								setPage(1);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Đến ngày</label>
						<input
							type="date"
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm"
							value={filters.to}
							onChange={(e) => {
								setFilters({ ...filters, to: e.target.value });
								setPage(1);
							}}
						/>
					</div>
				</div>
			</div>

			<div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
								<th className="py-3 px-4 font-medium">Thời gian</th>
								<th className="py-3 px-4 font-medium">Nhân viên</th>
								<th className="py-3 px-4 font-medium">Hành động</th>
								<th className="py-3 px-4 font-medium">Bảng/Record</th>
								<th className="py-3 px-4 font-medium">IP</th>
								<th className="py-3 px-4 font-medium">Trạng thái</th>
								<th className="py-3 px-4 font-medium">Chi tiết</th>
							</tr>
						</thead>
						<tbody>
							{loading &&
								Array.from({ length: 5 }).map((_, i) => (
									<tr key={i} className="border-b border-[#f5ebe0] animate-pulse">
										{Array.from({ length: 7 }).map((_, j) => (
											<td key={j} className="py-3 px-4">
												<div className="h-4 w-20 bg-[#f9dfe3] rounded" />
											</td>
										))}
									</tr>
								))}

							{!loading &&
								rows.map((r) => (
									<tr key={r.id} className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition">
										<td className="py-3 px-4 text-slate-600">
											{new Date(r.thoiGian).toLocaleString('vi-VN')}
										</td>
										<td className="py-3 px-4 font-medium">{r.maNV || r.maTk}</td>
										<td className="py-3 px-4">{getActionLabel(r.loaiHanhDong)}</td>
										<td className="py-3 px-4 text-slate-600">
											{r.bang && (
												<span>
													{r.bang}
													{r.idRecord && ` / ${r.idRecord}`}
												</span>
											)}
										</td>
										<td className="py-3 px-4 text-xs text-slate-500">{r.ipAddress}</td>
										<td className={`py-3 px-4 font-medium ${getStatusColor(r.trangThai)}`}>
											{r.trangThai}
											{r.loi && <div className="text-xs text-red-500 mt-1">{r.loi}</div>}
										</td>
										<td className="py-3 px-4">
											{r.chiTiet && (
												<details className="cursor-pointer">
													<summary className="text-xs text-blue-600">Xem</summary>
													<pre className="mt-2 text-xs bg-slate-50 p-2 rounded max-w-md overflow-auto">
														{r.chiTiet}
													</pre>
												</details>
											)}
										</td>
									</tr>
								))}

							{!loading && rows.length === 0 && (
								<tr>
									<td colSpan={7} className="py-10 text-center text-gray-500 bg-white">
										Không có dữ liệu
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex justify-center pt-4">
				<Pagination page={page} limit={limit} total={total} onChange={setPage} />
			</div>
		</div>
	);
}


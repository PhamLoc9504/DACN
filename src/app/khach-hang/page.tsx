'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import { type Tables } from '@/lib/supabaseClient';

export default function KhachHangPage() {
	const [rows, setRows] = useState<Tables['KhachHang'][]>([]);
	const [q, setQ] = useState('');
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		async function load() {
			setLoading(true);
			const params = new URLSearchParams();
			if (q) params.set('q', q);
			params.set('page', String(page));
			params.set('limit', String(limit));
			const res = await fetch(`/api/khach-hang?${params.toString()}`).then((r) => r.json());
			setRows(res.data || []);
			setTotal(res.total || 0);
			setLoading(false);
		}
		load();
	}, [q, page, limit]);

	const filtered = rows;

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			{/* --- Bộ lọc & tìm kiếm --- */}
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<h1 className="text-2xl font-semibold mb-5 text-[#d47b8a]">👥 Quản lý khách hàng</h1>
				<div className="grid md:grid-cols-3 gap-4">
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
							placeholder="Nhập tên hoặc SĐT khách hàng..."
							value={q}
							onChange={(e) => setQ(e.target.value)}
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
						</tr>
					</thead>
					<tbody>
						{loading &&
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={`sk-${i}`} className="border-b border-[#f5ebe0] animate-pulse">
									{Array.from({ length: 4 }).map((_, j) => (
										<td key={j} className="py-3 px-4">
											<div className="h-4 w-28 bg-[#f9dfe3] rounded" />
										</td>
									))}
								</tr>
							))}

						{!loading &&
							filtered.map((r) => (
								<tr
									key={r.MaKH}
									className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition"
								>
									<td className="py-3 px-4 font-medium">{r.MaKH}</td>
									<td className="py-3 px-4">{r.TenKH}</td>
									<td className="py-3 px-4 text-gray-700">{r.SDT}</td>
									<td className="py-3 px-4 text-gray-700">{r.DiaChi}</td>
								</tr>
							))}

						{!loading && filtered.length === 0 && (
							<tr>
								<td colSpan={4} className="py-10 text-center text-gray-500 bg-white">
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
		</div>
	);
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/Pagination';
import { supabase, type Tables } from '@/lib/supabaseClient';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

export default function HangHoaPage() {
	const [rows, setRows] = useState<Tables['HangHoa'][]>([]);
	const [loading, setLoading] = useState(true);
	const [q, setQ] = useState('');
	const [loai, setLoai] = useState<string>('');
	const [loaiList, setLoaiList] = useState<Tables['LoaiHang'][]>([]);
	const [nccList, setNccList] = useState<Tables['NhaCC'][]>([]); // 🟢 thêm danh sách NCC
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<'create' | 'edit'>('create');

	const empty: Tables['HangHoa'] = {
		MaHH: '',
		TenHH: '',
		MaLoai: '',
		DonGia: 0,
		SoLuongTon: 0,
		DVT: 'Cái',
		MaNCC: '',
	} as any;
	const [form, setForm] = useState<Tables['HangHoa']>(empty);

	useEffect(() => {
		async function load() {
			setLoading(true);
			const params = new URLSearchParams();
			if (q) params.set('q', q);
			params.set('page', String(page));
			params.set('limit', String(limit));

			const [hangRes, loaiRes, nccRes] = await Promise.all([
				fetch(`/api/hang-hoa?${params.toString()}`).then((r) => r.json()),
				fetch('/api/loai-hang').then((r) => r.json()).catch(() => ({ data: [] })),
				fetch('/api/nha-cc').then((r) => r.json()).catch(() => ({ data: [] })),
			]);

			setRows(hangRes.data || []);
			setTotal(hangRes.total || 0);
			setLoaiList(loaiRes.data || []);
			setNccList(nccRes.data || []); // 🟢 load danh sách nhà cung cấp
			setLoading(false);
		}
		load();
	}, [q, page, limit]);

	const LOW_THRESHOLD = 5;

	const filtered = useMemo(
	() =>
		rows.filter((r) => {
			const byLoai = loai ? r.MaLoai === loai : true;
				const byStatus = (r as any).TrangThai ? (r as any).TrangThai !== 'Ngừng kinh doanh' : true;
			return byLoai && byStatus;
		}),
	[rows, loai]
);

	const lowStock = useMemo(() => rows.filter((r) => (r.SoLuongTon || 0) <= LOW_THRESHOLD), [rows]);

	async function refresh() {
		setPage(1);
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		params.set('page', '1');
		params.set('limit', String(limit));
		const res = await fetch(`/api/hang-hoa?${params.toString()}`).then((r) => r.json());
		setRows(res.data || []);
		setTotal(res.total || 0);
	}

	async function handleCreate() {
		await fetch('/api/hang-hoa', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		});
		setOpen(false);
		await refresh();
	}

	async function handleUpdate() {
		await fetch('/api/hang-hoa', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		});
		setOpen(false);
		await refresh();
	}

	async function adjustStock(mahh: string, delta: number) {
		const item = rows.find((r) => r.MaHH === mahh);
		if (!item) return;
		const next = Math.max(0, (item.SoLuongTon || 0) + delta);
		await supabase.from('HangHoa').update({ SoLuongTon: next }).eq('MaHH', mahh);
		setRows((prev) => prev.map((r) => (r.MaHH === mahh ? { ...r, SoLuongTon: next } as any : r)));
	}

	async function exportCSV() {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		params.set('page', '1');
		params.set('limit', '10000');
		const res = await fetch(`/api/hang-hoa?${params.toString()}`).then((r) => r.json());
		const data: Tables['HangHoa'][] = res.data || [];
		const headers = ['MaHH','TenHH','MaLoai','DonGia','SoLuongTon','DVT','MaNCC'];
		const lines = [headers.join(',')].concat(
			data.map((r) => [r.MaHH, r.TenHH, r.MaLoai, r.DonGia, r.SoLuongTon, r.DVT, r.MaNCC]
				.map((v) => (v === null || v === undefined ? '' : String(v).replace(/"/g, '""')))
				.map((v) => /[,"]/.test(v) ? '"' + v + '"' : v)
				.join(','))
		);
		const content = '\ufeff' + lines.join('\n');
		const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'hang_hoa.csv';
		a.click();
		URL.revokeObjectURL(url);
	}

async function handleDelete(id: string) {
	if (!confirm('Xóa hàng hóa này?')) return;
	try {
		const res = await fetch(`/api/hang-hoa?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		const body = await res.json().catch(() => ({}));
		if (!res.ok) {
			alert(body.error || 'Xóa thất bại. Có thể hàng hóa đang được tham chiếu trong phiếu/chi tiết.');
			return;
		}
		await refresh();
	} catch (e: any) {
		alert(e.message || 'Xóa thất bại');
	}
}

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			{/* --- Bộ lọc & tìm kiếm --- */}
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<h1 className="text-2xl font-semibold mb-5 text-[#d47b8a]">📦 Quản lý hàng hóa</h1>
				<div className="grid md:grid-cols-3 gap-4">
					<div>
						<label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
							placeholder="Nhập mã hoặc tên hàng..."
							value={q}
							onChange={(e) => setQ(e.target.value)}
						/>
					</div>

					<div>
						<label className="block text-sm mb-1 text-gray-500">Loại hàng</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={loai}
							onChange={(e) => setLoai(e.target.value)}
						>
							<option value="">Tất cả</option>
							{loaiList.map((l) => (
								<option key={l.MaLoai} value={l.MaLoai}>
									{l.TenLoai}
								</option>
							))}
						</select>
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
				<div className="md:col-span-3 flex justify-between">
					<Button variant="secondary" onClick={exportCSV}>Xuất CSV</Button>
						<Button
							variant="pink"
							onClick={() => {
								setMode('create');
								setForm(empty);
								setOpen(true);
							}}
						>
							+ Thêm hàng hóa
						</Button>
					</div>
				</div>
			</div>

			{/* --- Bảng dữ liệu --- */}
			{/* --- Cảnh báo tồn thấp --- */}
			{lowStock.length > 0 && (
				<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3">
					<span>⚠️</span>
					<div>
						<div className="font-medium">Cảnh báo tồn kho thấp</div>
						<div>Có {lowStock.length} mặt hàng có tồn ≤ {LOW_THRESHOLD}.</div>
						<div className="mt-2 flex flex-wrap gap-2">
							{lowStock.slice(0, 6).map((i) => (
								<span key={i.MaHH} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 border border-rose-200">
									<span className="font-medium">{i.MaHH}</span>
									<span className="text-rose-500">{i.SoLuongTon}</span>
								</span>
							))}
							{lowStock.length > 6 && <span className="text-rose-500">+{lowStock.length - 6} nữa</span>}
						</div>
					</div>
				</div>
			)}

			<div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
							<th className="py-3 px-4 font-medium">Mã HH</th>
							<th className="py-3 px-4 font-medium">Tên hàng</th>
							<th className="py-3 px-4 font-medium">Loại</th>
							<th className="py-3 px-4 font-medium">Đơn giá</th>
							<th className="py-3 px-4 font-medium">Tồn</th>
							<th className="py-3 px-4 font-medium">ĐVT</th>
							<th className="py-3 px-4 font-medium text-right">Thao tác</th>
						</tr>
					</thead>

					<tbody>
						{loading &&
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={i} className="border-b border-[#f5ebe0] animate-pulse">
									{Array.from({ length: 6 }).map((_, j) => (
										<td key={j} className="py-3 px-4">
											<div className="h-4 w-20 bg-[#f9dfe3] rounded" />
										</td>
									))}
								</tr>
							))}

						{!loading &&
							filtered.map((r) => (
								<tr key={r.MaHH} className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition">
									<td className="py-3 px-4 font-medium">{r.MaHH}</td>
									<td className="py-3 px-4">{r.TenHH}</td>
									<td className="py-3 px-4 text-gray-600">{r.MaLoai}</td>
									<td className="py-3 px-4 text-[#d47b8a] font-semibold">{r.DonGia?.toLocaleString('vi-VN')} ₫</td>
									<td className={`py-3 px-4 font-semibold ${(r.SoLuongTon || 0) <= LOW_THRESHOLD ? 'text-red-500' : 'text-green-600'}`}>{r.SoLuongTon}</td>
									<td className="py-3 px-4 text-gray-700">{r.DVT}</td>
									<td className="py-3 px-4 text-right">
										<div className="inline-flex items-center gap-2">
											<button title="Giảm tồn" className="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50" onClick={() => adjustStock(r.MaHH, -1)}>-1</button>
											<button title="Tăng tồn" className="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50" onClick={() => adjustStock(r.MaHH, 1)}>+1</button>
											<Button variant="secondary" onClick={() => { setMode('edit'); setForm(r as any); setOpen(true); }}>Sửa</Button>
											<Button variant="danger" onClick={() => handleDelete(r.MaHH)}>Xóa</Button>
										</div>
									</td>
								</tr>
							))}

						{!loading && filtered.length === 0 && (
							<tr>
								<td colSpan={6} className="py-10 text-center text-gray-500 bg-white">
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

			{/* --- Modal Thêm/Sửa --- */}
			<Modal open={open} onClose={() => setOpen(false)} title={mode === 'create' ? 'Thêm hàng hóa' : 'Sửa hàng hóa'}>
				<form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mode === 'create' ? handleCreate() : handleUpdate(); }}>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm mb-1">Mã HH</label>
							<input className="w-full border rounded px-3 py-2" value={form.MaHH} onChange={(e) => setForm({ ...form, MaHH: e.target.value })} disabled={mode === 'edit'} required />
						</div>
						<div>
							<label className="block text-sm mb-1">Tên hàng</label>
							<input className="w-full border rounded px-3 py-2" value={form.TenHH || ''} onChange={(e) => setForm({ ...form, TenHH: e.target.value })} required />
						</div>
						<div>
							<label className="block text-sm mb-1">Loại</label>
							<select className="w-full border rounded px-3 py-2" value={form.MaLoai || ''} onChange={(e) => setForm({ ...form, MaLoai: e.target.value })}>
								<option value="">Chọn loại</option>
								{loaiList.map((l) => <option key={l.MaLoai} value={l.MaLoai}>{l.TenLoai}</option>)}
							</select>
						</div>
						<div>
							<label className="block text-sm mb-1">Đơn giá</label>
							<input type="number" className="w-full border rounded px-3 py-2" value={form.DonGia || 0} onChange={(e) => setForm({ ...form, DonGia: Number(e.target.value) })} />
						</div>
						<div>
							<label className="block text-sm mb-1">Tồn kho</label>
							<input type="number" className="w-full border rounded px-3 py-2" value={form.SoLuongTon || 0} onChange={(e) => setForm({ ...form, SoLuongTon: Number(e.target.value) })} />
						</div>
						<div>
							<label className="block text-sm mb-1">ĐVT</label>
							<input className="w-full border rounded px-3 py-2" value={form.DVT} onChange={(e) => setForm({ ...form, DVT: e.target.value })} />
						</div>
						<div className="col-span-2">
							<label className="block text-sm mb-1">Nhà cung cấp</label>
							<select className="w-full border rounded px-3 py-2" value={form.MaNCC || ''} onChange={(e) => setForm({ ...form, MaNCC: e.target.value })} required>
								<option value="">Chọn nhà cung cấp</option>
								{nccList.map((ncc) => (
									<option key={ncc.MaNCC} value={ncc.MaNCC}>
										{ncc.TenNCC}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
						<Button type="submit">{mode === 'create' ? 'Tạo' : 'Lưu'}</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}

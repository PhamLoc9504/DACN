'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { formatVietnamDate } from '@/lib/dateUtils';
import { CheckCircle, AlertTriangle, Package, XCircle, Edit3, Printer, Send, Trash2 } from 'lucide-react';
import TableActions from '@/components/TableActions';

type Row = {
	SoPX: string;
	NgayXuat: string | null;
	MaNV: string | null;
};

type ChiTiet = {
	MaHH: string;
	TenHH: string | null;
	SLXuat: number;
	DonGia: number;
	TongTien: string;
};

export default function XuatHangPage() {
	const [rows, setRows] = useState<Row[]>([]);
	const [nhanVienList, setNhanVienList] = useState<Array<{ MaNV: string; HoTen: string | null }>>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [editing, setEditing] = useState<Row | null>(null);
	const [selectedPX, setSelectedPX] = useState<string | null>(null);
	const [chiTiet, setChiTiet] = useState<ChiTiet[]>([]);
	const [form, setForm] = useState({ NgayXuat: '', MaNV: '' });
	const [products, setProducts] = useState<Array<{ MaHH: string; TenHH: string | null; DonGia: number | null; SoLuongTon: number | null }>>([]);
	const [lines, setLines] = useState<Array<{ MaHH: string; SLXuat: number; DonGia: number }>>([{ MaHH: '', SLXuat: 1, DonGia: 0 }]);
	const [q, setQ] = useState('');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [filterNV, setFilterNV] = useState('');
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);
	const [openConfirmModal, setOpenConfirmModal] = useState(false);
	const [openSuccessModal, setOpenSuccessModal] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [inventoryError, setInventoryError] = useState<any>(null);
	const [pendingSubmit, setPendingSubmit] = useState<{ phieu: any; chitiet: any[] } | null>(null);
	const [successData, setSuccessData] = useState<any>(null);

	useEffect(() => {
		loadData();
		loadNhanVien();
	}, [q, fromDate, toDate, filterNV, page, limit]);

	async function loadData() {
		setLoading(true);
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (filterNV) params.set('manv', filterNV);
		params.set('page', String(page));
		params.set('limit', String(limit));
		const res = await fetch(`/api/phieu-xuat?${params.toString()}`, {
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

	async function loadNhanVien() {
		const res = await fetch('/api/nhan-vien', {
			credentials: 'include',
		}).then((r) => r.json());
		if (res.data) {
			setNhanVienList(res.data);
		}
	}

	async function loadChiTiet(sopx: string) {
		const res = await fetch(`/api/phieu-xuat/${sopx}`, {
			credentials: 'include',
		}).then((r) => r.json());
		if (res.error) {
			alert(res.error);
			return;
		}
		setChiTiet(res.chiTiet || []);
	}

	useEffect(() => {
		if (!open && !detailOpen) return;
		(async () => {
			const res = await fetch('/api/hang-hoa?limit=1000&page=1', {
				credentials: 'include',
			}).then((r) => r.json());
			const list = (res.data || []).map((x: any) => ({
				MaHH: x.MaHH,
				TenHH: x.TenHH,
				DonGia: x.DonGia || 0,
				SoLuongTon: x.SoLuongTon || 0,
			}));
			setProducts(list);
		})();
	}, [open, detailOpen]);

	function setLine(index: number, patch: Partial<{ MaHH: string; SLXuat: number; DonGia: number }>) {
		setLines((prev) => {
			const next = prev.slice();
			next[index] = { ...next[index], ...patch } as any;
			return next;
		});
	}

	function openCreateModal() {
		setEditing(null);
		setForm({ NgayXuat: '', MaNV: '' });
		setLines([{ MaHH: '', SLXuat: 1, DonGia: 0 }]);
		setOpen(true);
	}

	function openEditModal(item: Row) {
		setEditing(item);
		setForm({
			NgayXuat: item.NgayXuat || '',
			MaNV: item.MaNV || '',
		});
		loadChiTiet(item.SoPX);
		setOpen(true);
	}

	function openDetailModal(sopx: string) {
		setSelectedPX(sopx);
		loadChiTiet(sopx);
		setDetailOpen(true);
	}

	// Kiểm tra dữ liệu nhập vào (Validation)
	function validateForm(): { valid: boolean; error: string | null } {
		// SoPX không bắt buộc nữa - API sẽ tự động tạo nếu để trống

		const chitiet = lines.filter((l) => l.MaHH && l.SLXuat > 0);
		if (chitiet.length === 0) {
			return { valid: false, error: 'Vui lòng thêm ít nhất một dòng hàng hóa' };
		}

		for (const l of chitiet) {
			if (!l.MaHH) {
				return { valid: false, error: 'Mã hàng hóa là bắt buộc' };
			}
			if (!l.SLXuat || l.SLXuat <= 0) {
				return { valid: false, error: `Số lượng xuất phải lớn hơn 0 cho ${l.MaHH}` };
			}
			if (!l.DonGia || l.DonGia < 0) {
				return { valid: false, error: `Đơn giá phải lớn hơn hoặc bằng 0 cho ${l.MaHH}` };
			}
		}

		return { valid: true, error: null };
	}

	// Kiểm tra tồn kho trước khi xác nhận
	async function checkInventory(chitiet: any[]): Promise<{ sufficient: boolean; errors: any[] }> {
		const errors: any[] = [];
		for (const row of chitiet) {
			const product = products.find((p) => p.MaHH === row.MaHH);
			if (!product) {
				errors.push({ MaHH: row.MaHH, message: `Hàng hóa ${row.MaHH} không tồn tại` });
				continue;
			}
			const ton = product.SoLuongTon || 0;
			if (ton < row.SLXuat) {
				errors.push({
					MaHH: row.MaHH,
					TenHH: product.TenHH,
					SoLuongTon: ton,
					SLXuat: row.SLXuat,
				});
			}
		}
		return { sufficient: errors.length === 0, errors };
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setValidationError(null);
		setInventoryError(null);

		// Kiểm tra dữ liệu nhập vào
		const validation = validateForm();
		if (!validation.valid) {
			setValidationError(validation.error);
			return;
		}

		const chitiet = lines
			.filter((l) => l.MaHH && l.SLXuat > 0)
			.map((l) => ({
				MaHH: l.MaHH,
				SLXuat: l.SLXuat,
				DonGia: l.DonGia || (products.find((x) => x.MaHH === l.MaHH)?.DonGia || 0),
			}));

		if (editing) {
			// Cập nhật - không cần xác nhận
			try {
				const res = await fetch(`/api/phieu-xuat/${editing.SoPX}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ phieu: form, chitiet }),
					credentials: 'include',
				});
				const data = await res.json();
				if (!res.ok) {
					setValidationError(data.error || 'Cập nhật thất bại');
					if (data.insufficientStock) {
						setInventoryError(data.inventoryErrors || []);
					}
					return;
				}
				setOpen(false);
				loadData();
			} catch (err: any) {
				setValidationError(err.message || 'Có lỗi xảy ra');
			}
		} else {
			// Tạo mới - kiểm tra tồn kho trước
			const inventoryCheck = await checkInventory(chitiet);
			if (!inventoryCheck.sufficient) {
				setInventoryError(inventoryCheck.errors);
				return;
			}

			// Lưu dữ liệu để xác nhận
			setPendingSubmit({ phieu: form, chitiet });
			setOpenConfirmModal(true);
		}
	}

	// Xác nhận xuất hàng
	async function confirmExport() {
		if (!pendingSubmit) return;

		try {
			const res = await fetch('/api/phieu-xuat/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(pendingSubmit),
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				// Xử lý lỗi - cho phép sửa lại hoặc thoát ra
				setValidationError(data.error || 'Tạo phiếu xuất thất bại');
				if (data.insufficientStock) {
					setInventoryError(data.inventoryErrors || []);
				}
				setOpenConfirmModal(false);
				return;
			}

			// Thành công - hiển thị modal thành công
			setSuccessData(data.data);
			setOpenConfirmModal(false);
			setOpen(false);
			setPendingSubmit(null);
			setOpenSuccessModal(true);
			loadData();
		} catch (err: any) {
			setValidationError(err.message || 'Có lỗi xảy ra khi tạo phiếu xuất');
			setOpenConfirmModal(false);
		}
	}

	async function handleDelete(sopx: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa phiếu xuất này?')) return;

		try {
			const res = await fetch(`/api/phieu-xuat/${sopx}`, {
				method: 'DELETE',
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data.error || 'Xóa thất bại');
				return;
			}
			loadData();
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
	}

	function handlePrint(sopx: string) {
		window.open(`/phieu-xuat/print/${sopx}`, '_blank');
	}

	function handleSend(sopx: string) {
		alert(`Chức năng gửi thông tin chứng từ cho phiếu ${sopx} đã được kích hoạt.\nTrong thực tế, chức năng này sẽ gửi email hoặc thông báo đến các bộ phận liên quan.`);
	}

	const tongTien = chiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			{/* --- Bộ lọc & tìm kiếm --- */}
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<div className="flex items-center justify-between mb-5">
					<h1 className="text-2xl font-semibold text-[#d47b8a]">📤 Quản lý phiếu xuất hàng</h1>
					<Button onClick={openCreateModal}>➕ Tạo phiếu xuất</Button>
				</div>
				<div className="mb-4 rounded-xl border border-[#fcd5ce] bg-[#fff5f2] px-4 py-3 text-xs text-[#7b4b3f] flex gap-2">
					<span className="mt-0.5">
						<AlertTriangle className="w-4 h-4 text-[#e07a5f]" />
					</span>
					<div>
						<p className="font-semibold">Lưu ý pháp lý khi lập phiếu xuất và hóa đơn</p>
						<p className="mt-1">
							Phiếu xuất và các chứng từ bán hàng được hệ thống lưu trữ, khóa/xóa mềm để phục vụ nghĩa vụ kế toán – thuế của
							doanh nghiệp theo Luật Kế toán 2015 (LU04), Luật Thuế GTGT (LU05) và Luật Thương mại 2005 (LU03). Việc cố ý
							sửa hoặc xóa chứng từ nhằm gian lận có thể vi phạm quy định pháp luật hiện hành.
						</p>
					</div>
				</div>
				<div className="grid md:grid-cols-5 gap-4">
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
						<input
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
							placeholder="Số PX / Mã NV"
							value={q}
							onChange={(e) => {
								setPage(1);
								setQ(e.target.value);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Từ ngày</label>
						<input
							type="date"
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={fromDate}
							onChange={(e) => {
								setPage(1);
								setFromDate(e.target.value);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Đến ngày</label>
						<input
							type="date"
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={toDate}
							onChange={(e) => {
								setPage(1);
								setToDate(e.target.value);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Nhân viên</label>
						<select
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							value={filterNV}
							onChange={(e) => {
								setPage(1);
								setFilterNV(e.target.value);
							}}
						>
							<option value="">Tất cả</option>
							{nhanVienList.map((nv) => (
								<option key={nv.MaNV} value={nv.MaNV}>
									{nv.MaNV} - {nv.HoTen}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* --- Bảng dữ liệu --- */}
			<div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
							<th className="py-3 px-4 font-medium">Số PX</th>
							<th className="py-3 px-4 font-medium">Ngày xuất</th>
							<th className="py-3 px-4 font-medium">Mã NV</th>
							<th className="py-3 px-4 font-medium">Hành động</th>
						</tr>
					</thead>
					<tbody>
						{loading &&
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={i} className="border-b border-[#f5ebe0] animate-pulse">
									{Array.from({ length: 4 }).map((_, j) => (
										<td key={j} className="py-3 px-4">
											<div className="h-4 w-20 bg-[#f9dfe3] rounded" />
										</td>
									))}
								</tr>
							))}

						{!loading &&
							rows.map((r) => (
								<tr 
									key={r.SoPX} 
									className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition cursor-pointer"
									onClick={() => openDetailModal(r.SoPX)}
								>
									<td className="py-3 px-4 font-medium text-gray-700">{r.SoPX}</td>
									<td className="py-3 px-4 text-gray-600">{r.NgayXuat ? formatVietnamDate(r.NgayXuat) : '-'}</td>
									<td className="py-3 px-4 text-[#d47b8a] font-semibold">{r.MaNV || '-'}</td>
									<td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
										<TableActions
											actions={[
												{
													label: 'Sửa',
													icon: <Edit3 className="w-3.5 h-3.5" />,
													onClick: () => openEditModal(r),
													tone: 'edit',
												},
												{
													label: 'In',
													icon: <Printer className="w-3.5 h-3.5" />,
													onClick: () => handlePrint(r.SoPX),
													tone: 'info',
												},
												{
													label: 'Gửi',
													icon: <Send className="w-3.5 h-3.5" />,
													onClick: () => handleSend(r.SoPX),
													tone: 'warning',
												},
												{
													label: 'Xóa',
													icon: <Trash2 className="w-3.5 h-3.5" />,
													onClick: () => handleDelete(r.SoPX),
													tone: 'danger',
												},
											]}
										/>
									</td>
								</tr>
							))}

						{!loading && rows.length === 0 && (
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

			{/* --- Modal tạo/sửa phiếu xuất --- */}
			<Modal open={open} onClose={() => {
				setOpen(false);
				setValidationError(null);
				setInventoryError(null);
			}} title={editing ? 'Sửa phiếu xuất' : 'Tạo phiếu xuất mới'}>
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Thông báo lỗi validation */}
					{validationError && (
						<div className="bg-red-50 border border-red-200 p-4 rounded-lg">
							<div className="flex items-center gap-2 text-red-800 font-medium mb-2">
								<AlertTriangle className="w-5 h-5" />
								Lỗi dữ liệu nhập vào
							</div>
							<p className="text-sm text-red-700">{validationError}</p>
						</div>
					)}

					{/* Thông báo không đủ hàng */}
					{inventoryError && Array.isArray(inventoryError) && inventoryError.length > 0 && (
						<div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
							<div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
								<Package className="w-5 h-5" />
								Thông báo không đủ hàng
							</div>
							<div className="text-sm text-amber-700 space-y-1">
								{inventoryError.map((err: any, i: number) => (
									<p key={i}>
										{err.TenHH ? `${err.TenHH} (${err.MaHH})` : err.MaHH}: Tồn kho ({err.SoLuongTon || 0}) &lt; Số lượng xuất ({err.SLXuat || 0})
									</p>
								))}
							</div>
						</div>
					)}
					<div className="grid grid-cols-2 gap-3">
						{/* Số PX - Ẩn hoàn toàn, tự động tạo */}
						<div>
							<label className="block text-sm mb-1 text-gray-500">Ngày xuất</label>
							<input
								type="date"
								className="w-full border rounded px-3 py-2"
								value={form.NgayXuat}
								onChange={(e) => setForm({ ...form, NgayXuat: e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-sm mb-1 text-gray-500">Mã NV</label>
							<select
								className="w-full border rounded px-3 py-2"
								value={form.MaNV}
								onChange={(e) => setForm({ ...form, MaNV: e.target.value })}
							>
								<option value="">-- Chọn NV --</option>
								{nhanVienList.map((nv) => (
									<option key={nv.MaNV} value={nv.MaNV}>
										{nv.MaNV} - {nv.HoTen}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="space-y-2">
						<div className="text-sm text-gray-600 font-medium">Chi tiết xuất hàng</div>
						<table className="w-full text-sm border">
							<thead>
								<tr className="bg-slate-50 text-slate-600">
									<th className="p-2 text-left">Hàng hóa</th>
									<th className="p-2 text-right">Tồn</th>
									<th className="p-2 text-right">SL xuất</th>
									<th className="p-2 text-right">Đơn giá</th>
									<th className="p-2 text-right">Thành tiền</th>
									<th className="p-2" />
								</tr>
							</thead>
							<tbody>
								{lines.map((l, i) => {
									const p = products.find((x) => x.MaHH === l.MaHH);
									const unit = l.DonGia || p?.DonGia || 0;
									const ton = p?.SoLuongTon || 0;
									const thanhTien = unit * (l.SLXuat || 0);
									const canXuat = ton >= (l.SLXuat || 0);
									return (
										<tr key={i} className="border-t">
											<td className="p-2">
												<select
													className="w-full border rounded px-2 py-1"
													value={l.MaHH}
													onChange={(e) => {
														const selected = products.find((x) => x.MaHH === e.target.value);
														setLine(i, { MaHH: e.target.value, DonGia: selected?.DonGia || 0 });
													}}
												>
													<option value="">Chọn hàng</option>
													{products.map((h) => (
														<option key={h.MaHH} value={h.MaHH}>
															{h.MaHH} - {h.TenHH}
														</option>
													))}
												</select>
											</td>
											<td className={`p-2 text-right ${ton < (l.SLXuat || 0) ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
												{ton}
											</td>
											<td className="p-2 text-right">
												<input
													type="number"
													min={1}
													max={ton}
													className={`w-24 border rounded px-2 py-1 text-right ${!canXuat ? 'border-red-500' : ''}`}
													value={l.SLXuat}
													onChange={(e) => setLine(i, { SLXuat: Number(e.target.value) })}
												/>
											</td>
											<td className="p-2 text-right">
												<input
													type="number"
													min={0}
													className="w-32 border rounded px-2 py-1 text-right"
													value={l.DonGia}
													onChange={(e) => setLine(i, { DonGia: Number(e.target.value) })}
												/>
											</td>
											<td className="p-2 text-right font-medium text-slate-800">{thanhTien.toLocaleString('vi-VN')}</td>
											<td className="p-2 text-right">
												<Button type="button" variant="secondary" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}>
													Xóa
												</Button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						<div className="pt-2">
							<Button type="button" variant="secondary" onClick={() => setLines((prev) => [...prev, { MaHH: '', SLXuat: 1, DonGia: 0 }])}>
								➕ Thêm dòng
							</Button>
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="secondary" onClick={() => {
							setOpen(false);
							setValidationError(null);
							setInventoryError(null);
						}}>
							Thoát ra
						</Button>
						{(validationError || inventoryError) && (
							<Button type="button" variant="secondary" onClick={() => {
								setValidationError(null);
								setInventoryError(null);
							}}>
								Sửa lại
							</Button>
						)}
						<Button type="submit">{editing ? '💾 Lưu thay đổi' : '➕ Tạo mới'}</Button>
					</div>
				</form>
			</Modal>

			{/* Modal: Xác nhận xuất hàng */}
			<Modal open={openConfirmModal} onClose={() => setOpenConfirmModal(false)} title="Xác nhận xuất hàng">
				{pendingSubmit && (
					<div className="space-y-4">
						<div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
							<div className="text-sm text-blue-800 font-medium mb-2">Bạn có chắc chắn muốn xuất hàng?</div>
							<div className="text-sm text-blue-700 space-y-1">
								<p>
									<strong>Số PX:</strong>{' '}
									{pendingSubmit.phieu?.SoPX?.trim()
										? pendingSubmit.phieu.SoPX
										: 'Sẽ được hệ thống tự động sinh (PX01, PX02, ...)'}
								</p>
								<p><strong>Ngày xuất:</strong> {pendingSubmit.phieu.NgayXuat || 'Chưa chọn'}</p>
								<p><strong>Mã NV:</strong> {pendingSubmit.phieu.MaNV || 'Chưa chọn'}</p>
								<p><strong>Số lượng hàng hóa:</strong> {pendingSubmit.chitiet.length}</p>
							</div>
						</div>
						<div className="bg-gray-50 p-4 rounded-lg">
							<div className="text-sm text-gray-600 font-medium mb-2">Chi tiết hàng hóa</div>
							<div className="max-h-48 overflow-y-auto">
								<table className="min-w-full text-sm">
									<thead>
										<tr className="text-left bg-white/50 text-gray-600 border-b">
											<th className="py-2 px-3 font-medium">Mã HH</th>
											<th className="py-2 px-3 font-medium">Số lượng xuất</th>
											<th className="py-2 px-3 font-medium text-right">Đơn giá</th>
											<th className="py-2 px-3 font-medium text-right">Thành tiền</th>
										</tr>
									</thead>
									<tbody>
										{pendingSubmit.chitiet.map((ct, i) => {
											const product = products.find((p) => p.MaHH === ct.MaHH);
											return (
												<tr key={i} className="border-b hover:bg-white/50">
													<td className="py-2 px-3 font-medium">{ct.MaHH}</td>
													<td className="py-2 px-3">{ct.SLXuat}</td>
													<td className="py-2 px-3 text-right">{Number(ct.DonGia || 0).toLocaleString('vi-VN')} ₫</td>
													<td className="py-2 px-3 text-right font-medium">
														{(ct.SLXuat * (ct.DonGia || 0)).toLocaleString('vi-VN')} ₫
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onClick={() => setOpenConfirmModal(false)}>
								Hủy
							</Button>
							<Button onClick={confirmExport}>
								<CheckCircle className="w-4 h-4 mr-2" />
								Xác nhận xuất hàng
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* Modal: Thông báo xuất hàng thành công */}
			<Modal open={openSuccessModal} onClose={() => setOpenSuccessModal(false)} title="Xuất hàng thành công">
				{successData && (
					<div className="space-y-4">
						<div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
							<CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
							<div className="text-lg font-semibold text-green-800 mb-1">Xuất hàng thành công!</div>
							<div className="text-sm text-green-700">Phiếu xuất đã được lưu và tồn kho đã được cập nhật</div>
						</div>

						<div className="bg-gray-50 p-4 rounded-lg">
							<div className="text-sm text-gray-600 mb-3 font-medium">Thông tin phiếu xuất</div>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-500">Số PX:</span>
									<span className="font-medium">{successData.SoPX}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Ngày xuất:</span>
									<span>{successData.NgayXuat ? formatVietnamDate(successData.NgayXuat) : '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Mã NV:</span>
									<span>{successData.MaNV || '-'}</span>
								</div>
							</div>
						</div>

						{pendingSubmit && pendingSubmit.chitiet.length > 0 && (
							<div className="bg-blue-50 p-4 rounded-lg">
								<div className="text-sm text-gray-600 mb-3 font-medium">Chi tiết hàng hóa đã xuất</div>
								<div className="max-h-48 overflow-y-auto">
									<table className="min-w-full text-sm">
										<thead>
											<tr className="text-left bg-white/50 text-gray-600 border-b">
												<th className="py-2 px-3 font-medium">Mã HH</th>
												<th className="py-2 px-3 font-medium">Số lượng xuất</th>
												<th className="py-2 px-3 font-medium text-right">Đơn giá</th>
												<th className="py-2 px-3 font-medium text-right">Thành tiền</th>
											</tr>
										</thead>
										<tbody>
											{pendingSubmit.chitiet.map((ct, i) => {
												const product = products.find((p) => p.MaHH === ct.MaHH);
												return (
													<tr key={i} className="border-b hover:bg-white/50">
														<td className="py-2 px-3 font-medium">{ct.MaHH}</td>
														<td className="py-2 px-3">{ct.SLXuat}</td>
														<td className="py-2 px-3 text-right">{Number(ct.DonGia || 0).toLocaleString('vi-VN')} ₫</td>
														<td className="py-2 px-3 text-right font-medium">
															{(ct.SLXuat * (ct.DonGia || 0)).toLocaleString('vi-VN')} ₫
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						)}

						<div className="flex justify-end gap-2 pt-2">
							<Button onClick={() => {
								setOpenSuccessModal(false);
								setSuccessData(null);
								setPendingSubmit(null);
							}}>
								Thoát
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* --- Modal xem chi tiết - Design đẹp hơn --- */}
			<Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="">
				<div className="space-y-6">
					{/* Header với gradient */}
					<div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-6 rounded-xl -mt-6 -mx-6 mb-4">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-2xl font-bold mb-1">Chi tiết phiếu xuất</h2>
								<p className="text-green-100 text-sm">Export Slip Details</p>
							</div>
							<div className="text-right">
								<div className="text-sm text-green-100 mb-1">Số phiếu xuất</div>
								<div className="text-3xl font-bold">{selectedPX}</div>
							</div>
						</div>
					</div>

					{/* Thông tin phiếu */}
					<div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-green-600 rounded-full"></div>
								<span className="text-gray-600 font-medium">Tổng tiền:</span>
							</div>
							<span className="text-2xl font-bold text-green-600">{tongTien.toLocaleString('vi-VN')} ₫</span>
						</div>
					</div>

					{/* Chi tiết hàng hóa */}
					{chiTiet.length > 0 ? (
						<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
							<div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
								<h3 className="font-semibold text-gray-800 flex items-center gap-2">
									📦 Chi tiết hàng hóa ({chiTiet.length} sản phẩm)
								</h3>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="bg-gray-50 border-b border-gray-200">
											<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
											<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã hàng</th>
											<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tên hàng</th>
											<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">SL xuất</th>
											<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Đơn giá</th>
											<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thành tiền</th>
										</tr>
									</thead>
									<tbody>
										{chiTiet.map((ct, i) => (
											<tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
												<td className="px-4 py-3 text-sm text-gray-600">{i + 1}</td>
												<td className="px-4 py-3 text-sm font-medium text-gray-900">{ct.MaHH}</td>
												<td className="px-4 py-3 text-sm text-gray-700">{ct.TenHH || '-'}</td>
												<td className="px-4 py-3 text-sm text-right text-gray-600">{ct.SLXuat}</td>
												<td className="px-4 py-3 text-sm text-right text-gray-700">{Number(ct.DonGia).toLocaleString('vi-VN')} ₫</td>
												<td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{Number(ct.TongTien).toLocaleString('vi-VN')} ₫</td>
											</tr>
										))}
									</tbody>
									<tfoot>
										<tr className="bg-gradient-to-r from-green-50 to-emerald-50">
											<td colSpan={5} className="px-4 py-4 text-right font-bold text-gray-800">
												TỔNG TIỀN:
											</td>
											<td className="px-4 py-4 text-right font-bold text-xl text-green-600">
												{tongTien.toLocaleString('vi-VN')} ₫
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					) : (
						<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
							<p className="text-yellow-800 font-medium">Không có chi tiết hàng hóa</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
						<Button variant="secondary" onClick={() => setDetailOpen(false)}>
							Đóng
						</Button>
						<Button onClick={() => { setDetailOpen(false); handlePrint(selectedPX || ''); }}>
							🖨️ In phiếu
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}

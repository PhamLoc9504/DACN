'use client';

import { useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { supabase, type Tables } from '@/lib/supabaseClient';
import { formatVietnamDateTime, formatVietnamDate } from '@/lib/dateUtils';
import { CreditCard, Wallet, QrCode, Search, Truck, FileText, Download, Eye, Edit, Trash2, Send, TrendingUp, DollarSign, Calendar, MoreVertical, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { UserRole, hasAnyRole, resolveUserRole } from '@/lib/roles';

const TRANGTHAI = ['', 'Chưa thanh toán', 'Đã thanh toán', 'Đang xử lý'];

type HoaDonForm = {
    MaHD?: string;
    NgayLap: string;
    MaKH: string;
    MaNCC?: string | null;
    TongTien: number;
    TrangThai: string;
    SoPX?: string | null;
    SoPN?: string | null;
    MaNV?: string | null;
    HinhThucGiao?: 'Giao hàng' | 'Tại quầy';
    PhuongThucTT?: 'Tiền mặt' | 'Chuyển khoản' | 'VNPay' | 'MoMo' | 'ZaloPay' | 'COD';
};

type PhuongThucThanhToan = 'chuyen-khoan' | 'tien-mat' | 'quet-qr';

export default function HoaDonPage() {
    const [rows, setRows] = useState<Tables['HoaDon'][]>([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

	// Tìm kiếm nâng cao
	const [q, setQ] = useState('');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [minAmount, setMinAmount] = useState('');
	const [maxAmount, setMaxAmount] = useState('');

	// Modal states
    const [openForm, setOpenForm] = useState(false);
	const [openPaymentModal, setOpenPaymentModal] = useState(false);
	const [openDetailModal, setOpenDetailModal] = useState(false);
	const [openShippingModal, setOpenShippingModal] = useState(false);
    const [editing, setEditing] = useState<HoaDonForm | null>(null);
	const [selectedHD, setSelectedHD] = useState<Tables['HoaDon'] | null>(null);
	const [paymentForm, setPaymentForm] = useState<{ PhuongThuc: PhuongThucThanhToan; SoTien: number; GhiChu: string }>({
		PhuongThuc: 'tien-mat',
		SoTien: 0,
		GhiChu: '',
	});

	const [me, setMe] = useState<{ maNV: string; vaiTro?: UserRole } | null>(null);
    const [pnOptions, setPnOptions] = useState<{ SoPN: string; MaNCC?: string }[]>([]);
    const [pnMap, setPnMap] = useState<Record<string, { MaNCC?: string }>>({});
    const [pxOptions, setPxOptions] = useState<{ SoPX: string }[]>([]);
    const [voucherType, setVoucherType] = useState<'PN' | 'PX' | ''>('');
	const [shippingInfo, setShippingInfo] = useState<any>(null);
	const [openStatusModal, setOpenStatusModal] = useState(false);
	const [statusForm, setStatusForm] = useState<{ MaHD: string; TrangThai: string } | null>(null);
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [openSuccessModal, setOpenSuccessModal] = useState(false);
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const [paymentDeadlineExpired, setPaymentDeadlineExpired] = useState(false);
	const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
	const [paymentResult, setPaymentResult] = useState<any>(null);
	const [customerOptions, setCustomerOptions] = useState<Array<{ MaKH: string; TenKH: string | null }>>([]);
	const canManageInvoices = hasAnyRole(me?.vaiTro, [UserRole.ADMIN]);

    useEffect(() => {
		loadData();
	}, [status, page, limit, q, fromDate, toDate, minAmount, maxAmount]);

    useEffect(() => {
        async function loadAux() {
            try {
                const [meRes, pnRes, pxRes, hdRes] = await Promise.all([
					fetch('/api/me', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
					fetch('/api/phieu-nhap?limit=10000&page=1', { credentials: 'include' }).then((r) => r.json()),
					fetch('/api/phieu-xuat?limit=10000&page=1', { credentials: 'include' }).then((r) => r.json()),
					fetch('/api/hoa-don?page=1&limit=10000', { credentials: 'include' }).then((r) => r.json()),
				]);
				if (meRes) setMe({ maNV: meRes.maNV || '', vaiTro: resolveUserRole(meRes.vaiTro) });
                const invoices: Tables['HoaDon'][] = (hdRes?.data || []) as Tables['HoaDon'][];
                const usedPN = new Set((invoices || []).map((x) => x.SoPN).filter(Boolean) as string[]);
                const usedPX = new Set((invoices || []).map((x) => x.SoPX).filter(Boolean) as string[]);
                const allPNFull: { SoPN: string; MaNCC?: string }[] = (pnRes?.data || []).map((x: any) => ({ SoPN: x.SoPN, MaNCC: x.MaNCC })).filter((x: any) => x.SoPN);
                const allPX: { SoPX: string }[] = (pxRes?.data || []).map((x: any) => ({ SoPX: x.SoPX })).filter((x: any) => x.SoPX);
                const filteredPN = allPNFull.filter((x) => !usedPN.has(x.SoPN));
                setPnOptions(filteredPN);
                const map: Record<string, { MaNCC?: string }> = {};
                for (const it of allPNFull) map[it.SoPN] = { MaNCC: it.MaNCC };
                setPnMap(map);
                setPxOptions(allPX.filter((x) => !usedPX.has(x.SoPX)));
            } catch {
                // ignore
            }
        }
        loadAux();
    }, []);

	useEffect(() => {
		let ignore = false;
		async function loadCustomers() {
			try {
				const res = await fetch('/api/khach-hang?limit=1000&page=1', {
					credentials: 'include',
				}).then((r) => r.json());
				if (!ignore && res?.data) {
					const list = (res.data || []).map((kh: any) => ({
						MaKH: kh.MaKH,
						TenKH: kh.TenKH || null,
					}));
					setCustomerOptions(list);
				}
			} catch {
				// ignore load errors
			}
		}
		loadCustomers();
		return () => {
			ignore = true;
		};
	}, []);

	async function loadData() {
		setLoading(true);
		const params = new URLSearchParams();
		if (status) params.set('status', status);
		if (q) params.set('q', q);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (minAmount) params.set('minAmount', minAmount);
		if (maxAmount) params.set('maxAmount', maxAmount);
		params.set('page', String(page));
		params.set('limit', String(limit));
		const res = await fetch(`/api/hoa-don?${params.toString()}`, {
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

	function handleOpenStatusModal(row: Tables['HoaDon']) {
		setStatusForm({ MaHD: row.MaHD, TrangThai: row.TrangThai || 'Chưa thanh toán' });
		setOpenStatusModal(true);
	}

	async function updateStatus() {
		if (!statusForm) return;
		try {
			const res = await fetch('/api/hoa-don', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ MaHD: statusForm.MaHD, TrangThai: statusForm.TrangThai }),
				credentials: 'include',
			}).then((r) => r.json());
			if (res.error) {
				alert(res.error);
				return;
			}
			setOpenStatusModal(false);
			setStatusForm(null);
			loadData();
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
    }

    function openCreate() {
        setEditing({ 
            NgayLap: new Date().toISOString().slice(0, 10), 
            MaKH: '', 
            MaNCC: '', 
            TongTien: 0, 
            TrangThai: 'Chưa thanh toán', 
            MaNV: me?.maNV || '',
            HinhThucGiao: 'Giao hàng',
            PhuongThucTT: 'Tiền mặt'
        });
        setVoucherType('');
        setOpenForm(true);
    }

    function openEdit(row: Tables['HoaDon']) {
        setEditing({
            MaHD: row.MaHD,
            NgayLap: String(row.NgayLap),
            MaKH: row.MaKH || '',
            TongTien: Number(row.TongTien || 0),
            TrangThai: row.TrangThai || 'Chưa thanh toán',
            SoPX: row.SoPX || null,
            SoPN: row.SoPN || null,
            MaNV: row.MaNV || null,
            HinhThucGiao: (row.HinhThucGiao as 'Giao hàng' | 'Tại quầy') || 'Giao hàng',
            PhuongThucTT: (row.PhuongThucTT as any) || 'Tiền mặt',
        });
        setVoucherType(row.SoPN ? 'PN' : row.SoPX ? 'PX' : '');
        setOpenForm(true);
    }

	async function openPayment(row: Tables['HoaDon']) {
		setSelectedHD(row);
		setPaymentForm({
			PhuongThuc: 'tien-mat',
			SoTien: Number(row.TongTien || 0),
			GhiChu: '',
		});
		setPaymentError(null);
		setPaymentDeadlineExpired(false);
		
		// Kiểm tra thời hạn thanh toán
		if (row.NgayLap) {
			const ngayLap = new Date(row.NgayLap);
			const hanThanhToan = new Date(ngayLap);
			hanThanhToan.setDate(hanThanhToan.getDate() + 30);
			const now = new Date();
			
			if (now > hanThanhToan) {
				setPaymentDeadlineExpired(true);
				setPaymentError(`Hóa đơn đã quá thời hạn thanh toán (${hanThanhToan.toLocaleDateString('vi-VN')})`);
			}
		}
		
		// Load chi tiết hóa đơn (hàng hóa)
		try {
			const res = await fetch(`/api/hoa-don/${row.MaHD}/chi-tiet`, {
				credentials: 'include',
			}).then((r) => r.json());
			if (res.data) {
				setInvoiceItems(res.data || []);
			}
		} catch (err) {
			console.error('Failed to load invoice items:', err);
		}
		
		setOpenPaymentModal(true);
	}

	async function handlePayment() {
		if (!selectedHD) return;
		setPaymentError(null);
		
		// Kiểm tra thời hạn trước khi thanh toán
		if (selectedHD.NgayLap) {
			const ngayLap = new Date(selectedHD.NgayLap);
			const hanThanhToan = new Date(ngayLap);
			hanThanhToan.setDate(hanThanhToan.getDate() + 30);
			const now = new Date();
			
			if (now > hanThanhToan) {
				setPaymentError(`Hóa đơn đã quá thời hạn thanh toán (${hanThanhToan.toLocaleDateString('vi-VN')})`);
				setPaymentDeadlineExpired(true);
				return;
			}
		}
		
		// Kiểm tra số tiền
		if (paymentForm.SoTien < Number(selectedHD.TongTien || 0)) {
			setPaymentError('Số tiền thanh toán không đủ');
			return;
		}
		
		try {
			const res = await fetch('/api/hoa-don/thanh-toan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					MaHD: selectedHD.MaHD,
					PhuongThuc: paymentForm.PhuongThuc,
					SoTien: paymentForm.SoTien,
					GhiChu: paymentForm.GhiChu,
				}),
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				// Xử lý lỗi - cho phép nhập lại
				setPaymentError(data.message || data.error || 'Thanh toán thất bại');
				if (data.expired) {
					setPaymentDeadlineExpired(true);
				}
				return;
			}
			
			// Thanh toán thành công - hiển thị modal thành công
			setPaymentResult(data.data);
			setOpenPaymentModal(false);
			setOpenSuccessModal(true);
			loadData();
		} catch (err: any) {
			setPaymentError(err.message || 'Có lỗi xảy ra khi thanh toán');
		}
	}

	async function openShipping(row: Tables['HoaDon']) {
		setSelectedHD(row);
		try {
			const res = await fetch(`/api/van-chuyen?mahd=${row.MaHD}`, {
				credentials: 'include',
			}).then((r) => r.json());
			setShippingInfo(res.data?.[0] || null);
			setOpenShippingModal(true);
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
	}

	async function openDetail(mahd: string) {
		try {
			const [hdRes, ctRes] = await Promise.all([
				fetch(`/api/hoa-don?id=${mahd}`, {
					credentials: 'include',
				}).then((r) => r.json()),
				fetch(`/api/hoa-don/${mahd}/chi-tiet`, {
					credentials: 'include',
				}).then((r) => r.json()).catch(() => ({ data: [] })),
			]);
			if (hdRes.error) {
				alert(hdRes.error);
				return;
			}
			setSelectedHD(hdRes.data);
			setInvoiceItems(ctRes.data || []);
			setOpenDetailModal(true);
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		}
    }

    async function saveForm() {
        if (!editing) return;
        if (!voucherType) {
            alert('Vui lòng chọn loại phiếu (Phiếu nhập hoặc Phiếu xuất).');
            return;
        }
        if (voucherType === 'PN' && !editing.SoPN) {
            alert('Vui lòng chọn Số phiếu nhập.');
            return;
        }
        if (voucherType === 'PX' && !editing.SoPX) {
            alert('Vui lòng chọn Số phiếu xuất.');
            return;
        }
		if (voucherType !== 'PN' && !editing.MaKH) {
			alert('Vui lòng chọn khách hàng.');
			return;
		}
        const payload: any = { ...editing };
        if (voucherType === 'PN') payload.SoPX = null;
        if (voucherType === 'PX') payload.SoPN = null;
        if (voucherType === 'PN') {
            payload.MaKH = null as any;
			delete payload.MaNCC;
        }
        const method = editing.MaHD ? 'PUT' : 'POST';
		const res = await fetch('/api/hoa-don', {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			credentials: 'include',
		}).then((r) => r.json());
        if (res.error) return alert(res.error);
        setOpenForm(false);
        setEditing(null);
		loadData();
    }

    async function remove(maHd: string) {
        if (!confirm('Xóa hóa đơn này?')) return;
		const res = await fetch(`/api/hoa-don?id=${encodeURIComponent(maHd)}`, {
			method: 'DELETE',
			credentials: 'include',
		}).then((r) => r.json());
        if (res.error) return alert(res.error);
		loadData();
    }

    function print(maHd: string) {
        window.open(`/hoa-don/print/${encodeURIComponent(maHd)}`, '_blank');
    }

	function exportEInvoice(maHd: string) {
		window.open(`/hoa-don/e-invoice/${encodeURIComponent(maHd)}`, '_blank');
    }

    async function exportCSV() {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '10000');
        if (status) params.set('status', status);
		if (q) params.set('q', q);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		const res = await fetch(`/api/hoa-don?${params.toString()}`, {
			credentials: 'include',
		}).then((r) => r.json());
        const data: Tables['HoaDon'][] = res.data || [];
		const headers = ['MaHD', 'NgayLap', 'MaKH', 'TongTien', 'TrangThai', 'SoPX', 'SoPN', 'MaNV'];
        const lines = [headers.join(',')].concat(
			data
				.map((r) => [r.MaHD, r.NgayLap, r.MaKH, r.TongTien, r.TrangThai, r.SoPX || '', r.SoPN || '', r.MaNV || ''].map((v) => (v === null || v === undefined ? '' : String(v).replace(/"/g, '""'))).map((v) => (/[,"]/.test(v) ? '"' + v + '"' : v)).join(','))
        );
        const content = '\ufeff' + lines.join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
		a.download = 'hoa_don_' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportPDF() {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        window.open(`/hoa-don/print-all?${params.toString()}`, '_blank');
    }

	const stats = useMemo(() => {
		const total = rows.length;
		const daThanhToan = rows.filter((r) => r.TrangThai === 'Đã thanh toán').length;
		const chuaThanhToan = rows.filter((r) => r.TrangThai === 'Chưa thanh toán').length;
		const tongTien = rows.reduce((sum, r) => sum + (r.TongTien || 0), 0);
		const tongTienDaThanhToan = rows.filter((r) => r.TrangThai === 'Đã thanh toán').reduce((sum, r) => sum + (r.TongTien || 0), 0);
		return { total, daThanhToan, chuaThanhToan, tongTien, tongTienDaThanhToan };
	}, [rows]);

    return (
        <div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-2xl font-semibold text-[#d47b8a]">🧾 Quản lý hóa đơn</h1>
                    <div className="flex gap-2">
						<Button variant="secondary" onClick={exportCSV}>
							<Download className="w-4 h-4 mr-2" />
							Xuất CSV
						</Button>
						<Button variant="secondary" onClick={exportPDF}>
							<FileText className="w-4 h-4 mr-2" />
							Xuất PDF
						</Button>
						<Button variant="pink" onClick={openCreate}>
							+ Thêm hóa đơn
						</Button>
					</div>
				</div>

				{/* Thống kê */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-600">Tổng số hóa đơn</div>
								<div className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</div>
							</div>
							<FileText className="w-8 h-8 text-blue-600" />
						</div>
					</div>
					<div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-600">Đã thanh toán</div>
								<div className="text-2xl font-bold text-gray-800 mt-1">{stats.daThanhToan}</div>
							</div>
							<DollarSign className="w-8 h-8 text-green-600" />
						</div>
					</div>
					<div className="rounded-xl border bg-gradient-to-br from-red-50 to-red-100 p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-600">Chưa thanh toán</div>
								<div className="text-2xl font-bold text-gray-800 mt-1">{stats.chuaThanhToan}</div>
							</div>
							<TrendingUp className="w-8 h-8 text-red-600" />
						</div>
					</div>
					<div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-600">Tổng giá trị</div>
								<div className="text-2xl font-bold text-gray-800 mt-1">{stats.tongTien.toLocaleString('vi-VN')} ₫</div>
							</div>
							<DollarSign className="w-8 h-8 text-purple-600" />
						</div>
                    </div>
                </div>

				{/* Tìm kiếm nâng cao */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					<div className="md:col-span-2">
						<label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
						<input
							type="text"
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
							placeholder="Mã HD, Mã KH..."
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
						<label className="block text-sm mb-1 text-gray-500">Từ số tiền</label>
						<input
							type="number"
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							placeholder="0"
							value={minAmount}
							onChange={(e) => {
								setPage(1);
								setMinAmount(e.target.value);
							}}
						/>
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Đến số tiền</label>
						<input
							type="number"
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
							placeholder="0"
							value={maxAmount}
							onChange={(e) => {
								setPage(1);
								setMaxAmount(e.target.value);
							}}
						/>
					</div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-500">Trạng thái</label>
                        <select
							className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition w-full"
                            value={status}
                            onChange={(e) => {
                                setPage(1);
                                setStatus(e.target.value);
                            }}
                        >
                            {TRANGTHAI.map((t) => (
                                <option key={t} value={t}>
                                    {t || 'Tất cả'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-500">Hiển thị</label>
                        <select
							className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition w-full"
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
                            <th className="py-3 px-4 font-medium">Mã HD</th>
                            <th className="py-3 px-4 font-medium">Ngày lập</th>
                            <th className="py-3 px-4 font-medium">Mã KH</th>
                            <th className="py-3 px-4 font-medium">Tổng tiền</th>
                            <th className="py-3 px-4 font-medium">Trạng thái</th>
							<th className="py-3 px-4 font-medium text-center">Thao tác</th>
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
							rows.map((r) => (
								<tr 
									key={r.MaHD} 
									className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition cursor-pointer"
									onClick={() => openDetail(r.MaHD)}
								>
                                    <td className="py-3 px-4 font-medium">{r.MaHD}</td>
									<td className="py-3 px-4">{r.NgayLap ? formatVietnamDate(r.NgayLap) : '-'}</td>
									<td className="py-3 px-4">{r.MaKH || '-'}</td>
									<td className="py-3 px-4 text-[#d47b8a] font-semibold">{r.TongTien?.toLocaleString('vi-VN')} ₫</td>
                                    <td
                                        className={`py-3 px-4 font-medium ${
                                            r.TrangThai === 'Đã thanh toán'
                                                ? 'text-green-600'
                                                : r.TrangThai === 'Chưa thanh toán'
                                                ? 'text-red-500'
                                                : 'text-yellow-600'
                                        }`}
                                    >
                                        {r.TrangThai}
                                    </td>
									<td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
										<div className="flex gap-1.5 items-center justify-center flex-wrap">

											{/* Thanh toán - chỉ khi chưa thanh toán */}
											{r.TrangThai === 'Chưa thanh toán' && (
												<button
													onClick={() => openPayment(r)}
													className="px-2.5 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
													title="Thanh toán hóa đơn"
												>
													<CreditCard className="w-3.5 h-3.5 inline mr-1" />
													Thanh toán
												</button>
											)}

											{/* Vận chuyển - chỉ cho hóa đơn xuất đã thanh toán */}
											{r.TrangThai === 'Đã thanh toán' && r.SoPX && (
												<button
													onClick={() => openShipping(r)}
													className="px-2.5 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium"
													title="Theo dõi vận chuyển"
												>
													<Truck className="w-3.5 h-3.5 inline mr-1" />
													Vận chuyển
												</button>
											)}

											{/* In - luôn có sẵn */}
											<button
												onClick={() => print(r.MaHD)}
												className="px-2.5 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-medium"
												title="In hóa đơn"
											>
												<FileText className="w-3.5 h-3.5 inline mr-1" />
												In
											</button>

											{/* E-Invoice - chỉ cho hóa đơn đã thanh toán */}
											{r.TrangThai === 'Đã thanh toán' && (
												<button
													onClick={() => exportEInvoice(r.MaHD)}
													className="px-2.5 py-1.5 text-xs bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition font-medium"
													title="Xuất hóa đơn điện tử"
												>
													<Download className="w-3.5 h-3.5 inline mr-1" />
													E-Invoice
												</button>
											)}

											{/* Menu thao tác nâng cao */}
											<div className="relative inline-block">
												<button
													className="px-2.5 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
													title="Thao tác khác"
													onClick={(e) => {
														e.stopPropagation();
														setOpenMenuId(openMenuId === r.MaHD ? null : r.MaHD);
													}}
												>
													<MoreVertical className="w-3.5 h-3.5" />
												</button>
												{openMenuId === r.MaHD && (
													<>
														<div
															className="fixed inset-0 z-10"
															onClick={() => setOpenMenuId(null)}
														/>
														<div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
															<div className="py-1">

																{/* Sửa - chỉ khi chưa thanh toán hoặc có quyền quản lý */}
																{(r.TrangThai !== 'Đã thanh toán' || canManageInvoices) && (
																	<button
																		onClick={() => {
																			setOpenMenuId(null);
																			openEdit(r);
																		}}
																		className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 flex items-center gap-2"
																	>
																		<Edit className="w-3.5 h-3.5" />
																		Sửa hóa đơn
																	</button>
																)}

																{/* Cập nhật trạng thái - chỉ vai trò quản lý */}
																{canManageInvoices && (
																	<button
																		onClick={() => {
																			setOpenMenuId(null);
																			handleOpenStatusModal(r);
																		}}
																		className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 flex items-center gap-2"
																	>
																		<Settings className="w-3.5 h-3.5" />
																		Cập nhật trạng thái
																	</button>
																)}

																{/* Xóa - chỉ khi chưa thanh toán và có quyền quản lý */}
																{r.TrangThai !== 'Đã thanh toán' && canManageInvoices && (
																	<button
																		onClick={() => {
																			setOpenMenuId(null);
																			remove(r.MaHD);
																		}}
																		className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																		Xóa hóa đơn
																	</button>
																)}
															</div>
														</div>
													</>
												)}
											</div>
										</div>
                                    </td>
                                </tr>
                            ))}

						{!loading && rows.length === 0 && (
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

            <div className="flex justify-center pt-4">
                <Pagination page={page} limit={limit} total={total} onChange={setPage} />
            </div>

			{/* Modal: Create/Edit */}
            <Modal open={openForm} onClose={() => setOpenForm(false)} title={editing?.MaHD ? 'Cập nhật hóa đơn' : 'Thêm hóa đơn'}>
                {editing && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm mb-1 text-gray-500">Ngày lập</label>
							<input
								type="date"
								className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2"
								value={editing.NgayLap}
								onChange={(e) => setEditing({ ...editing, NgayLap: e.target.value })}
							/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                {voucherType === 'PN' ? (
                                    <>
                                        <label className="block text-sm mb-1 text-gray-500">Mã NCC</label>
                                        <input className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.MaNCC || ''} readOnly />
                                    </>
                                ) : (
                                    <>
                                        <label className="block text-sm mb-1 text-gray-500">Khách hàng</label>
										<select
											className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2"
											value={editing.MaKH}
											onChange={(e) => setEditing({ ...editing, MaKH: e.target.value })}
										>
											<option value="">-- Chọn khách hàng --</option>
											{!customerOptions.some((kh) => kh.MaKH === editing.MaKH) && editing.MaKH && (
												<option value={editing.MaKH}>{editing.MaKH} (không có trong danh sách)</option>
											)}
											{customerOptions.map((kh) => (
												<option key={kh.MaKH} value={kh.MaKH}>
													{kh.MaKH} - {kh.TenKH || 'Không tên'}
												</option>
											))}
										</select>
										{customerOptions.length === 0 && (
											<p className="text-xs text-gray-500 mt-1">Không tìm thấy dữ liệu khách hàng. Hãy thêm khách hàng trước.</p>
										)}
                                    </>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Tổng tiền</label>
                                <input type="number" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.TongTien} readOnly />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Trạng thái</label>
								<select
									className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2"
									value={editing.TrangThai}
									onChange={(e) => setEditing({ ...editing, TrangThai: e.target.value })}
								>
                                    {TRANGTHAI.filter(Boolean).map((t) => (
										<option key={t} value={t}>
											{t}
										</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Mã NV</label>
                                <input className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.MaNV || me?.maNV || ''} readOnly />
                            </div>
                        </div>
                        {voucherType !== 'PN' && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1 text-gray-500">Hình thức giao hàng *</label>
                                        <select
                                            className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2"
                                            value={editing.HinhThucGiao || 'Giao hàng'}
                                            onChange={(e) => setEditing({ ...editing, HinhThucGiao: e.target.value as 'Giao hàng' | 'Tại quầy' })}
                                        >
                                            <option value="Giao hàng">🚚 Giao hàng</option>
                                            <option value="Tại quầy">🏪 Tại quầy</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1 text-gray-500">Phương thức thanh toán *</label>
                                        <select
                                            className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2"
                                            value={editing.PhuongThucTT || 'Tiền mặt'}
                                            onChange={(e) => setEditing({ ...editing, PhuongThucTT: e.target.value as any })}
                                        >
                                            <option value="Tiền mặt">💵 Tiền mặt</option>
                                            <option value="COD">📦 COD (Thanh toán khi nhận hàng)</option>
                                            <option value="Chuyển khoản">🏦 Chuyển khoản</option>
                                            <option value="VNPay">💳 VNPay</option>
                                            <option value="MoMo">📱 MoMo</option>
                                            <option value="ZaloPay">💸 ZaloPay</option>
                                        </select>
                                    </div>
                                </div>
                                {editing.HinhThucGiao === 'Tại quầy' && (
                                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
                                        ℹ️ Khách hàng sẽ nhận hàng trực tiếp tại quầy, không tạo đơn vận chuyển.
                                    </div>
                                )}
                                {editing.HinhThucGiao === 'Giao hàng' && editing.PhuongThucTT === 'COD' && (
                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                                        📦 Đơn vận chuyển sẽ được tạo tự động khi hóa đơn được tạo (COD).
                                    </div>
                                )}
                                {editing.HinhThucGiao === 'Giao hàng' && editing.PhuongThucTT && ['Chuyển khoản', 'VNPay', 'MoMo', 'ZaloPay'].includes(editing.PhuongThucTT) && (
                                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-green-800">
                                        ✅ Đơn vận chuyển sẽ được tạo tự động sau khi thanh toán thành công.
                                    </div>
                                )}
                            </>
                        )}
                        <div>
                            <label className="block text-sm mb-1 text-gray-500">Chọn loại phiếu</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
									<input
										type="radio"
										name="voucherType"
										checked={voucherType === 'PN'}
										onChange={() => {
											setVoucherType('PN');
											setEditing({ ...editing, SoPN: '', SoPX: null, TongTien: 0 });
										}}
									/>
                                    <span>Phiếu nhập chưa lập hóa đơn</span>
                                </label>
                                <label className="flex items-center gap-2">
									<input
										type="radio"
										name="voucherType"
										checked={voucherType === 'PX'}
										onChange={() => {
											setVoucherType('PX');
											setEditing({ ...editing, SoPX: '', SoPN: null, TongTien: 0 });
										}}
									/>
                                    <span>Phiếu xuất chưa lập hóa đơn</span>
                                </label>
                            </div>
                        </div>

                        {voucherType === 'PN' && (
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Số PN</label>
								<select
									className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2"
									value={editing.SoPN || ''}
									onChange={async (e) => {
                                    const val = e.target.value;
                                    const found = pnMap[val];
                                    setEditing((prev) => ({ ...(prev as any), SoPN: val, SoPX: null, MaNCC: found?.MaNCC || '' }));
                                    if (val) {
                                        try {
												const res = await fetch(`/api/phieu-nhap/total?sopn=${encodeURIComponent(val)}`, {
													credentials: 'include',
												}).then((r) => r.json());
                                            const total = Number(res.total || 0);
                                            setEditing((prev) => ({ ...(prev as any), TongTien: total }));
                                        } catch {}
                                    } else {
                                        setEditing((prev) => ({ ...(prev as any), TongTien: 0, MaNCC: '' }));
                                    }
									}}
								>
                                    <option value="">-- Chọn phiếu nhập --</option>
                                    {pnOptions.map((opt) => (
										<option key={opt.SoPN} value={opt.SoPN}>
											{opt.SoPN}
										</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {voucherType === 'PX' && (
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Số PX</label>
								<select
									className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2"
									value={editing.SoPX || ''}
									onChange={async (e) => {
                                    const val = e.target.value;
                                    setEditing((prev) => ({ ...(prev as any), SoPX: val, SoPN: null }));
                                    if (val) {
                                        try {
												const res = await fetch(`/api/phieu-xuat/total?sopx=${encodeURIComponent(val)}`, {
													credentials: 'include',
												}).then((r) => r.json());
                                            const total = Number(res.total || 0);
                                            setEditing((prev) => ({ ...(prev as any), TongTien: total }));
                                        } catch {}
                                    } else {
                                        setEditing((prev) => ({ ...(prev as any), TongTien: 0 }));
                                    }
									}}
								>
                                    <option value="">-- Chọn phiếu xuất --</option>
                                    {pxOptions.map((opt) => (
										<option key={opt.SoPX} value={opt.SoPX}>
											{opt.SoPX}
										</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onClick={() => setOpenForm(false)}>
								Hủy
							</Button>
                            <Button onClick={saveForm}>{editing.MaHD ? 'Lưu' : 'Thêm'}</Button>
                        </div>
                    </div>
                )}
            </Modal>

			{/* Modal: Thanh toán */}
			<Modal open={openPaymentModal} onClose={() => setOpenPaymentModal(false)} title={`Thanh toán hóa đơn ${selectedHD?.MaHD}`}>
				{selectedHD && (
					<div className="space-y-4">
						{/* Thông báo hết hạn thanh toán */}
						{paymentDeadlineExpired && (
							<div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
								<div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
									<Calendar className="w-5 h-5" />
									Thông báo hết hạn thanh toán
								</div>
								<p className="text-sm text-amber-700">{paymentError}</p>
							</div>
						)}

						{/* Thông báo lỗi thanh toán */}
						{paymentError && !paymentDeadlineExpired && (
							<div className="bg-red-50 border border-red-200 p-4 rounded-lg">
								<div className="flex items-center gap-2 text-red-800 font-medium mb-2">
									<AlertTriangle className="w-5 h-5" />
									Lỗi thanh toán
								</div>
								<p className="text-sm text-red-700">{paymentError}</p>
							</div>
						)}

						{/* Thông tin hóa đơn */}
						<div className="bg-gray-50 p-4 rounded-lg">
							<div className="text-sm text-gray-600 mb-2 font-medium">Thông tin hóa đơn</div>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<span className="text-gray-500">Mã HD:</span>
									<span className="ml-2 font-medium">{selectedHD.MaHD}</span>
								</div>
								<div>
									<span className="text-gray-500">Ngày lập:</span>
									<span className="ml-2">{selectedHD.NgayLap ? formatVietnamDate(selectedHD.NgayLap) : '-'}</span>
								</div>
								<div>
									<span className="text-gray-500">Mã KH:</span>
									<span className="ml-2">{selectedHD.MaKH || '-'}</span>
								</div>
								<div>
									<span className="text-gray-500">Tổng tiền:</span>
									<span className="ml-2 font-bold text-[#d47b8a]">{Number(selectedHD.TongTien || 0).toLocaleString('vi-VN')} ₫</span>
								</div>
							</div>
						</div>

						{/* Chi tiết hàng hóa */}
						{invoiceItems.length > 0 && (
							<div className="bg-blue-50 p-4 rounded-lg">
								<div className="text-sm text-gray-600 mb-3 font-medium">Thông tin hàng hóa và số tiền thanh toán</div>
								<div className="max-h-48 overflow-y-auto">
									<table className="min-w-full text-sm">
										<thead>
											<tr className="text-left bg-white/50 text-gray-600 border-b">
												<th className="py-2 px-3 font-medium">Mã HH</th>
												<th className="py-2 px-3 font-medium">Tên hàng</th>
												<th className="py-2 px-3 font-medium text-right">Số lượng</th>
												<th className="py-2 px-3 font-medium text-right">Đơn giá</th>
												<th className="py-2 px-3 font-medium text-right">Thành tiền</th>
											</tr>
										</thead>
										<tbody>
											{invoiceItems.map((item, i) => (
												<tr key={i} className="border-b hover:bg-white/50">
													<td className="py-2 px-3 font-medium">{item.MaHH}</td>
													<td className="py-2 px-3">{item.TenHH || '-'}</td>
													<td className="py-2 px-3 text-right">{item.SoLuong || 0}</td>
													<td className="py-2 px-3 text-right">{Number(item.DonGia || 0).toLocaleString('vi-VN')} ₫</td>
													<td className="py-2 px-3 text-right font-medium">{Number(item.TongTien || 0).toLocaleString('vi-VN')} ₫</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<div className="mt-3 pt-3 border-t border-blue-200">
									<div className="flex justify-between items-center">
										<span className="text-sm font-medium text-gray-700">Tổng cộng:</span>
										<span className="text-lg font-bold text-[#d47b8a]">{Number(selectedHD.TongTien || 0).toLocaleString('vi-VN')} ₫</span>
									</div>
								</div>
							</div>
						)}

						<div>
							<label className="block text-sm mb-2 text-gray-500 font-medium">Phương thức thanh toán *</label>
							<div className="space-y-2">
								<label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
									<input
										type="radio"
										name="phuongThuc"
										value="tien-mat"
										checked={paymentForm.PhuongThuc === 'tien-mat'}
										onChange={(e) => setPaymentForm({ ...paymentForm, PhuongThuc: e.target.value as PhuongThucThanhToan })}
									/>
									<Wallet className="w-5 h-5 text-green-600" />
									<span>Tiền mặt</span>
								</label>
								<label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
									<input
										type="radio"
										name="phuongThuc"
										value="chuyen-khoan"
										checked={paymentForm.PhuongThuc === 'chuyen-khoan'}
										onChange={(e) => setPaymentForm({ ...paymentForm, PhuongThuc: e.target.value as PhuongThucThanhToan })}
									/>
									<CreditCard className="w-5 h-5 text-blue-600" />
									<span>Chuyển khoản</span>
								</label>
								<label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
									<input
										type="radio"
										name="phuongThuc"
										value="quet-qr"
										checked={paymentForm.PhuongThuc === 'quet-qr'}
										onChange={(e) => setPaymentForm({ ...paymentForm, PhuongThuc: e.target.value as PhuongThucThanhToan })}
									/>
									<QrCode className="w-5 h-5 text-purple-600" />
									<span>Quét QR</span>
								</label>
							</div>
						</div>

						<div>
							<label className="block text-sm mb-1 text-gray-500">Số tiền thanh toán *</label>
							<input
								type="number"
								className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
								value={paymentForm.SoTien}
								onChange={(e) => setPaymentForm({ ...paymentForm, SoTien: Number(e.target.value) })}
								min={Number(selectedHD.TongTien || 0)}
								required
							/>
							<div className="text-xs text-gray-500 mt-1">Tối thiểu: {Number(selectedHD.TongTien || 0).toLocaleString('vi-VN')} ₫</div>
						</div>

						<div>
							<label className="block text-sm mb-1 text-gray-500">Ghi chú</label>
							<textarea
								className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
								rows={3}
								value={paymentForm.GhiChu}
								onChange={(e) => setPaymentForm({ ...paymentForm, GhiChu: e.target.value })}
								placeholder="Ghi chú về thanh toán..."
							/>
						</div>

						{paymentForm.PhuongThuc === 'quet-qr' && (
							<div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
								<div className="text-sm font-medium text-purple-800 mb-2">Quét mã QR để thanh toán</div>
								<div className="flex justify-center">
									<div className="w-48 h-48 bg-white p-4 rounded-lg border-2 border-purple-300">
										<div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
											QR Code Placeholder
										</div>
									</div>
								</div>
								<div className="text-xs text-purple-600 mt-2 text-center">Quét mã QR bằng ứng dụng ngân hàng để thanh toán</div>
							</div>
						)}

						<div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onClick={() => {
								setOpenPaymentModal(false);
								setPaymentError(null);
								setPaymentDeadlineExpired(false);
							}}>
								Thoát
							</Button>
							{paymentError && !paymentDeadlineExpired && (
								<Button variant="secondary" onClick={() => {
									setPaymentError(null);
									setPaymentForm({
										PhuongThuc: paymentForm.PhuongThuc,
										SoTien: Number(selectedHD.TongTien || 0),
										GhiChu: paymentForm.GhiChu,
									});
								}}>
									Nhập lại
								</Button>
							)}
							{!paymentDeadlineExpired && (
								<Button onClick={handlePayment} disabled={paymentDeadlineExpired}>
									<CreditCard className="w-4 h-4 mr-2" />
									Xác nhận thanh toán
								</Button>
							)}
						</div>
					</div>
				)}
			</Modal>

			{/* Modal: Thông báo thanh toán thành công */}
			<Modal open={openSuccessModal} onClose={() => setOpenSuccessModal(false)} title="Thanh toán thành công">
				{paymentResult && selectedHD && (
					<div className="space-y-4">
						<div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
							<CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
							<div className="text-lg font-semibold text-green-800 mb-1">Thanh toán thành công!</div>
							<div className="text-sm text-green-700">Hóa đơn đã được cập nhật trạng thái "Đã thanh toán"</div>
						</div>

						<div className="bg-gray-50 p-4 rounded-lg">
							<div className="text-sm text-gray-600 mb-3 font-medium">Chi tiết hóa đơn</div>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-500">Mã HD:</span>
									<span className="font-medium">{selectedHD.MaHD}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Ngày lập:</span>
									<span>{selectedHD.NgayLap ? formatVietnamDate(selectedHD.NgayLap) : '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Mã KH:</span>
									<span>{selectedHD.MaKH || '-'}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Phương thức thanh toán:</span>
									<span className="font-medium">
										{paymentResult.PhuongThuc === 'tien-mat' ? 'Tiền mặt' :
										 paymentResult.PhuongThuc === 'chuyen-khoan' ? 'Chuyển khoản' :
										 paymentResult.PhuongThuc === 'quet-qr' ? 'Quét QR' : paymentResult.PhuongThuc}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Số tiền thanh toán:</span>
									<span className="font-bold text-[#d47b8a]">{Number(paymentResult.SoTien || 0).toLocaleString('vi-VN')} ₫</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Thời gian thanh toán:</span>
									<span>{formatVietnamDateTime(paymentResult.ThoiGian)}</span>
								</div>
								<div className="flex justify-between pt-2 border-t">
									<span className="text-gray-500 font-medium">Trạng thái:</span>
									<span className="font-bold text-green-600">{paymentResult.TrangThai}</span>
								</div>
							</div>
						</div>

						{invoiceItems.length > 0 && (
							<div className="bg-blue-50 p-4 rounded-lg">
								<div className="text-sm text-gray-600 mb-3 font-medium">Chi tiết hàng hóa</div>
								<div className="max-h-48 overflow-y-auto">
									<table className="min-w-full text-sm">
										<thead>
											<tr className="text-left bg-white/50 text-gray-600 border-b">
												<th className="py-2 px-3 font-medium">Mã HH</th>
												<th className="py-2 px-3 font-medium">Tên hàng</th>
												<th className="py-2 px-3 font-medium text-right">Số lượng</th>
												<th className="py-2 px-3 font-medium text-right">Thành tiền</th>
											</tr>
										</thead>
										<tbody>
											{invoiceItems.map((item, i) => (
												<tr key={i} className="border-b hover:bg-white/50">
													<td className="py-2 px-3 font-medium">{item.MaHH}</td>
													<td className="py-2 px-3">{item.TenHH || '-'}</td>
													<td className="py-2 px-3 text-right">{item.SoLuong || 0}</td>
													<td className="py-2 px-3 text-right font-medium">{Number(item.TongTien || 0).toLocaleString('vi-VN')} ₫</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						<div className="flex justify-end gap-2 pt-2">
							<Button onClick={() => {
								setOpenSuccessModal(false);
								setPaymentResult(null);
								setInvoiceItems([]);
							}}>
								Thoát
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* Modal: Chi tiết hóa đơn - Design đẹp hơn */}
			<Modal open={openDetailModal} onClose={() => { setOpenDetailModal(false); setInvoiceItems([]); }} title="">
				{selectedHD && (
					<div className="space-y-6">
						{/* Header với gradient */}
						<div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl -mt-6 -mx-6 mb-4">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-bold mb-1">Chi tiết hóa đơn</h2>
									<p className="text-indigo-100 text-sm">Invoice Details</p>
								</div>
								<div className="text-right">
									<div className="text-sm text-indigo-100 mb-1">Mã hóa đơn</div>
									<div className="text-3xl font-bold">{selectedHD.MaHD}</div>
								</div>
							</div>
						</div>

						{/* Thông tin chính */}
						<div className="grid md:grid-cols-2 gap-4">
							<div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
								<div className="flex items-center gap-2 mb-3">
									<div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
									<h3 className="font-semibold text-gray-800">Thông tin cơ bản</h3>
								</div>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-gray-600">Ngày lập:</span>
										<span className="font-medium text-gray-900">{selectedHD.NgayLap ? formatVietnamDate(selectedHD.NgayLap) : '-'}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Mã KH:</span>
										<span className="font-medium text-gray-900">{selectedHD.MaKH || '-'}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Mã NV:</span>
										<span className="font-medium text-gray-900">{selectedHD.MaNV || '-'}</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-100">
								<div className="flex items-center gap-2 mb-3">
									<div className="w-2 h-2 bg-pink-600 rounded-full"></div>
									<h3 className="font-semibold text-gray-800">Thông tin phiếu</h3>
								</div>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-gray-600">Số PX:</span>
										<span className="font-medium text-gray-900">{selectedHD.SoPX || '-'}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Số PN:</span>
										<span className="font-medium text-gray-900">{selectedHD.SoPN || '-'}</span>
									</div>
									<div className="flex justify-between items-center pt-2 border-t border-pink-200">
										<span className="text-gray-600 font-medium">Trạng thái:</span>
										<span className={`px-3 py-1 rounded-full text-xs font-semibold ${
											selectedHD.TrangThai === 'Đã thanh toán'
												? 'bg-green-100 text-green-700'
												: selectedHD.TrangThai === 'Chưa thanh toán'
												? 'bg-red-100 text-red-700'
												: 'bg-yellow-100 text-yellow-700'
										}`}>
											{selectedHD.TrangThai}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Chi tiết hàng hóa */}
						{invoiceItems.length > 0 ? (
							<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
								<div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
									<h3 className="font-semibold text-gray-800 flex items-center gap-2">
										<FileText className="w-4 h-4 text-indigo-600" />
										Chi tiết hàng hóa ({invoiceItems.length} sản phẩm)
									</h3>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="bg-gray-50 border-b border-gray-200">
												<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
												<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã hàng</th>
												<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tên hàng</th>
												<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Số lượng</th>
												<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Đơn giá</th>
												<th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thành tiền</th>
											</tr>
										</thead>
										<tbody>
											{invoiceItems.map((item: any, i: number) => (
												<tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
													<td className="px-4 py-3 text-sm text-gray-600">{i + 1}</td>
													<td className="px-4 py-3 text-sm font-medium text-gray-900">{item.MaHH}</td>
													<td className="px-4 py-3 text-sm text-gray-700">{item.TenHH || '-'}</td>
													<td className="px-4 py-3 text-sm text-right text-gray-600">{item.SoLuong || 0}</td>
													<td className="px-4 py-3 text-sm text-right text-gray-700">{Number(item.DonGia || 0).toLocaleString('vi-VN')} ₫</td>
													<td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
														{typeof item.TongTien === 'string' 
															? Number(item.TongTien || 0).toLocaleString('vi-VN') 
															: Number(item.TongTien || 0).toLocaleString('vi-VN')} ₫
													</td>
												</tr>
											))}
										</tbody>
										<tfoot>
											<tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
												<td colSpan={5} className="px-4 py-4 text-right font-bold text-gray-800">
													TỔNG TIỀN:
												</td>
												<td className="px-4 py-4 text-right font-bold text-xl text-indigo-600">
													{Number(selectedHD.TongTien || 0).toLocaleString('vi-VN')} ₫
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
							<Button variant="secondary" onClick={() => { setOpenDetailModal(false); setInvoiceItems([]); }}>
								Đóng
							</Button>
							<Button onClick={() => { setOpenDetailModal(false); print(selectedHD.MaHD); }}>
								<FileText className="w-4 h-4 mr-2" />
								In hóa đơn
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* Modal: Theo dõi vận chuyển */}
			<Modal open={openShippingModal} onClose={() => setOpenShippingModal(false)} title={`Theo dõi vận chuyển - Hóa đơn ${selectedHD?.MaHD}`}>
				{selectedHD && (
					<div className="space-y-4">
						{shippingInfo ? (
							<div className="space-y-4">
								<div className="bg-gray-50 p-4 rounded-lg">
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span className="text-gray-500">Mã vận chuyển:</span>
											<span className="ml-2 font-medium">{shippingInfo.MaVC}</span>
										</div>
										<div>
											<span className="text-gray-500">Ngày giao:</span>
											<span className="ml-2">{shippingInfo.NgayGiao ? formatVietnamDate(shippingInfo.NgayGiao) : '-'}</span>
										</div>
										<div className="col-span-2">
											<span className="text-gray-500">Địa chỉ nhận:</span>
											<span className="ml-2">{shippingInfo.DiaChiNhan || '-'}</span>
										</div>
										<div className="col-span-2">
											<span className="text-gray-500">Trạng thái:</span>
											<span className={`ml-2 font-medium ${shippingInfo.TrangThai === 'Đã giao' ? 'text-green-600' : 'text-yellow-600'}`}>
												{shippingInfo.TrangThai}
											</span>
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<Truck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
								<p>Chưa có thông tin vận chuyển cho hóa đơn này</p>
								<Button variant="secondary" className="mt-4" onClick={() => window.open(`/van-chuyen?mahd=${selectedHD.MaHD}`, '_blank')}>
									Tạo đơn vận chuyển
								</Button>
							</div>
						)}
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onClick={() => setOpenShippingModal(false)}>
								Đóng
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* Modal: Cập nhật trạng thái */}
			<Modal open={openStatusModal} onClose={() => setOpenStatusModal(false)} title={`Cập nhật trạng thái - Hóa đơn ${statusForm?.MaHD}`}>
				{statusForm && (
					<div className="space-y-4">
						<div>
							<label className="block text-sm mb-2 text-gray-500 font-medium">Trạng thái *</label>
							<select
								className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
								value={statusForm.TrangThai}
								onChange={(e) => setStatusForm({ ...statusForm, TrangThai: e.target.value })}
							>
								{TRANGTHAI.filter(Boolean).map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="secondary" onClick={() => setOpenStatusModal(false)}>
								Hủy
							</Button>
							<Button onClick={updateStatus}>
								<Settings className="w-4 h-4 mr-2" />
								Cập nhật
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}

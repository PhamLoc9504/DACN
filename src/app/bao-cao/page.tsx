'use client';

import { useEffect, useState } from 'react';
import {
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	Legend,
} from 'recharts';
import { TrendingUp, Package, DollarSign, Calendar, Download, Search } from 'lucide-react';
import Button from '@/components/Button';

type TabType = 'nhap' | 'xuat' | 'doanh-thu' | 'ton-kho' | 'tim-kiem';

type NhapData = {
	totalPhieu: number;
	totalValue: number;
	totalQuantity: number;
	byMonth: { month: string; count: number; value: number }[];
	byNCC: { name: string; value: number; count: number }[];
	byProduct: { name: string; quantity: number; value: number }[];
};

type XuatData = {
	totalPhieu: number;
	totalValue: number;
	totalQuantity: number;
	byMonth: { month: string; count: number; value: number }[];
	byNV: { name: string; value: number; count: number }[];
	byProduct: { name: string; quantity: number; value: number }[];
};

type DoanhThuData = {
	byMonth: { month: string; revenue: number }[];
	totalRevenue: number;
	totalInvoices: number;
};

type TonKhoData = {
	totalProducts: number;
	totalQuantity: number;
	totalValue: number;
	lowStock: { name: string; quantity: number }[];
	byCategory: { name: string; quantity: number; value: number }[];
};
type SearchResults = {
	products: any[];
	nhap: any[];
	xuat: any[];
	invoices: any[];
};

export default function BaoCaoPage() {
	const [activeTab, setActiveTab] = useState<TabType>('nhap');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [searchQuery, setSearchQuery] = useState('');

	// Data states
	const [nhapData, setNhapData] = useState<NhapData | null>(null);
	const [xuatData, setXuatData] = useState<XuatData | null>(null);
	const [doanhThuData, setDoanhThuData] = useState<DoanhThuData | null>(null);
	const [tonKhoData, setTonKhoData] = useState<TonKhoData | null>(null);
	const [loading, setLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
	const [searching, setSearching] = useState(false);

	useEffect(() => {
		const now = new Date();
		const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
		setFromDate(firstDay.toISOString().split('T')[0]);
		setToDate(now.toISOString().split('T')[0]);
	}, []);

	useEffect(() => {
		if (fromDate && toDate) {
			if (activeTab === 'nhap') loadNhapReport();
			else if (activeTab === 'xuat') loadXuatReport();
			else if (activeTab === 'doanh-thu') loadDoanhThuReport();
			else if (activeTab === 'ton-kho') loadTonKhoReport();
		}
	}, [fromDate, toDate, activeTab]);

	async function loadNhapReport() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('from', fromDate);
			params.set('to', toDate);
			params.set('limit', '10000');
			params.set('page', '1');

			const res = await fetch(`/api/phieu-nhap?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());

			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const phieuList = res.data || [];
			const allChiTiet: any[] = [];
			for (const phieu of phieuList) {
				const detailRes = await fetch(`/api/phieu-nhap/${phieu.SoPN}`, {
					credentials: 'include',
				}).then((r) => r.json());
				if (detailRes.chiTiet) {
					allChiTiet.push(...detailRes.chiTiet.map((ct: any) => ({ ...ct, sopn: phieu.SoPN, mancc: phieu.MaNCC })));
				}
			}

			const totalValue = allChiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
			const totalQuantity = allChiTiet.reduce((sum, ct) => sum + (ct.SLNhap || 0), 0);

			const monthMap = new Map<string, { count: number; value: number }>();
			phieuList.forEach((p: any) => {
				if (p.NgayNhap) {
					const date = new Date(p.NgayNhap);
					const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					const current = monthMap.get(key) || { count: 0, value: 0 };
					const phieuValue = allChiTiet.filter((ct) => ct.sopn === p.SoPN).reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
					monthMap.set(key, { count: current.count + 1, value: current.value + phieuValue });
				}
			});
			const byMonth = Array.from(monthMap.entries())
				.map(([month, data]) => ({
					month: month.slice(5) + '/' + month.slice(0, 4),
					count: data.count,
					value: data.value,
				}))
				.sort((a, b) => a.month.localeCompare(b.month));

			const nccMap = new Map<string, { value: number; count: number }>();
			phieuList.forEach((p: any) => {
				if (p.MaNCC) {
					const current = nccMap.get(p.MaNCC) || { value: 0, count: 0 };
					const phieuValue = allChiTiet.filter((ct) => ct.sopn === p.SoPN).reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
					nccMap.set(p.MaNCC, { value: current.value + phieuValue, count: current.count + 1 });
				}
			});
			const byNCC = Array.from(nccMap.entries())
				.map(([name, data]) => ({ name, value: data.value, count: data.count }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 10);

			const productMap = new Map<string, { quantity: number; value: number; name: string }>();
			allChiTiet.forEach((ct) => {
				const current = productMap.get(ct.MaHH) || { quantity: 0, value: 0, name: ct.TenHH || ct.MaHH };
				productMap.set(ct.MaHH, {
					name: current.name,
					quantity: current.quantity + (ct.SLNhap || 0),
					value: current.value + parseFloat(ct.TongTien || '0'),
				});
			});
			const byProduct = Array.from(productMap.entries())
				.map(([_, data]) => ({ name: data.name, quantity: data.quantity, value: data.value }))
				.sort((a, b) => b.quantity - a.quantity)
				.slice(0, 10);

			setNhapData({
				totalPhieu: phieuList.length,
				totalValue,
				totalQuantity,
				byMonth,
				byNCC,
				byProduct,
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	async function loadXuatReport() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('from', fromDate);
			params.set('to', toDate);
			params.set('limit', '10000');
			params.set('page', '1');

			const res = await fetch(`/api/phieu-xuat?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());

			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const phieuList = res.data || [];
			const allChiTiet: any[] = [];
			for (const phieu of phieuList) {
				const detailRes = await fetch(`/api/phieu-xuat/${phieu.SoPX}`, {
					credentials: 'include',
				}).then((r) => r.json());
				if (detailRes.chiTiet) {
					allChiTiet.push(...detailRes.chiTiet.map((ct: any) => ({ ...ct, sopx: phieu.SoPX, manv: phieu.MaNV })));
				}
			}

			const totalValue = allChiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
			const totalQuantity = allChiTiet.reduce((sum, ct) => sum + (ct.SLXuat || 0), 0);

			const monthMap = new Map<string, { count: number; value: number }>();
			phieuList.forEach((p: any) => {
				if (p.NgayXuat) {
					const date = new Date(p.NgayXuat);
					const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					const current = monthMap.get(key) || { count: 0, value: 0 };
					const phieuValue = allChiTiet.filter((ct) => ct.sopx === p.SoPX).reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
					monthMap.set(key, { count: current.count + 1, value: current.value + phieuValue });
				}
			});
			const byMonth = Array.from(monthMap.entries())
				.map(([month, data]) => ({
					month: month.slice(5) + '/' + month.slice(0, 4),
					count: data.count,
					value: data.value,
				}))
				.sort((a, b) => a.month.localeCompare(b.month));

			const nvMap = new Map<string, { value: number; count: number }>();
			phieuList.forEach((p: any) => {
				if (p.MaNV) {
					const current = nvMap.get(p.MaNV) || { value: 0, count: 0 };
					const phieuValue = allChiTiet.filter((ct) => ct.sopx === p.SoPX).reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
					nvMap.set(p.MaNV, { value: current.value + phieuValue, count: current.count + 1 });
				}
			});
			const byNV = Array.from(nvMap.entries())
				.map(([name, data]) => ({ name, value: data.value, count: data.count }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 10);

			const productMap = new Map<string, { quantity: number; value: number; name: string }>();
			allChiTiet.forEach((ct) => {
				const current = productMap.get(ct.MaHH) || { quantity: 0, value: 0, name: ct.TenHH || ct.MaHH };
				productMap.set(ct.MaHH, {
					name: current.name,
					quantity: current.quantity + (ct.SLXuat || 0),
					value: current.value + parseFloat(ct.TongTien || '0'),
				});
			});
			const byProduct = Array.from(productMap.entries())
				.map(([_, data]) => ({ name: data.name, quantity: data.quantity, value: data.value }))
				.sort((a, b) => b.quantity - a.quantity)
				.slice(0, 10);

			setXuatData({
				totalPhieu: phieuList.length,
				totalValue,
				totalQuantity,
				byMonth,
				byNV,
				byProduct,
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	async function loadDoanhThuReport() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('status', 'Đã thanh toán');
			params.set('limit', '10000');
			params.set('page', '1');
			if (fromDate) params.set('from', fromDate);
			if (toDate) params.set('to', toDate);

			const res = await fetch(`/api/hoa-don?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());

			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const invoices = res.data || [];
			const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.TongTien || 0), 0);

			const monthMap = new Map<string, number>();
			invoices.forEach((inv: any) => {
				if (inv.NgayLap) {
					const date = new Date(inv.NgayLap);
					const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					monthMap.set(key, (monthMap.get(key) || 0) + (inv.TongTien || 0));
				}
			});
			const byMonth = Array.from(monthMap.entries())
				.map(([month, revenue]) => ({
					month: month.slice(5) + '/' + month.slice(0, 4),
					revenue,
				}))
				.sort((a, b) => a.month.localeCompare(b.month));

			setDoanhThuData({
				byMonth,
				totalRevenue,
				totalInvoices: invoices.length,
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	async function loadTonKhoReport() {
		setLoading(true);
		try {
			const res = await fetch('/api/hang-hoa?limit=10000&page=1', {
				credentials: 'include',
			}).then((r) => r.json());

			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const products = res.data || [];
			const totalQuantity = products.reduce((sum: number, p: any) => sum + (p.SoLuongTon || 0), 0);
			const totalValue = products.reduce((sum: number, p: any) => sum + (p.SoLuongTon || 0) * (p.DonGia || 0), 0);
			const lowStock = products
				.filter((p: any) => (p.SoLuongTon || 0) <= 10)
				.map((p: any) => ({ name: p.TenHH || p.MaHH, quantity: p.SoLuongTon || 0 }))
				.slice(0, 20);

			setTonKhoData({
				totalProducts: products.length,
				totalQuantity,
				totalValue,
				lowStock,
				byCategory: [],
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	async function handleSearch() {
		const q = searchQuery.trim();
		if (!q) {
			alert('Vui lòng nhập từ khóa tìm kiếm');
			return;
		}
		setSearching(true);
		setSearchResults(null);
		try {
			const params = new URLSearchParams();
			params.set('q', q);
			params.set('limit', '10');
			params.set('page', '1');

			const [hhRes, pnRes, pxRes, hdRes] = await Promise.all([
				fetch(`/api/hang-hoa?${params.toString()}`, { credentials: 'include' }).then((r) => r.json()),
				fetch(`/api/phieu-nhap?${params.toString()}`, { credentials: 'include' }).then((r) => r.json()),
				fetch(`/api/phieu-xuat?${params.toString()}`, { credentials: 'include' }).then((r) => r.json()),
				fetch(`/api/hoa-don?${params.toString()}`, { credentials: 'include' }).then((r) => r.json()),
			]);

			const firstError = hhRes.error || pnRes.error || pxRes.error || hdRes.error;
			if (firstError) {
				alert(firstError);
				return;
			}

			setSearchResults({
				products: hhRes.data || [],
				nhap: pnRes.data || [],
				xuat: pxRes.data || [],
				invoices: hdRes.data || [],
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra khi tìm kiếm');
		} finally {
			setSearching(false);
		}
	}

	function csvCell(value: any): string {
		if (value === null || value === undefined) return '""';
		const s = String(value).replace(/"/g, '""');
		return `"${s}"`;
	}

	function buildCsvForCurrentTab(): { filename: string; csv: string } | null {
		const rangeLabel = fromDate && toDate ? `${fromDate}_to_${toDate}` : 'all';
		const lines: string[] = [];

		if (activeTab === 'nhap' && nhapData) {
			lines.push('"Báo cáo phiếu nhập"');
			if (fromDate && toDate) {
				lines.push([csvCell('Từ ngày'), csvCell(fromDate), csvCell('Đến ngày'), csvCell(toDate)].join(','));
			}
			lines.push('');
			lines.push([csvCell('Tổng phiếu'), csvCell('Tổng số lượng'), csvCell('Tổng giá trị')].join(','));
			lines.push([
				csvCell(nhapData.totalPhieu),
				csvCell(nhapData.totalQuantity),
				csvCell(nhapData.totalValue),
			].join(','));
			lines.push('');
			lines.push('"Nhập theo tháng"');
			lines.push([csvCell('Tháng'), csvCell('Số phiếu'), csvCell('Giá trị')].join(','));
			for (const m of nhapData.byMonth) {
				lines.push([csvCell(m.month), csvCell(m.count), csvCell(m.value)].join(','));
			}
			lines.push('');
			lines.push('"Top nhà cung cấp"');
			lines.push([csvCell('Mã NCC'), csvCell('Số phiếu'), csvCell('Giá trị')].join(','));
			for (const ncc of nhapData.byNCC) {
				lines.push([csvCell(ncc.name), csvCell(ncc.count), csvCell(ncc.value)].join(','));
			}
			lines.push('');
			lines.push('"Top sản phẩm nhập"');
			lines.push([csvCell('Sản phẩm'), csvCell('Số lượng'), csvCell('Giá trị')].join(','));
			for (const p of nhapData.byProduct) {
				lines.push([csvCell(p.name), csvCell(p.quantity), csvCell(p.value)].join(','));
			}
			return { filename: `bao_cao_nhap_${rangeLabel}.csv`, csv: lines.join('\r\n') };
		}

		if (activeTab === 'xuat' && xuatData) {
			lines.push('"Báo cáo phiếu xuất"');
			if (fromDate && toDate) {
				lines.push([csvCell('Từ ngày'), csvCell(fromDate), csvCell('Đến ngày'), csvCell(toDate)].join(','));
			}
			lines.push('');
			lines.push([csvCell('Tổng phiếu'), csvCell('Tổng số lượng'), csvCell('Tổng giá trị')].join(','));
			lines.push([
				csvCell(xuatData.totalPhieu),
				csvCell(xuatData.totalQuantity),
				csvCell(xuatData.totalValue),
			].join(','));
			lines.push('');
			lines.push('"Xuất theo tháng"');
			lines.push([csvCell('Tháng'), csvCell('Số phiếu'), csvCell('Giá trị')].join(','));
			for (const m of xuatData.byMonth) {
				lines.push([csvCell(m.month), csvCell(m.count), csvCell(m.value)].join(','));
			}
			lines.push('');
			lines.push('"Top nhân viên"');
			lines.push([csvCell('Nhân viên'), csvCell('Số phiếu'), csvCell('Giá trị')].join(','));
			for (const nv of xuatData.byNV) {
				lines.push([csvCell(nv.name), csvCell(nv.count), csvCell(nv.value)].join(','));
			}
			lines.push('');
			lines.push('"Top sản phẩm xuất"');
			lines.push([csvCell('Sản phẩm'), csvCell('Số lượng'), csvCell('Giá trị')].join(','));
			for (const p of xuatData.byProduct) {
				lines.push([csvCell(p.name), csvCell(p.quantity), csvCell(p.value)].join(','));
			}
			return { filename: `bao_cao_xuat_${rangeLabel}.csv`, csv: lines.join('\r\n') };
		}

		if (activeTab === 'doanh-thu' && doanhThuData) {
			lines.push('"Báo cáo doanh thu"');
			if (fromDate && toDate) {
				lines.push([csvCell('Từ ngày'), csvCell(fromDate), csvCell('Đến ngày'), csvCell(toDate)].join(','));
			}
			lines.push('');
			lines.push([csvCell('Tổng doanh thu'), csvCell('Tổng số hóa đơn')].join(','));
			lines.push([
				csvCell(doanhThuData.totalRevenue),
				csvCell(doanhThuData.totalInvoices),
			].join(','));
			lines.push('');
			lines.push('"Doanh thu theo tháng"');
			lines.push([csvCell('Tháng'), csvCell('Doanh thu')].join(','));
			for (const m of doanhThuData.byMonth) {
				lines.push([csvCell(m.month), csvCell(m.revenue)].join(','));
			}
			return { filename: `bao_cao_doanh_thu_${rangeLabel}.csv`, csv: lines.join('\r\n') };
		}
		
		if (activeTab === 'ton-kho' && tonKhoData) {
			lines.push('"Báo cáo tồn kho"');
			lines.push('');
			lines.push([csvCell('Tổng số sản phẩm'), csvCell('Tổng số lượng tồn'), csvCell('Tổng giá trị tồn')].join(','));
			lines.push([
				csvCell(tonKhoData.totalProducts),
				csvCell(tonKhoData.totalQuantity),
				csvCell(tonKhoData.totalValue),
			].join(','));
			lines.push('');
			lines.push('"Sản phẩm sắp hết hàng (\u2264 10)"');
			lines.push([csvCell('Sản phẩm'), csvCell('Số lượng tồn')].join(','));
			for (const p of tonKhoData.lowStock) {
				lines.push([csvCell(p.name), csvCell(p.quantity)].join(','));
			}
			return { filename: `bao_cao_ton_kho_${rangeLabel}.csv`, csv: lines.join('\r\n') };
		}

		if (activeTab === 'tim-kiem' && searchResults) {
			lines.push('"Kết quả tra cứu - tìm kiếm"');
			lines.push([csvCell('Từ khóa'), csvCell(searchQuery || '')].join(','));
			lines.push('');

			lines.push('"Hàng hóa"');
			lines.push([csvCell('Mã hàng'), csvCell('Tên hàng'), csvCell('Tồn kho'), csvCell('Đơn giá')].join(','));
			for (const p of searchResults.products) {
				lines.push([
					csvCell(p.MaHH),
					csvCell(p.TenHH),
					csvCell(p.SoLuongTon || 0),
					csvCell(p.DonGia || 0),
				].join(','));
			}
			lines.push('');

			lines.push('"Phiếu nhập"');
			lines.push([csvCell('Số PN'), csvCell('Ngày nhập'), csvCell('Mã NCC'), csvCell('Tổng tiền')].join(','));
			for (const p of searchResults.nhap) {
				lines.push([
					csvCell(p.SoPN),
					csvCell(p.NgayNhap),
					csvCell(p.MaNCC || ''),
					csvCell(p.TongTien || 0),
				].join(','));
			}
			lines.push('');

			lines.push('"Phiếu xuất"');
			lines.push([csvCell('Số PX'), csvCell('Ngày xuất'), csvCell('Mã NV'), csvCell('Tổng tiền')].join(','));
			for (const p of searchResults.xuat) {
				lines.push([
					csvCell(p.SoPX),
					csvCell(p.NgayXuat),
					csvCell(p.MaNV || ''),
					csvCell(p.TongTien || 0),
				].join(','));
			}
			lines.push('');

			lines.push('"Hóa đơn"');
			lines.push([csvCell('Mã HD'), csvCell('Ngày lập'), csvCell('Mã KH'), csvCell('Trạng thái'), csvCell('Tổng tiền')].join(','));
			for (const inv of searchResults.invoices) {
				lines.push([
					csvCell(inv.MaHD),
					csvCell(inv.NgayLap),
					csvCell(inv.MaKH || ''),
					csvCell(inv.TrangThai || ''),
					csvCell(inv.TongTien || 0),
				].join(','));
			}
			return { filename: `bao_cao_tra_cuu_${searchQuery || 'tat_ca'}.csv`, csv: lines.join('\r\n') };
		}

		return null;
	}

	function downloadFile(filename: string, content: string, mime: string) {
		if (typeof window === 'undefined' || typeof document === 'undefined') return;
		const blob = new Blob([content], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function handleExport() {
		if (activeTab === 'tim-kiem' && !searchResults) {
			alert('Vui lòng thực hiện tìm kiếm trước khi xuất báo cáo cho tab Tra cứu.');
			return;
		}

		if (typeof window === 'undefined') return;
		const choice = window.prompt('Xuất báo cáo dạng nào? Nhập "csv" hoặc "pdf" (in ra):', 'csv');
		if (!choice) return;
		const fmt = choice.toLowerCase();

		if (fmt === 'pdf') {
			// Dùng hộp thoại in của trình duyệt, người dùng có thể chọn "Save as PDF"
			window.print();
			return;
		}

		const exportData = buildCsvForCurrentTab();
		if (!exportData) {
			alert('Không có dữ liệu để xuất cho tab hiện tại.');
			return;
		}

		downloadFile(exportData.filename, exportData.csv, 'text/csv;charset=utf-8;');
	}

	const tabs = [
		{ id: 'nhap' as TabType, label: '📥 Báo cáo phiếu Nhập', icon: Package },
		{ id: 'xuat' as TabType, label: '📤 Báo cáo phiếu Xuất', icon: Package },
		{ id: 'doanh-thu' as TabType, label: '💰 Thống kê doanh thu', icon: DollarSign },
		{ id: 'ton-kho' as TabType, label: '📦 Thống kê tồn kho', icon: TrendingUp },
		{ id: 'tim-kiem' as TabType, label: '🔍 Tra cứu - Tìm kiếm', icon: Search },
	];

	return (
		<div className="space-y-6 min-h-screen p-6 bg-gradient-to-br from-[#f2f4fb] via-[#e6ebf7] to-[#dbe1f0] text-[#2f3650]">
			<div className="w-full bg-[#eef1f8]/90 backdrop-blur-xl rounded-[24px] shadow-[20px_20px_40px_-28px_rgba(79,90,119,0.4),-16px_-16px_32px_rgba(255,255,255,0.92)] border border-white/60 p-6">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-[#313a5a]">Báo cáo & Thống kê</h1>
						<p className="text-sm text-[#6b7aa6]">Tổng hợp số liệu nhập/xuất, doanh thu và tồn kho</p>
					</div>
					<div className="flex flex-wrap gap-3 items-center text-sm">
						<div className="flex items-center gap-2">
							<label className="text-[#6b7aa6]">Từ ngày</label>
							<input
								type="date"
								value={fromDate}
								onChange={(e) => setFromDate(e.target.value)}
								className="rounded-xl border border-[#d9e0f3] bg-white/70 px-3 py-1.5 text-sm text-[#2f3650] shadow-[6px_6px_14px_rgba(146,163,184,0.18),-6px_-6px_14px_rgba(255,255,255,0.95)] focus:border-[#9fb4ff] focus:outline-none focus:ring-2 focus:ring-[#cfd8ff]"
							/>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-[#6b7aa6]">Đến ngày</label>
							<input
								type="date"
								value={toDate}
								onChange={(e) => setToDate(e.target.value)}
								className="rounded-xl border border-[#d9e0f3] bg-white/70 px-3 py-1.5 text-sm text-[#2f3650] shadow-[6px_6px_14px_rgba(146,163,184,0.18),-6px_-6px_14px_rgba(255,255,255,0.95)] focus:border-[#9fb4ff] focus:outline-none focus:ring-2 focus:ring-[#cfd8ff]"
							/>
						</div>
						<Button onClick={handleExport} className="bg-gradient-to-r from-[#7fa5ff] to-[#5f73c7] text-white shadow-[8px_8px_16px_rgba(111,130,179,0.25),-6px_-6px_14px_rgba(255,255,255,0.95)] hover:brightness-105">
							<Download className="w-4 h-4 mr-2" />
							Xuất báo cáo
						</Button>
					</div>
				</div>

				{/* Tabs */}
				<div className="mt-4 flex flex-wrap gap-2">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition shadow-[6px_6px_14px_rgba(146,163,184,0.18),-6px_-6px_14px_rgba(255,255,255,0.95)] ${
								activeTab === tab.id
									? 'bg-[#e4e9f8] border-[#9fb4ff] text-[#2f3650]'
									: 'bg-white/80 border-[#d9e0f3] text-[#6b7aa6] hover:bg-[#eef1f8]'
							}`}
						>
							<tab.icon className="w-4 h-4" />
							{tab.label}
						</button>
					))}
				</div>

				{/* Content */}
				{loading ? (
					<div className="text-center py-10 text-gray-500">Đang tải...</div>
				) : (
					<>
						{activeTab === 'nhap' && nhapData && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									{[
										{ label: 'Tổng số phiếu nhập', value: nhapData.totalPhieu, icon: Package },
										{ label: 'Tổng số lượng nhập', value: nhapData.totalQuantity.toLocaleString('vi-VN'), icon: TrendingUp },
										{ label: 'Tổng giá trị nhập', value: `${nhapData.totalValue.toLocaleString('vi-VN')} ₫`, icon: DollarSign },
									].map((item, idx) => (
										<div key={idx} className="rounded-2xl border border-[#d9e0f3] bg-white/75 shadow-[12px_12px_28px_rgba(146,163,184,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
											<div className="flex items-center justify-between">
												<div>
													<div className="text-sm text-[#6b7aa6]">{item.label}</div>
													<div className="text-2xl font-bold text-[#2f3650] mt-1">{item.value}</div>
												</div>
												<item.icon className="w-8 h-8 text-[#5f73c7]" />
											</div>
										</div>
									))}
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
										<div className="font-semibold text-[#2f3650] mb-4">📈 Giá trị nhập theo tháng</div>
										<div className="h-64">
											<ResponsiveContainer width="100%" height={240}>
												<LineChart data={nhapData.byMonth}>
													<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e0f3" />
													<XAxis dataKey="month" stroke="#6b7aa6" />
													<YAxis stroke="#6b7aa6" tickFormatter={(v) => `${v / 1000000}M`} />
													<Tooltip formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} ₫`} contentStyle={{ borderRadius: 12, border: '#d9e0f3 solid 1px' }} />
													<Line type="monotone" dataKey="value" stroke="#5f73c7" strokeWidth={2} dot={false} />
												</LineChart>
											</ResponsiveContainer>
										</div>
									</div>
									<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
										<div className="font-semibold text-[#2f3650] mb-4">🏢 Top nhà cung cấp</div>
										<div className="h-64">
											<ResponsiveContainer width="100%" height={240}>
												<PieChart>
													<Pie data={nhapData.byNCC} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#5f73c7" stroke="#eef1f8" strokeWidth={2}>
														{nhapData.byNCC.map((_, index) => (
															<Cell key={`cell-${index}`} fill={['#5f73c7', '#7fa5ff', '#22c55e', '#f59e0b', '#38bdf8'][index % 5]} />
														))}
													</Pie>
													<Tooltip formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} ₫`} contentStyle={{ borderRadius: 12, border: '#d9e0f3 solid 1px' }} />
													<Legend />
												</PieChart>
											</ResponsiveContainer>
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
									<div className="font-semibold text-[#2f3650] mb-4">📦 Top sản phẩm nhập nhiều nhất</div>
									<div className="overflow-x-auto">
										<table className="min-w-full text-sm">
											<thead>
												<tr className="text-left bg-[#eef1f8] text-[#6b7aa6] border-b border-[#d9e0f3]">
													<th className="py-2 px-4 font-medium">STT</th>
													<th className="py-2 px-4 font-medium">Tên sản phẩm</th>
													<th className="py-2 px-4 font-medium text-right">Số lượng</th>
													<th className="py-2 px-4 font-medium text-right">Giá trị</th>
												</tr>
											</thead>
											<tbody>
												{nhapData.byProduct.map((p, i) => (
													<tr key={i} className="border-b border-[#eef1f8] hover:bg-[#f6f8fc]">
														<td className="py-2 px-4">{i + 1}</td>
														<td className="py-2 px-4">{p.name}</td>
														<td className="py-2 px-4 text-right">{p.quantity.toLocaleString('vi-VN')}</td>
														<td className="py-2 px-4 text-right font-medium text-[#5f73c7]">{p.value.toLocaleString('vi-VN')} ₫</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'xuat' && xuatData && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									{[
										{ label: 'Tổng số phiếu xuất', value: xuatData.totalPhieu, icon: Package },
										{ label: 'Tổng số lượng xuất', value: xuatData.totalQuantity.toLocaleString('vi-VN'), icon: TrendingUp },
										{ label: 'Tổng giá trị xuất', value: `${xuatData.totalValue.toLocaleString('vi-VN')} ₫`, icon: DollarSign },
									].map((item, idx) => (
										<div key={idx} className="rounded-2xl border border-[#d9e0f3] bg-white/75 shadow-[12px_12px_28px_rgba(146,163,184,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
											<div className="flex items-center justify-between">
												<div>
													<div className="text-sm text-[#6b7aa6]">{item.label}</div>
													<div className="text-2xl font-bold text-[#2f3650] mt-1">{item.value}</div>
												</div>
												<item.icon className="w-8 h-8 text-[#5f73c7]" />
											</div>
										</div>
									))}
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
										<div className="font-semibold text-[#2f3650] mb-4">📈 Giá trị xuất theo tháng</div>
										<div className="h-64">
											<ResponsiveContainer width="100%" height={240}>
												<LineChart data={xuatData.byMonth}>
													<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e0f3" />
													<XAxis dataKey="month" stroke="#6b7aa6" />
													<YAxis stroke="#6b7aa6" tickFormatter={(v) => `${v / 1000000}M`} />
													<Tooltip formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} ₫`} contentStyle={{ borderRadius: 12, border: '#d9e0f3 solid 1px' }} />
													<Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
												</LineChart>
											</ResponsiveContainer>
										</div>
									</div>
									<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
										<div className="font-semibold text-[#2f3650] mb-4">👔 Top nhân viên</div>
										<div className="h-64">
											<ResponsiveContainer width="100%" height={240}>
												<BarChart data={xuatData.byNV}>
													<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e0f3" />
													<XAxis dataKey="name" stroke="#6b7aa6" />
													<YAxis stroke="#6b7aa6" tickFormatter={(v) => `${v / 1000000}M`} />
													<Tooltip formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} ₫`} contentStyle={{ borderRadius: 12, border: '#d9e0f3 solid 1px' }} />
													<Bar dataKey="value" fill="#5f73c7" radius={[8, 8, 8, 8]} />
												</BarChart>
											</ResponsiveContainer>
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
									<div className="font-semibold text-[#2f3650] mb-4">📦 Top sản phẩm xuất nhiều nhất</div>
									<div className="overflow-x-auto">
										<table className="min-w-full text-sm">
											<thead>
												<tr className="text-left bg-[#eef1f8] text-[#6b7aa6] border-b border-[#d9e0f3]">
													<th className="py-2 px-4 font-medium">STT</th>
													<th className="py-2 px-4 font-medium">Tên sản phẩm</th>
													<th className="py-2 px-4 font-medium text-right">Số lượng</th>
													<th className="py-2 px-4 font-medium text-right">Giá trị</th>
												</tr>
											</thead>
											<tbody>
												{xuatData.byProduct.map((p, i) => (
													<tr key={i} className="border-b border-[#eef1f8] hover:bg-[#f6f8fc]">
														<td className="py-2 px-4">{i + 1}</td>
														<td className="py-2 px-4">{p.name}</td>
														<td className="py-2 px-4 text-right">{p.quantity.toLocaleString('vi-VN')}</td>
														<td className="py-2 px-4 text-right font-medium text-[#5f73c7]">{p.value.toLocaleString('vi-VN')} ₫</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'doanh-thu' && doanhThuData && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-[#6b7aa6]">Tổng doanh thu</div>
												<div className="text-2xl font-bold text-[#2f3650] mt-1">{doanhThuData.totalRevenue.toLocaleString('vi-VN')} ₫</div>
											</div>
											<DollarSign className="w-8 h-8 text-[#22c55e]" />
										</div>
									</div>
									<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm text-[#6b7aa6]">Tổng số hóa đơn</div>
												<div className="text-2xl font-bold text-[#2f3650] mt-1">{doanhThuData.totalInvoices}</div>
											</div>
											<Package className="w-8 h-8 text-[#5f73c7]" />
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
									<div className="font-semibold text-[#2f3650] mb-4">📈 Doanh thu theo tháng</div>
									<div className="h-64">
										<ResponsiveContainer width="100%" height={240}>
											<LineChart data={doanhThuData.byMonth}>
												<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9e0f3" />
												<XAxis dataKey="month" stroke="#6b7aa6" />
												<YAxis stroke="#6b7aa6" tickFormatter={(v) => `${v / 1000000}M`} />
												<Tooltip formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} ₫`} contentStyle={{ borderRadius: 12, border: '#d9e0f3 solid 1px' }} />
												<Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
											</LineChart>
										</ResponsiveContainer>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'ton-kho' && tonKhoData && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									{[
										{ label: 'Tổng số sản phẩm', value: tonKhoData.totalProducts, icon: Package },
										{ label: 'Tổng số lượng tồn', value: tonKhoData.totalQuantity.toLocaleString('vi-VN'), icon: TrendingUp },
										{ label: 'Tổng giá trị tồn', value: `${tonKhoData.totalValue.toLocaleString('vi-VN')} ₫`, icon: DollarSign },
									].map((item, idx) => (
										<div key={idx} className="rounded-2xl border border-[#d9e0f3] bg-white/75 shadow-[12px_12px_28px_rgba(146,163,184,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
											<div className="flex items-center justify-between">
												<div>
													<div className="text-sm text-[#6b7aa6]">{item.label}</div>
													<div className="text-2xl font-bold text-[#2f3650] mt-1">{item.value}</div>
												</div>
												<item.icon className="w-8 h-8 text-[#5f73c7]" />
											</div>
										</div>
									))}
								</div>
								<div className="rounded-2xl border border-[#d9e0f3] bg-white/80 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
									<div className="font-semibold text-[#2f3650] mb-4">⚠️ Sản phẩm sắp hết hàng (≤ 10)</div>
									<div className="overflow-x-auto">
										<table className="min-w-full text-sm">
											<thead>
												<tr className="text-left bg-[#eef1f8] text-[#6b7aa6] border-b border-[#d9e0f3]">
													<th className="py-2 px-4 font-medium">STT</th>
													<th className="py-2 px-4 font-medium">Tên sản phẩm</th>
													<th className="py-2 px-4 font-medium text-right">Số lượng tồn</th>
												</tr>
											</thead>
											<tbody>
												{tonKhoData.lowStock.map((p, i) => (
													<tr key={i} className="border-b border-[#eef1f8] hover:bg-[#f6f8fc]">
														<td className="py-2 px-4">{i + 1}</td>
														<td className="py-2 px-4">{p.name}</td>
														<td className="py-2 px-4 text-right font-medium text-[#5f73c7]">{p.quantity}</td>
													</tr>
												))}
												{tonKhoData.lowStock.length === 0 && (
													<tr>
														<td colSpan={3} className="py-6 text-center text-[#6b7aa6]">Không có sản phẩm nào sắp hết hàng</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						)}

						{activeTab === 'tim-kiem' && (
							<div className="space-y-6">
								<div className="rounded-2xl border border-[#d9e0f3] bg-white/85 shadow-[12px_12px_28px_rgba(146,163,184,0.16),-10px_-10px_24px_rgba(255,255,255,0.95)] p-4">
									<div className="flex gap-3 mb-4">
										<input
											type="text"
											className="flex-1 bg-white/80 border border-[#d9e0f3] rounded-xl px-4 py-2 text-sm text-[#2f3650] placeholder:text-[#9aa5c4] shadow-[6px_6px_14px_rgba(146,163,184,0.16),-6px_-6px_14px_rgba(255,255,255,0.95)] focus:border-[#9fb4ff] focus:outline-none focus:ring-2 focus:ring-[#cfd8ff]"
											placeholder="Tìm kiếm hàng hóa, phiếu nhập, phiếu xuất, hóa đơn..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
										/>
										<Button
											onClick={handleSearch}
											disabled={searching}
											className="bg-gradient-to-r from-[#7fa5ff] to-[#5f73c7] text-white shadow-[8px_8px_16px_rgba(111,130,179,0.25),-6px_-6px_14px_rgba(255,255,255,0.95)] hover:brightness-105"
										>
											<Search className="w-4 h-4 mr-2" />
											{searching ? 'Đang tìm...' : 'Tìm kiếm'}
										</Button>
									</div>

									{!searchResults && !searching && (
										<div className="text-center py-10 text-[#6b7aa6]">
											<Search className="w-12 h-12 mx-auto mb-3 text-[#9aa5c4]" />
											<p>Nhập từ khóa và bấm "Tìm kiếm" để tra cứu hàng hóa, phiếu nhập, phiếu xuất, hóa đơn.</p>
										</div>
									)}

									{searching && (
										<div className="text-center py-8 text-[#6b7aa6]">Đang tìm kiếm...</div>
									)}

									{searchResults && !searching && (
										<div className="space-y-8">
											<div>
												<div className="text-sm font-semibold text-[#2f3650] mb-2">Hàng hóa</div>
												{searchResults.products.length === 0 ? (
													<div className="text-sm text-[#6b7aa6]">Không có kết quả.</div>
												) : (
													<div className="overflow-x-auto">
														<table className="min-w-full text-sm">
															<thead>
																<tr className="text-left bg-[#eef1f8] text-[#6b7aa6] border-b border-[#d9e0f3]">
																	<th className="py-2 px-4 font-medium">Mã hàng</th>
																	<th className="py-2 px-4 font-medium">Tên hàng</th>
																	<th className="py-2 px-4 font-medium text-right">Tồn kho</th>
																	<th className="py-2 px-4 font-medium text-right">Đơn giá</th>
																</tr>
															</thead>
															<tbody>
																{searchResults.products.map((p: any, idx: number) => (
																	<tr key={p.MaHH || idx} className="border-b border-[#eef1f8] hover:bg-[#f6f8fc]">
																		<td className="py-2 px-4">{p.MaHH}</td>
																		<td className="py-2 px-4">{p.TenHH}</td>
																		<td className="py-2 px-4 text-right">{(p.SoLuongTon || 0).toLocaleString('vi-VN')}</td>
																		<td className="py-2 px-4 text-right">{(p.DonGia || 0).toLocaleString('vi-VN')} ₫</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												)}
											</div>

											<div>
												<div className="text-sm font-semibold text-[#2f3650] mb-2">Phiếu nhập</div>
												{searchResults.nhap.length === 0 ? (
													<div className="text-sm text-[#6b7aa6]">Không có kết quả.</div>
												) : (
													<div className="overflow-x-auto">
														<table className="min-w-full text-sm">
															<thead>
																<tr className="text-left bg-[#eef1f8] text-[#6b7aa6] border-b border-[#d9e0f3]">
																	<th className="py-2 px-4 font-medium">Số PN</th>
																	<th className="py-2 px-4 font-medium">Ngày nhập</th>
																	<th className="py-2 px-4 font-medium">Mã NCC</th>
																	<th className="py-2 px-4 font-medium text-right">Tổng tiền</th>
																</tr>
															</thead>
															<tbody>
																{searchResults.nhap.map((p: any, idx: number) => (
																	<tr key={p.SoPN || idx} className="border-b border-[#eef1f8] hover:bg-[#f6f8fc]">
																		<td className="py-2 px-4">{p.SoPN}</td>
																		<td className="py-2 px-4">{p.NgayNhap}</td>
																		<td className="py-2 px-4">{p.MaNCC || '-'}</td>
																		<td className="py-2 px-4 text-right">{(p.TongTien || 0).toLocaleString('vi-VN')} ₫</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												)}
											</div>

											<div>
												<div className="text-sm font-semibold text-[#2f3650] mb-2">Phiếu xuất</div>
												{searchResults.xuat.length === 0 ? (
													<div className="text-sm text-[#6b7aa6]">Không có kết quả.</div>
												) : (
													<div className="overflow-x-auto">
														<table className="min-w-full text-sm">
															<thead>
																<tr className="text-left bg-[#eef1f8] text-[#6b7aa6] border-b border-[#d9e0f3]">
																	<th className="py-2 px-4 font-medium">Số PX</th>
																	<th className="py-2 px-4 font-medium">Ngày xuất</th>
																	<th className="py-2 px-4 font-medium">Mã NV</th>
																	<th className="py-2 px-4 font-medium text-right">Tổng tiền</th>
																</tr>
															</thead>
															<tbody>
																{searchResults.xuat.map((p: any, idx: number) => (
																	<tr key={p.SoPX || idx} className="border-b border-[#eef1f8] hover:bg-[#f6f8fc]">
																		<td className="py-2 px-4">{p.SoPX}</td>
																		<td className="py-2 px-4">{p.NgayXuat}</td>
																		<td className="py-2 px-4">{p.MaNV}</td>
																		<td className="py-2 px-4 text-right">{(p.TongTien || 0).toLocaleString('vi-VN')} ₫</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												)}
											</div>

											<div>
												<div className="text-sm font-semibold text-[#2f3650] mb-2">Hóa đơn</div>
												{searchResults.invoices.length === 0 ? (
													<div className="text-sm text-[#6b7aa6]">Không có kết quả.</div>
												) : (
													<div className="overflow-x-auto">
														<table className="min-w-full text-sm">
															<thead>
																<tr className="text-left bg-[#eef1f8] text-[#6b7aa6] border-b border-[#d9e0f3]">
																	<th className="py-2 px-4 font-medium">Mã HD</th>
																	<th className="py-2 px-4 font-medium">Ngày lập</th>
																	<th className="py-2 px-4 font-medium">Mã KH</th>
																	<th className="py-2 px-4 font-medium">Trạng thái</th>
																	<th className="py-2 px-4 font-medium text-right">Tổng tiền</th>
																</tr>
															</thead>
															<tbody>
																{searchResults.invoices.map((inv: any, idx: number) => (
																	<tr key={inv.MaHD || idx} className="border-b border-[#eef1f8] hover:bg-[#f6f8fc]">
																		<td className="py-2 px-4">{inv.MaHD}</td>
																		<td className="py-2 px-4">{inv.NgayLap}</td>
																		<td className="py-2 px-4">{inv.MaKH || '-'}</td>
																		<td className="py-2 px-4">{inv.TrangThai}</td>
																		<td className="py-2 px-4 text-right">{(inv.TongTien || 0).toLocaleString('vi-VN')} ₫</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, QrCode } from 'lucide-react';

type HoaDon = {
	MaHD: string;
	NgayLap: string | null;
	MaKH: string | null;
	TongTien: number | null;
	TrangThai: string;
	SoPX: string | null;
	SoPN: string | null;
	MaNV: string | null;
};

type ChiTiet = {
	MaHH: string;
	TenHH: string | null;
	SoLuong: number | null;
	DonGia: number | null;
	TongTien: string;
};

export default function EInvoicePage() {
	const params = useParams();
	const mahd = params.id as string;
	const [hoaDon, setHoaDon] = useState<HoaDon | null>(null);
	const [chiTiet, setChiTiet] = useState<ChiTiet[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const [hdRes, ctRes] = await Promise.all([
					fetch(`/api/hoa-don?id=${mahd}`, {
						credentials: 'include',
					}).then((r) => {
						if (!r.ok) {
							throw new Error(`HTTP error! status: ${r.status}`);
						}
						return r.json();
					}),
					fetch(`/api/hoa-don/${mahd}/chi-tiet`, {
						credentials: 'include',
					}).then((r) => {
						if (!r.ok) {
							console.warn('Failed to load chi tiết:', r.status);
							return { data: [], error: null };
						}
						return r.json();
					}).catch((err) => {
						console.error('Error loading chi tiết:', err);
						return { data: [], error: err.message };
					}),
				]);
				
				if (hdRes.error) {
					alert(hdRes.error);
					setLoading(false);
					return;
				}
				
				if (!hdRes.data) {
					alert('Không tìm thấy hóa đơn');
					setLoading(false);
					return;
				}
				
				setHoaDon(hdRes.data);
				
				// Xử lý chi tiết
				if (ctRes.error) {
					console.error('Lỗi khi tải chi tiết:', ctRes.error);
					setChiTiet([]);
				} else {
					const chiTietData = ctRes.data || [];
					console.log('Chi tiết đã load:', chiTietData);
					setChiTiet(chiTietData);
					
					if (chiTietData.length === 0) {
						console.warn('Không có chi tiết hàng hóa cho hóa đơn này');
					}
				}
			} catch (err: any) {
				console.error('Lỗi khi tải dữ liệu:', err);
				alert(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
			} finally {
				setLoading(false);
			}
		}
		if (mahd) load();
	}, [mahd]);

	// Sử dụng TongTien từ hóa đơn thay vì tính lại từ chi tiết
	const tongTien = hoaDon?.TongTien || 0;

	if (loading) {
		return <div className="p-8 text-center">Đang tải...</div>;
	}

	if (!hoaDon) {
		return <div className="p-8 text-center text-red-600">Không tìm thấy hóa đơn</div>;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12 px-4 print:bg-white print:py-0 print:px-0" style={{ printColorAdjust: 'exact' }}>
			<div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none" style={{ printColorAdjust: 'exact' }}>
				{/* Header với gradient đẹp */}
				<div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 relative overflow-hidden">
					<div className="absolute inset-0 bg-black/10"></div>
					<div className="relative z-10">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
									<FileText className="w-10 h-10 text-white" />
								</div>
								<div>
									<h1 className="text-4xl font-bold mb-1">HÓA ĐƠN ĐIỆN TỬ</h1>
									<p className="text-indigo-100 text-sm font-medium">E-INVOICE</p>
								</div>
							</div>
							<div className="text-right">
								<div className="text-sm text-indigo-100 mb-1">Mã hóa đơn</div>
								<div className="text-2xl font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
									{hoaDon.MaHD}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="p-8">
					{/* Thông tin hóa đơn - Card design */}
					<div className="grid md:grid-cols-2 gap-6 mb-8">
						<div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
							<div className="flex items-center gap-2 mb-4">
								<div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
								<h2 className="text-lg font-bold text-gray-800">Thông tin người bán</h2>
							</div>
							<div className="space-y-2 text-sm text-gray-700">
								<div className="font-semibold text-gray-900 text-base">Công ty TNHH Kho Hàng</div>
								<div className="flex items-start gap-2">
									<span className="text-gray-500 min-w-[80px]">Địa chỉ:</span>
									<span>123 Đường ABC, Quận XYZ, TP.HCM</span>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-gray-500 min-w-[80px]">Mã số thuế:</span>
									<span className="font-mono">0123456789</span>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-gray-500 min-w-[80px]">Điện thoại:</span>
									<span>0123456789</span>
								</div>
							</div>
						</div>
						<div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-100 shadow-sm">
							<div className="flex items-center gap-2 mb-4">
								<div className="w-2 h-2 bg-pink-600 rounded-full"></div>
								<h2 className="text-lg font-bold text-gray-800">Thông tin người mua</h2>
							</div>
							<div className="space-y-2 text-sm text-gray-700">
								<div className="flex items-start gap-2">
									<span className="text-gray-500 min-w-[80px]">Mã KH:</span>
									<span className="font-semibold">{hoaDon.MaKH || '-'}</span>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-gray-500 min-w-[80px]">Ngày lập:</span>
									<span>{hoaDon.NgayLap ? new Date(hoaDon.NgayLap).toLocaleDateString('vi-VN') : '-'}</span>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-gray-500 min-w-[80px]">Trạng thái:</span>
									<span className={`font-semibold px-2 py-1 rounded text-xs ${
										hoaDon.TrangThai === 'Đã thanh toán' ? 'bg-green-100 text-green-700' :
										hoaDon.TrangThai === 'Chưa thanh toán' ? 'bg-yellow-100 text-yellow-700' :
										'bg-blue-100 text-blue-700'
									}`}>
										{hoaDon.TrangThai}
									</span>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-gray-500 min-w-[80px]">Mã NV:</span>
									<span className="font-semibold">{hoaDon.MaNV || '-'}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Chi tiết - Table đẹp hơn */}
					<div className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
						{chiTiet.length === 0 ? (
							<div className="p-12 text-center bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-lg">
								<div className="text-4xl mb-3">⚠️</div>
								<p className="text-gray-700 font-semibold text-lg mb-2">Không có chi tiết hàng hóa</p>
								<p className="text-sm text-gray-500">Hóa đơn này chưa có thông tin hàng hóa. Vui lòng kiểm tra lại dữ liệu.</p>
							</div>
						) : (
							<table className="w-full">
								<thead>
									<tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
										<th className="p-4 text-left font-semibold text-sm">STT</th>
										<th className="p-4 text-left font-semibold text-sm">Mã hàng hóa</th>
										<th className="p-4 text-left font-semibold text-sm">Tên hàng hóa</th>
										<th className="p-4 text-right font-semibold text-sm">Số lượng</th>
										<th className="p-4 text-right font-semibold text-sm">Đơn giá</th>
										<th className="p-4 text-right font-semibold text-sm">Thành tiền</th>
									</tr>
								</thead>
								<tbody>
									{chiTiet.map((ct, i) => {
										// Xử lý TongTien có thể là string hoặc number
										const tongTienValue = typeof ct.TongTien === 'string' 
											? parseFloat(ct.TongTien) || 0 
											: (ct.TongTien || 0);
										
										return (
											<tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
												<td className="p-4 text-center text-sm text-gray-600">{i + 1}</td>
												<td className="p-4 text-sm font-medium text-gray-900">{ct.MaHH || '-'}</td>
												<td className="p-4 text-sm text-gray-700">{ct.TenHH || '-'}</td>
												<td className="p-4 text-right text-sm text-gray-600">{ct.SoLuong || 0}</td>
												<td className="p-4 text-right text-sm text-gray-700">{Number(ct.DonGia || 0).toLocaleString('vi-VN')} ₫</td>
												<td className="p-4 text-right text-sm font-semibold text-gray-900">
													{tongTienValue.toLocaleString('vi-VN')} ₫
												</td>
											</tr>
										);
									})}
								</tbody>
								<tfoot>
									<tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-200">
										<td colSpan={5} className="p-4 text-right font-bold text-gray-800 text-base">
											TỔNG TIỀN:
										</td>
										<td className="p-4 text-right font-bold text-2xl text-indigo-600">
											{tongTien.toLocaleString('vi-VN')} ₫
										</td>
									</tr>
								</tfoot>
							</table>
						)}
					</div>

					{/* QR Code và chữ ký số - Design đẹp hơn */}
					<div className="grid md:grid-cols-2 gap-6 mb-8">
						<div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
							<div className="text-center">
								<div className="flex items-center justify-center gap-2 mb-3">
									<div className="w-2 h-2 bg-green-600 rounded-full"></div>
									<h3 className="font-bold text-gray-800">Mã QR</h3>
								</div>
								<div className="w-40 h-40 mx-auto bg-white rounded-xl flex items-center justify-center border-2 border-green-200 shadow-inner">
									<QrCode className="w-32 h-32 text-green-600" />
								</div>
								<p className="text-xs text-gray-600 mt-3">Quét mã để xác thực hóa đơn</p>
							</div>
						</div>
						<div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100 shadow-sm">
							<div className="text-center">
								<div className="flex items-center justify-center gap-2 mb-3">
									<div className="w-2 h-2 bg-amber-600 rounded-full"></div>
									<h3 className="font-bold text-gray-800">Chữ ký số</h3>
								</div>
								<div className="w-40 h-40 mx-auto bg-white rounded-xl flex items-center justify-center border-2 border-amber-200 shadow-inner">
									<div className="text-center p-4">
										<div className="text-xs font-mono text-amber-600 mb-2">DIGITAL</div>
										<div className="text-xs font-mono text-amber-600">SIGNATURE</div>
									</div>
								</div>
								<p className="text-xs text-gray-600 mt-3">Đã ký điện tử</p>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="border-t border-gray-200 pt-6 mt-8">
						<div className="text-center space-y-2">
							<p className="text-xs text-gray-500">Hóa đơn điện tử được tạo tự động bởi hệ thống</p>
							<p className="text-xs text-gray-400">Thời gian tạo: {new Date().toLocaleString('vi-VN')}</p>
						</div>
					</div>

					{/* Nút in */}
					<div className="mt-8 text-center print:hidden">
						<button
							onClick={() => window.print()}
							className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-semibold"
						>
							<Download className="w-5 h-5" />
							In hóa đơn điện tử
						</button>
					</div>
				</div>
			</div>

			<style jsx global>{`
				@media print {
					body {
						background: white !important;
					}
					.print\\:hidden {
						display: none !important;
					}
					@page {
						margin: 1.5cm;
						size: A4;
					}
				}
			`}</style>
		</div>
	);
}


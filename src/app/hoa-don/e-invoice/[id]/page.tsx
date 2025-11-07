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
					}).then((r) => r.json()),
					fetch(`/api/hoa-don/${mahd}/chi-tiet`, {
						credentials: 'include',
					})
						.then((r) => r.json())
						.catch(() => ({ data: [] })),
				]);
				if (hdRes.error) {
					alert(hdRes.error);
					setLoading(false);
					return;
				}
				setHoaDon(hdRes.data);
				setChiTiet(ctRes.data || []);
			} catch (err: any) {
				alert(err.message || 'Có lỗi xảy ra');
			} finally {
				setLoading(false);
			}
		}
		if (mahd) load();
	}, [mahd]);

	const tongTien = chiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);

	if (loading) {
		return <div className="p-8 text-center">Đang tải...</div>;
	}

	if (!hoaDon) {
		return <div className="p-8 text-center text-red-600">Không tìm thấy hóa đơn</div>;
	}

	return (
		<div className="p-8 max-w-4xl mx-auto bg-white" style={{ printColorAdjust: 'exact' }}>
			{/* Header */}
			<div className="text-center mb-8 border-b pb-4">
				<div className="flex items-center justify-center gap-3 mb-2">
					<FileText className="w-8 h-8 text-blue-600" />
					<h1 className="text-3xl font-bold text-gray-800">HÓA ĐƠN ĐIỆN TỬ</h1>
				</div>
				<p className="text-sm text-gray-600">E-INVOICE</p>
				<p className="text-sm text-gray-500 mt-2">Mã hóa đơn: {hoaDon.MaHD}</p>
			</div>

			{/* Thông tin hóa đơn */}
			<div className="mb-6 grid grid-cols-2 gap-4 text-sm">
				<div className="bg-gray-50 p-4 rounded-lg">
					<div className="font-semibold mb-2 text-gray-700">Thông tin người bán</div>
					<div>Công ty TNHH Kho Hàng</div>
					<div>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</div>
					<div>Mã số thuế: 0123456789</div>
					<div>Điện thoại: 0123456789</div>
				</div>
				<div className="bg-gray-50 p-4 rounded-lg">
					<div className="font-semibold mb-2 text-gray-700">Thông tin người mua</div>
					<div>Mã KH: {hoaDon.MaKH || '-'}</div>
					<div>Ngày lập: {hoaDon.NgayLap ? new Date(hoaDon.NgayLap).toLocaleDateString('vi-VN') : '-'}</div>
					<div>Trạng thái: {hoaDon.TrangThai}</div>
					<div>Mã NV: {hoaDon.MaNV || '-'}</div>
				</div>
			</div>

			{/* Chi tiết */}
			<table className="w-full border-collapse border border-gray-300 mb-6">
				<thead>
					<tr className="bg-gray-100">
						<th className="border border-gray-300 p-2 text-left">STT</th>
						<th className="border border-gray-300 p-2 text-left">Mã hàng hóa</th>
						<th className="border border-gray-300 p-2 text-left">Tên hàng hóa</th>
						<th className="border border-gray-300 p-2 text-right">Số lượng</th>
						<th className="border border-gray-300 p-2 text-right">Đơn giá</th>
						<th className="border border-gray-300 p-2 text-right">Thành tiền</th>
					</tr>
				</thead>
				<tbody>
					{chiTiet.map((ct, i) => (
						<tr key={i}>
							<td className="border border-gray-300 p-2 text-center">{i + 1}</td>
							<td className="border border-gray-300 p-2">{ct.MaHH}</td>
							<td className="border border-gray-300 p-2">{ct.TenHH || '-'}</td>
							<td className="border border-gray-300 p-2 text-right">{ct.SoLuong || 0}</td>
							<td className="border border-gray-300 p-2 text-right">{Number(ct.DonGia || 0).toLocaleString('vi-VN')}</td>
							<td className="border border-gray-300 p-2 text-right font-medium">{Number(ct.TongTien || 0).toLocaleString('vi-VN')}</td>
						</tr>
					))}
				</tbody>
				<tfoot>
					<tr className="bg-gray-50 font-bold">
						<td colSpan={5} className="border border-gray-300 p-2 text-right">
							TỔNG TIỀN:
						</td>
						<td className="border border-gray-300 p-2 text-right text-lg text-blue-600">{tongTien.toLocaleString('vi-VN')} ₫</td>
					</tr>
				</tfoot>
			</table>

			{/* QR Code và chữ ký số */}
			<div className="grid grid-cols-2 gap-8 mb-6">
				<div className="text-center">
					<div className="font-semibold mb-2 text-gray-700">Mã QR</div>
					<div className="w-32 h-32 mx-auto bg-gray-200 flex items-center justify-center border-2 border-gray-300 rounded">
						<QrCode className="w-24 h-24 text-gray-400" />
					</div>
					<div className="text-xs text-gray-500 mt-2">Quét mã để xác thực hóa đơn</div>
				</div>
				<div className="text-center">
					<div className="font-semibold mb-2 text-gray-700">Chữ ký số</div>
					<div className="w-32 h-32 mx-auto bg-gray-200 flex items-center justify-center border-2 border-gray-300 rounded">
						<div className="text-xs text-gray-500">Digital Signature</div>
					</div>
					<div className="text-xs text-gray-500 mt-2">Đã ký điện tử</div>
				</div>
			</div>

			{/* Footer */}
			<div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
				<p>Hóa đơn điện tử được tạo tự động bởi hệ thống</p>
				<p>Thời gian tạo: {new Date().toLocaleString('vi-VN')}</p>
			</div>

			{/* Nút in */}
			<div className="mt-8 text-center print:hidden">
				<button
					onClick={() => window.print()}
					className="px-6 py-2 bg-[#d47b8a] text-white rounded-lg hover:bg-[#c06c7a] transition inline-flex items-center gap-2"
				>
					<Download className="w-4 h-4" />
					In hóa đơn điện tử
				</button>
			</div>

			<style jsx global>{`
				@media print {
					body {
						background: white;
					}
					.print\\:hidden {
						display: none;
					}
				}
			`}</style>
		</div>
	);
}


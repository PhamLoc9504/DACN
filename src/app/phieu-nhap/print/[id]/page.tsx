'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatVietnamDate } from '@/lib/dateUtils';

type ChiTiet = {
	MaHH: string;
	TenHH: string | null;
	SLNhap: number;
	DGNhap: number;
	TongTien: string;
};

type PhieuNhap = {
	SoPN: string;
	NgayNhap: string | null;
	MaNV: string | null;
	MaNCC: string | null;
};

export default function PrintPhieuNhapPage() {
	const params = useParams();
	const sopn = params.id as string;
	const [phieu, setPhieu] = useState<PhieuNhap | null>(null);
	const [chiTiet, setChiTiet] = useState<ChiTiet[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch(`/api/phieu-nhap/${sopn}`, {
					credentials: 'include',
				}).then((r) => r.json());
				if (res.error) {
					alert(res.error);
					setLoading(false);
					return;
				}
				setPhieu(res.phieu);
				setChiTiet(res.chiTiet || []);
			} catch (err: any) {
				alert(err.message || 'Có lỗi xảy ra');
			} finally {
				setLoading(false);
			}
		}
		if (sopn) load();
	}, [sopn]);

	const tongTien = chiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);

	if (loading) {
		return <div className="p-8 text-center">Đang tải...</div>;
	}

	if (!phieu) {
		return <div className="p-8 text-center text-red-600">Không tìm thấy phiếu nhập</div>;
	}

	return (
		<div className="p-8 max-w-4xl mx-auto bg-white" style={{ printColorAdjust: 'exact' }}>
			{/* Header */}
			<div className="text-center mb-8 border-b pb-4">
				<h1 className="text-2xl font-bold text-gray-800">PHIẾU NHẬP HÀNG</h1>
				<p className="text-sm text-gray-600 mt-2">Số phiếu: {phieu.SoPN}</p>
			</div>

			{/* Thông tin phiếu */}
			<div className="mb-6 grid grid-cols-2 gap-4 text-sm">
				<div>
					<span className="font-medium">Ngày nhập:</span>
					<span className="ml-2">{phieu.NgayNhap ? formatVietnamDate(phieu.NgayNhap) : '-'}</span>
				</div>
				<div>
					<span className="font-medium">Mã nhân viên:</span>
					<span className="ml-2">{phieu.MaNV || '-'}</span>
				</div>
				<div>
					<span className="font-medium">Mã nhà cung cấp:</span>
					<span className="ml-2">{phieu.MaNCC || '-'}</span>
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
							<td className="border border-gray-300 p-2 text-right">{ct.SLNhap}</td>
							<td className="border border-gray-300 p-2 text-right">{Number(ct.DGNhap).toLocaleString('vi-VN')}</td>
							<td className="border border-gray-300 p-2 text-right font-medium">{Number(ct.TongTien).toLocaleString('vi-VN')}</td>
						</tr>
					))}
				</tbody>
				<tfoot>
					<tr className="bg-gray-50 font-bold">
						<td colSpan={5} className="border border-gray-300 p-2 text-right">
							TỔNG TIỀN:
						</td>
						<td className="border border-gray-300 p-2 text-right text-lg">{tongTien.toLocaleString('vi-VN')} ₫</td>
					</tr>
				</tfoot>
			</table>

			{/* Footer */}
			<div className="mt-8 grid grid-cols-2 gap-8 text-sm">
				<div className="text-center">
					<p className="font-medium mb-4">Người lập phiếu</p>
					<p className="border-t pt-2">(Ký, ghi rõ họ tên)</p>
				</div>
				<div className="text-center">
					<p className="font-medium mb-4">Người nhận hàng</p>
					<p className="border-t pt-2">(Ký, ghi rõ họ tên)</p>
				</div>
			</div>

			{/* Nút in */}
			<div className="mt-8 text-center print:hidden">
				<button
					onClick={() => window.print()}
					className="px-6 py-2 bg-[#d47b8a] text-white rounded-lg hover:bg-[#c06c7a] transition"
				>
					🖨️ In phiếu
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


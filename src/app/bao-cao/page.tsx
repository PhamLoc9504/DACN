'use client';

import { useEffect, useMemo, useState } from 'react';

type Invoice = { NgayLap: string | null; TongTien: number | null };

export default function BaoCaoPage() {
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			setLoading(true);
			const res = await fetch('/api/hoa-don').then((r) => r.json());
			setInvoices(
				(res.data || []).map((x: any) => ({
					NgayLap: x.NgayLap,
					TongTien: x.TongTien,
				}))
			);
			setLoading(false);
		})();
	}, []);

	const revenueByMonth = useMemo(() => {
		const map = new Map<string, number>();
		for (const inv of invoices) {
			if (!inv.NgayLap) continue;
			const d = new Date(inv.NgayLap);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			map.set(key, (map.get(key) || 0) + (inv.TongTien || 0));
		}
		return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
	}, [invoices]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#fffdfb] to-[#fff8f3] py-10 text-[#4e3c33]">
			<div className="max-w-3xl mx-auto px-4">
				<h2 className="text-2xl font-semibold mb-6 text-[#d47b8a] text-center">
					Báo cáo thống kê doanh thu
				</h2>

				<div className="bg-white rounded-2xl shadow-md border border-[#f5ebe0] p-6">
					<h3 className="font-semibold text-[#d47b8a] mb-4">Doanh thu theo tháng</h3>

					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left border-b border-[#f5ebe0] bg-[#fce7ec]/40 text-[#8b7065]">
									<th className="py-2 px-3">Tháng</th>
									<th className="py-2 px-3">Doanh thu (VNĐ)</th>
								</tr>
							</thead>
							<tbody>
								{loading &&
									Array.from({ length: 5 }).map((_, i) => (
										<tr key={i} className="animate-pulse border-b border-[#f5ebe0]">
											<td className="py-2 px-3">
												<div className="h-4 w-16 bg-[#f9dfe3] rounded" />
											</td>
											<td className="py-2 px-3">
												<div className="h-4 w-24 bg-[#f9dfe3] rounded" />
											</td>
										</tr>
									))}

								{!loading &&
									revenueByMonth.map(([month, total]) => (
										<tr
											key={month}
											className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/30 transition"
										>
											<td className="py-2 px-3">{month}</td>
											<td className="py-2 px-3 text-[#d47b8a] font-medium">
												{total.toLocaleString('vi-VN')}
											</td>
										</tr>
									))}

								{!loading && revenueByMonth.length === 0 && (
									<tr>
										<td
											colSpan={2}
											className="py-10 text-center text-[#8b7065]/70"
										>
											<div className="mx-auto h-10 w-10 rounded-full bg-[#f9dfe3] mb-3" />
											Không có dữ liệu
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

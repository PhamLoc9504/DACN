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
} from 'recharts';
import { Activity, Users, AlertTriangle, CheckCircle } from 'lucide-react';

type ActivityStats = {
	total: number;
	success: number;
	failed: number;
	byAction: { name: string; value: number }[];
	byDay: { day: string; count: number }[];
	byHour: { hour: string; count: number }[];
	recentErrors: any[];
};

export default function GiamSatHeThongPage() {
	const [stats, setStats] = useState<ActivityStats>({
		total: 0,
		success: 0,
		failed: 0,
		byAction: [],
		byDay: [],
		byHour: [],
		recentErrors: [],
	});
	const [loading, setLoading] = useState(true);
	const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

	useEffect(() => {
		loadStats();
	}, [timeRange]);

	async function loadStats() {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set('limit', '10000');
			params.set('page', '1');
			
			// Tính ngày bắt đầu
			const now = new Date();
			const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
			const fromDate = new Date(now);
			fromDate.setDate(fromDate.getDate() - days);
			params.set('from', fromDate.toISOString().split('T')[0]);
			params.set('to', now.toISOString().split('T')[0]);

			const res = await fetch(`/api/audit-log?${params.toString()}`, {
				credentials: 'include',
			}).then((r) => r.json());
			
			if (res.error) {
				alert(res.error);
				setLoading(false);
				return;
			}

			const logs = res.data || [];
			
			// Tính toán thống kê
			const total = logs.length;
			const success = logs.filter((l: any) => l.trangThai === 'THANH_CONG').length;
			const failed = logs.filter((l: any) => l.trangThai === 'THAT_BAI').length;

			// Thống kê theo hành động
			const actionMap = new Map<string, number>();
			logs.forEach((log: any) => {
				const action = log.loaiHanhDong || 'UNKNOWN';
				actionMap.set(action, (actionMap.get(action) || 0) + 1);
			});
			const byAction = Array.from(actionMap.entries())
				.map(([name, value]) => ({ name, value }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 10);

			// Thống kê theo ngày
			const dayMap = new Map<string, number>();
			logs.forEach((log: any) => {
				if (log.thoiGian) {
					const day = new Date(log.thoiGian).toISOString().split('T')[0];
					dayMap.set(day, (dayMap.get(day) || 0) + 1);
				}
			});
			const byDay = Array.from(dayMap.entries())
				.map(([day, count]) => ({ day: day.slice(5), count }))
				.sort((a, b) => a.day.localeCompare(b.day));

			// Thống kê theo giờ
			const hourMap = new Map<string, number>();
			logs.forEach((log: any) => {
				if (log.thoiGian) {
					const hour = new Date(log.thoiGian).getHours();
					const hourKey = `${hour}:00`;
					hourMap.set(hourKey, (hourMap.get(hourKey) || 0) + 1);
				}
			});
			const byHour = Array.from(hourMap.entries())
				.map(([hour, count]) => ({ hour, count }))
				.sort((a, b) => a.hour.localeCompare(b.hour));

			// Lỗi gần đây
			const recentErrors = logs
				.filter((l: any) => l.trangThai === 'THAT_BAI')
				.slice(0, 10);

			setStats({
				total,
				success,
				failed,
				byAction,
				byDay,
				byHour,
				recentErrors,
			});
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra');
		} finally {
			setLoading(false);
		}
	}

	function getActionLabel(loai: string): string {
		const map: Record<string, string> = {
			DANG_NHAP: 'Đăng nhập',
			DANG_XUAT: 'Đăng xuất',
			TAO: 'Tạo mới',
			SUA: 'Sửa',
			XOA: 'Xóa',
			XEM: 'Xem',
			XUAT_BAO_CAO: 'Xuất báo cáo',
			XUAT_CSV: 'Xuất CSV',
			XUAT_PDF: 'Xuất PDF',
		};
		return map[loai] || loai;
	}

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<div className="flex items-center justify-between mb-5">
					<h1 className="text-2xl font-semibold text-[#d47b8a]">📊 Giám sát hoạt động hệ thống</h1>
					<select
						className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none"
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value as any)}
					>
						<option value="7d">7 ngày qua</option>
						<option value="30d">30 ngày qua</option>
						<option value="90d">90 ngày qua</option>
					</select>
				</div>

				{loading ? (
					<div className="text-center py-10 text-gray-500">Đang tải...</div>
				) : (
					<>
						{/* KPI Cards */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
							<div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-gray-600">Tổng hoạt động</div>
										<div className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</div>
									</div>
									<Activity className="w-8 h-8 text-blue-600" />
								</div>
							</div>
							<div className="rounded-xl border bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-gray-600">Thành công</div>
										<div className="text-2xl font-bold text-gray-800 mt-1">{stats.success}</div>
									</div>
									<CheckCircle className="w-8 h-8 text-green-600" />
								</div>
							</div>
							<div className="rounded-xl border bg-gradient-to-br from-red-50 to-red-100 p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-gray-600">Thất bại</div>
										<div className="text-2xl font-bold text-gray-800 mt-1">{stats.failed}</div>
									</div>
									<AlertTriangle className="w-8 h-8 text-red-600" />
								</div>
							</div>
							<div className="rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-gray-600">Tỷ lệ thành công</div>
										<div className="text-2xl font-bold text-gray-800 mt-1">
											{stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%
										</div>
									</div>
									<Users className="w-8 h-8 text-purple-600" />
								</div>
							</div>
						</div>

						{/* Charts */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
							{/* Hoạt động theo ngày */}
							<div className="rounded-xl border bg-white p-4 shadow-sm">
								<div className="font-semibold text-gray-800 mb-4">Hoạt động theo ngày</div>
								<div className="h-64">
									<ResponsiveContainer width="100%" height={240}>
										<LineChart data={stats.byDay}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
											<XAxis dataKey="day" stroke="#94A3B8" />
											<YAxis stroke="#94A3B8" />
											<Tooltip />
											<Line type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2} dot={false} />
										</LineChart>
									</ResponsiveContainer>
								</div>
							</div>

							{/* Hoạt động theo giờ */}
							<div className="rounded-xl border bg-white p-4 shadow-sm">
								<div className="font-semibold text-gray-800 mb-4">Hoạt động theo giờ</div>
								<div className="h-64">
									<ResponsiveContainer width="100%" height={240}>
										<BarChart data={stats.byHour}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
											<XAxis dataKey="hour" stroke="#94A3B8" />
											<YAxis stroke="#94A3B8" />
											<Tooltip />
											<Bar dataKey="count" fill="#22c55e" />
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>

						{/* Top hành động */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<div className="rounded-xl border bg-white p-4 shadow-sm">
								<div className="font-semibold text-gray-800 mb-4">Top hành động</div>
								<div className="space-y-2">
									{stats.byAction.map((item, i) => (
										<div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
											<span className="text-sm text-gray-700">{getActionLabel(item.name)}</span>
											<span className="text-sm font-semibold text-gray-800">{item.value}</span>
										</div>
									))}
									{stats.byAction.length === 0 && (
										<div className="text-center text-gray-500 py-4">Không có dữ liệu</div>
									)}
								</div>
							</div>

							{/* Lỗi gần đây */}
							<div className="rounded-xl border bg-white p-4 shadow-sm">
								<div className="font-semibold text-gray-800 mb-4">Lỗi gần đây</div>
								<div className="space-y-2 max-h-64 overflow-y-auto">
									{stats.recentErrors.map((error, i) => (
										<div key={i} className="p-2 bg-red-50 rounded border border-red-200">
											<div className="text-xs text-gray-600">
												{new Date(error.thoiGian).toLocaleString('vi-VN')}
											</div>
											<div className="text-sm font-medium text-red-800 mt-1">
												{getActionLabel(error.loaiHanhDong)}
											</div>
											{error.loi && (
												<div className="text-xs text-red-600 mt-1">{error.loi}</div>
											)}
										</div>
									))}
									{stats.recentErrors.length === 0 && (
										<div className="text-center text-gray-500 py-4">Không có lỗi</div>
									)}
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}


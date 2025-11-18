'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import { Settings, Clock, Shield, Database } from 'lucide-react';

type SystemConfig = {
	workingHoursStart: number;
	workingHoursEnd: number;
	workingHoursEnabled: boolean;
	systemName: string;
	systemVersion: string;
};

export default function CauHinhHeThongPage() {
	const [config, setConfig] = useState<SystemConfig>({
		workingHoursStart: 8,
		workingHoursEnd: 17,
		workingHoursEnabled: true,
		systemName: 'Hệ thống quản lý kho hàng',
		systemVersion: '1.0.0',
	});
	const [loading, setLoading] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		// Load config từ localStorage hoặc API (nếu có)
		const savedConfig = localStorage.getItem('system_config');
		if (savedConfig) {
			try {
				setConfig(JSON.parse(savedConfig));
			} catch (e) {
				console.error('Error loading config:', e);
			}
		}
	}, []);

	async function handleSave() {
		setLoading(true);
		setSaved(false);
		
		try {
			// Lưu vào localStorage (trong thực tế có thể lưu vào database)
			localStorage.setItem('system_config', JSON.stringify(config));
			
			// Hiển thị thông báo thành công
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
			
			// Trong thực tế, có thể gọi API để lưu vào database
			// await fetch('/api/system-config', { method: 'PUT', body: JSON.stringify(config) });
		} catch (err: any) {
			alert(err.message || 'Có lỗi xảy ra khi lưu cấu hình');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-semibold text-[#d47b8a]">⚙️ Cấu hình hệ thống</h1>
					{saved && (
						<div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
							✓ Đã lưu thành công
						</div>
					)}
				</div>

				{/* Giờ làm việc */}
				<div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
					<div className="flex items-center gap-3 mb-4">
						<Clock className="w-6 h-6 text-blue-600" />
						<h2 className="text-lg font-semibold text-gray-800">Giờ làm việc</h2>
					</div>
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<input
								type="checkbox"
								id="workingHoursEnabled"
								checked={config.workingHoursEnabled}
								onChange={(e) => setConfig({ ...config, workingHoursEnabled: e.target.checked })}
								className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
							/>
							<label htmlFor="workingHoursEnabled" className="text-sm font-medium text-gray-700">
								Bật kiểm soát giờ làm việc
							</label>
						</div>
						{config.workingHoursEnabled && (
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm mb-1 text-gray-600">Giờ bắt đầu</label>
									<input
										type="number"
										min="0"
										max="23"
										className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
										value={config.workingHoursStart}
										onChange={(e) => setConfig({ ...config, workingHoursStart: parseInt(e.target.value) || 0 })}
									/>
								</div>
								<div>
									<label className="block text-sm mb-1 text-gray-600">Giờ kết thúc</label>
									<input
										type="number"
										min="0"
										max="23"
										className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
										value={config.workingHoursEnd}
										onChange={(e) => setConfig({ ...config, workingHoursEnd: parseInt(e.target.value) || 0 })}
									/>
								</div>
							</div>
						)}
						<div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
							<strong>Lưu ý:</strong> Cấu hình giờ làm việc sẽ áp dụng cho tất cả người dùng (trừ Quản lý kho).
							Để áp dụng thay đổi, cần cập nhật biến môi trường <code>WORKING_HOURS_START</code> và <code>WORKING_HOURS_END</code>.
						</div>
					</div>
				</div>

				{/* Thông tin hệ thống */}
				<div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
					<div className="flex items-center gap-3 mb-4">
						<Database className="w-6 h-6 text-purple-600" />
						<h2 className="text-lg font-semibold text-gray-800">Thông tin hệ thống</h2>
					</div>
					<div className="space-y-4">
						<div>
							<label className="block text-sm mb-1 text-gray-600">Tên hệ thống</label>
							<input
								type="text"
								className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
								value={config.systemName}
								onChange={(e) => setConfig({ ...config, systemName: e.target.value })}
							/>
						</div>
						<div>
							<label className="block text-sm mb-1 text-gray-600">Phiên bản</label>
							<input
								type="text"
								className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
								value={config.systemVersion}
								onChange={(e) => setConfig({ ...config, systemVersion: e.target.value })}
							/>
						</div>
					</div>
				</div>

				{/* Bảo mật */}
				<div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
					<div className="flex items-center gap-3 mb-4">
						<Shield className="w-6 h-6 text-green-600" />
						<h2 className="text-lg font-semibold text-gray-800">Bảo mật</h2>
					</div>
					<div className="space-y-3">
						<div className="bg-white p-4 rounded-lg border border-gray-200">
							<div className="text-sm font-medium text-gray-700 mb-2">Trạng thái bảo mật</div>
							<div className="space-y-2 text-sm text-gray-600">
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 bg-green-500 rounded-full"></span>
									Xác thực người dùng: Đã bật
								</div>
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 bg-green-500 rounded-full"></span>
									Ghi log hoạt động: Đã bật
								</div>
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 bg-green-500 rounded-full"></span>
									Kiểm soát giờ làm việc: {config.workingHoursEnabled ? 'Đã bật' : 'Đã tắt'}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Nút lưu */}
				<div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
					<Button onClick={handleSave} disabled={loading}>
						{loading ? 'Đang lưu...' : '💾 Lưu cấu hình'}
					</Button>
				</div>
			</div>

			{/* Hướng dẫn */}
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<h2 className="text-lg font-semibold text-gray-800 mb-4">📖 Hướng dẫn cấu hình</h2>
				<div className="space-y-3 text-sm text-gray-600">
					<div>
						<strong>Giờ làm việc:</strong> Cấu hình thời gian cho phép người dùng truy cập hệ thống.
						Quản lý kho có thể truy cập mọi lúc.
					</div>
					<div>
						<strong>Thông tin hệ thống:</strong> Tên và phiên bản hiển thị trên giao diện người dùng.
					</div>
					<div>
						<strong>Bảo mật:</strong> Các tính năng bảo mật hiện tại của hệ thống.
					</div>
					<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
						<strong className="text-amber-800">⚠️ Lưu ý:</strong>
						<span className="text-amber-700">
							{' '}Một số cấu hình yêu cầu khởi động lại server để áp dụng thay đổi.
							Vui lòng kiểm tra tài liệu kỹ thuật trước khi thay đổi các cấu hình quan trọng.
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}


'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, RotateCcw, FileText, Calendar, HardDrive, AlertCircle, CheckCircle, Clock, Database, Shield, RefreshCw, Archive } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Pagination from '@/components/Pagination';
import { formatVietnamTime } from '@/lib/dateUtils';

type BackupLog = {
	MaBackup: string;
	NgayBackup: string;
	DungLuong: number;
	TrangThai: string;
	DuongDan: string | null;
	MoTa: string | null;
	SoLuongBang: number;
	NguoiTao: string | null;
};

export default function BackupPage() {
	const [backups, setBackups] = useState<BackupLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [openCreateModal, setOpenCreateModal] = useState(false);
	const [openRestoreModal, setOpenRestoreModal] = useState(false);
	const [selectedBackup, setSelectedBackup] = useState<BackupLog | null>(null);
	const [creating, setCreating] = useState(false);
	const [restoring, setRestoring] = useState(false);
	const [mota, setMota] = useState('');
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		loadBackups();
	}, [page, limit]);

	async function loadBackups() {
		setLoading(true);
		try {
			const res = await fetch(`/api/backup?limit=${limit * page}`, {
				credentials: 'include',
			});
			const data = await res.json();
			if (data.ok) {
				// Đảm bảo dữ liệu được map đúng
				const backups = (data.data || []).map((b: any) => ({
					MaBackup: b.MaBackup || b.mabackup,
					NgayBackup: b.NgayBackup || b.ngaybackup,
					DungLuong: b.DungLuong ?? b.dungluong ?? 0,
					TrangThai: b.TrangThai || b.trangthai || 'Chưa xác định',
					DuongDan: b.DuongDan || b.duongdan,
					MoTa: b.MoTa || b.mota,
					SoLuongBang: b.SoLuongBang ?? b.soluongbang ?? 0,
					NguoiTao: b.NguoiTao || b.nguoitao,
				}));
				setBackups(backups);
				setTotal(backups.length);
			} else {
				console.error('Error loading backups:', data.error);
			}
		} catch (err) {
			console.error('Error loading backups:', err);
		} finally {
			setLoading(false);
		}
	}

	async function handleCreateBackup() {
		setCreating(true);
		try {
			const res = await fetch('/api/backup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ moTa: mota || 'Backup tự động' }),
				credentials: 'include',
			});
			const data = await res.json();
			if (data.ok) {
				alert('✅ Tạo backup thành công!');
				setOpenCreateModal(false);
				setMota('');
				loadBackups();
			} else {
				alert('❌ Lỗi: ' + (data.error || 'Tạo backup thất bại'));
			}
		} catch (err: any) {
			alert('❌ Lỗi: ' + (err.message || 'Tạo backup thất bại'));
		} finally {
			setCreating(false);
		}
	}

	async function handleRestore(backup: BackupLog) {
		if (!confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn restore từ backup "${backup.MaBackup}"?\n\nDữ liệu hiện tại sẽ bị thay thế hoàn toàn!`)) {
			return;
		}

		setRestoring(true);
		try {
			const res = await fetch('/api/backup/restore', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ maBackup: backup.MaBackup }),
				credentials: 'include',
			});
			const data = await res.json();
			if (data.ok) {
				alert(`✅ ${data.data.message || 'Restore thành công!'}`);
				setOpenRestoreModal(false);
				setSelectedBackup(null);
				loadBackups();
			} else {
				alert('❌ Lỗi: ' + (data.error || 'Restore thất bại'));
			}
		} catch (err: any) {
			alert('❌ Lỗi: ' + (err.message || 'Restore thất bại'));
		} finally {
			setRestoring(false);
		}
	}

	async function handleDownload(backup: BackupLog) {
		try {
			const url = `/api/backup/download?mabackup=${encodeURIComponent(backup.MaBackup)}`;
			window.open(url, '_blank');
		} catch (err: any) {
			alert('❌ Lỗi: ' + (err.message || 'Tải file thất bại'));
		}
	}

	async function handleExportAll() {
		try {
			const url = '/api/backup/export';
			window.open(url, '_blank');
		} catch (err: any) {
			alert('❌ Lỗi: ' + (err.message || 'Export thất bại'));
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
		if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
		return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
	}


	function getStatusBadge(status: string) {
		switch (status) {
			case 'Hoàn thành':
				return 'bg-green-100 text-green-800 border-green-300';
			case 'Hoàn thành (không upload)':
				return 'bg-blue-100 text-blue-800 border-blue-300'; // Không phải lỗi, chỉ là cảnh báo
			case 'Đang xử lý':
				return 'bg-yellow-100 text-yellow-800 border-yellow-300';
			case 'Lỗi':
			case 'Lỗi upload':
				return 'bg-red-100 text-red-800 border-red-300';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-300';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'Hoàn thành':
				return <CheckCircle className="w-4 h-4" />;
			case 'Hoàn thành (không upload)':
				return <Database className="w-4 h-4" />; // Icon database thay vì checkmark
			case 'Đang xử lý':
				return <Clock className="w-4 h-4" />;
			case 'Lỗi':
			case 'Lỗi upload':
				return <AlertCircle className="w-4 h-4" />;
			default:
				return <Clock className="w-4 h-4" />;
		}
	}

	const displayedBackups = backups.slice((page - 1) * limit, page * limit);
	// Đếm cả "Hoàn thành" và "Hoàn thành (không upload)" là thành công
	const successfulBackups = backups.filter((b) => 
		b.TrangThai === 'Hoàn thành' || b.TrangThai === 'Hoàn thành (không upload)'
	).length;
	const totalSize = backups.reduce((sum, b) => sum + (b.DungLuong || 0), 0);

	return (
		<div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
			{/* Header */}
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h1 className="text-2xl font-semibold mb-2 text-[#d47b8a] flex items-center gap-2">
							<Database className="w-6 h-6" />
							💾 Quản lý Backup & Restore
						</h1>
						<p className="text-sm text-gray-500">Sao lưu và khôi phục dữ liệu hệ thống</p>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleExportAll}
							className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition shadow-sm flex items-center gap-2 font-medium"
						>
							<FileText className="w-4 h-4" />
							Export Database
						</button>
						<button
							onClick={() => setOpenCreateModal(true)}
							className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition shadow-sm flex items-center gap-2 font-medium"
						>
							<Upload className="w-4 h-4" />
							Tạo Backup
						</button>
					</div>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm">
					<div className="flex items-center justify-between mb-2">
						<div className="text-sm font-medium text-blue-700">Tổng số backup</div>
						<Archive className="w-5 h-5 text-blue-600" />
					</div>
					<div className="text-3xl font-bold text-blue-800">{total}</div>
				</div>
				<div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-sm">
					<div className="flex items-center justify-between mb-2">
						<div className="text-sm font-medium text-green-700">Backup thành công</div>
						<CheckCircle className="w-5 h-5 text-green-600" />
					</div>
					<div className="text-3xl font-bold text-green-800">{successfulBackups}</div>
				</div>
				<div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-sm">
					<div className="flex items-center justify-between mb-2">
						<div className="text-sm font-medium text-purple-700">Tổng dung lượng</div>
						<HardDrive className="w-5 h-5 text-purple-600" />
					</div>
					<div className="text-3xl font-bold text-purple-800">{formatFileSize(totalSize)}</div>
				</div>
				<div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200 shadow-sm">
					<div className="flex items-center justify-between mb-2">
						<div className="text-sm font-medium text-amber-700">Backup gần nhất</div>
						<Calendar className="w-5 h-5 text-amber-600" />
					</div>
					<div className="text-sm font-medium text-amber-800">
						{backups[0] ? formatVietnamTime(backups[0].NgayBackup) : 'Chưa có'}
					</div>
				</div>
			</div>

			{/* Backup List */}
			<div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
				<div className="p-4 border-b border-[#f5ebe0] bg-[#f9f5f1]">
					<h2 className="font-semibold text-[#b07c83] flex items-center gap-2">
						<Shield className="w-5 h-5" />
						Danh sách Backup
					</h2>
				</div>
				{loading ? (
					<div className="p-12 text-center text-gray-500">
						<RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#d47b8a]" />
						<div>Đang tải...</div>
					</div>
				) : displayedBackups.length === 0 ? (
					<div className="p-12 text-center text-gray-500">
						<Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
						<div className="text-lg font-medium mb-1">Chưa có backup nào</div>
						<div className="text-sm">Tạo backup đầu tiên để bảo vệ dữ liệu của bạn</div>
					</div>
				) : (
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
								<th className="py-3 px-4 font-medium">Mã Backup</th>
								<th className="py-3 px-4 font-medium">Ngày tạo</th>
								<th className="py-3 px-4 font-medium">Dung lượng</th>
								<th className="py-3 px-4 font-medium">Số bảng</th>
								<th className="py-3 px-4 font-medium">Trạng thái</th>
								<th className="py-3 px-4 font-medium">Mô tả</th>
								<th className="py-3 px-4 text-center font-medium">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{displayedBackups.map((backup, index) => (
								<tr key={backup.MaBackup || `backup-${index}`} className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition cursor-pointer">
									<td className="py-3 px-4 font-medium text-gray-700">{backup.MaBackup}</td>
									<td className="py-3 px-4 text-gray-600">
										<div className="flex items-center gap-2">
											<Calendar className="w-4 h-4 text-gray-400" />
											{formatVietnamTime(backup.NgayBackup)}
										</div>
									</td>
									<td className="py-3 px-4 text-gray-600">
										<div className="flex items-center gap-2">
											<HardDrive className="w-4 h-4 text-gray-400" />
											{formatFileSize(backup.DungLuong || 0)}
										</div>
									</td>
									<td className="py-3 px-4 text-gray-600">{backup.SoLuongBang || 0} bảng</td>
									<td className="py-3 px-4">
										<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${getStatusBadge(backup.TrangThai)}`}>
											{getStatusIcon(backup.TrangThai)}
											{backup.TrangThai}
										</span>
									</td>
									<td className="py-3 px-4 text-gray-600 text-sm max-w-xs truncate">{backup.MoTa || '-'}</td>
									<td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
										<div className="flex items-center justify-center gap-2">
											<button
												onClick={() => handleDownload(backup)}
												className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center gap-1"
												title="Tải về"
											>
												<Download className="w-3.5 h-3.5" />
												Tải
											</button>
											{(backup.TrangThai === 'Hoàn thành' || backup.TrangThai === 'Hoàn thành (không upload)') && (
												<button
													onClick={() => {
														setSelectedBackup(backup);
														setOpenRestoreModal(true);
													}}
													className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center gap-1"
													title="Restore"
												>
													<RotateCcw className="w-3.5 h-3.5" />
													Restore
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				{total > limit && (
					<div className="p-4 border-t border-[#f5ebe0] bg-[#f9f5f1]">
						<Pagination page={page} limit={limit} total={total} onChange={setPage} />
					</div>
				)}
			</div>

			{/* Create Backup Modal */}
			<Modal open={openCreateModal} onClose={() => setOpenCreateModal(false)} title="Tạo Backup mới">
				<div className="space-y-4">
					<div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 p-4 rounded-xl">
						<div className="flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
							<div className="text-sm text-yellow-800">
								<p className="font-semibold mb-2">Lưu ý quan trọng:</p>
								<ul className="list-disc list-inside space-y-1.5 text-xs">
									<li>Backup sẽ lưu tất cả dữ liệu hiện tại từ 13 bảng quan trọng</li>
									<li>File backup sẽ được lưu trong Supabase Storage</li>
									<li>Quá trình backup có thể mất vài phút tùy vào lượng dữ liệu</li>
									<li>Mã backup sẽ được tạo tự động theo định dạng: BK20250101120000</li>
								</ul>
							</div>
						</div>
					</div>
					<div>
						<label className="block text-sm mb-2 text-gray-600 font-medium">Mô tả (tùy chọn)</label>
						<textarea
							className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400 resize-none"
							placeholder="Ví dụ: Backup trước khi cập nhật lớn, Backup hàng ngày..."
							value={mota}
							onChange={(e) => setMota(e.target.value)}
							rows={3}
						/>
						<p className="text-xs text-gray-500 mt-1">Để trống sẽ tự động gán "Backup tự động"</p>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<button
							onClick={() => {
								setOpenCreateModal(false);
								setMota('');
							}}
							className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-700 font-medium"
						>
							Hủy
						</button>
						<button
							onClick={handleCreateBackup}
							disabled={creating}
							className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{creating ? (
								<>
									<RefreshCw className="w-4 h-4 animate-spin" />
									Đang tạo...
								</>
							) : (
								<>
									<Upload className="w-4 h-4" />
									Tạo Backup
								</>
							)}
						</button>
					</div>
				</div>
			</Modal>

			{/* Restore Modal */}
			<Modal open={openRestoreModal} onClose={() => setOpenRestoreModal(false)} title="Restore từ Backup">
				{selectedBackup && (
					<div className="space-y-4">
						<div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 p-4 rounded-xl">
							<div className="flex items-start gap-3">
								<AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
								<div className="text-sm text-red-800">
									<p className="font-bold mb-2 text-base">⚠️ CẢNH BÁO NGHIÊM TRỌNG:</p>
									<ul className="list-disc list-inside space-y-1.5 text-xs">
										<li>Dữ liệu hiện tại sẽ bị <strong>THAY THẾ HOÀN TOÀN</strong> bởi dữ liệu từ backup</li>
										<li>Hành động này <strong>KHÔNG THỂ HOÀN TÁC</strong></li>
										<li>Hãy chắc chắn bạn đã backup dữ liệu hiện tại trước khi restore</li>
										<li>Tất cả các bảng sẽ được xóa và thay thế bằng dữ liệu từ backup</li>
									</ul>
								</div>
							</div>
						</div>
						<div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 space-y-3">
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-sm font-medium text-gray-600">Mã Backup:</span>
								<span className="font-bold text-gray-800 text-base">{selectedBackup.MaBackup}</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-sm font-medium text-gray-600">Ngày tạo:</span>
								<span className="text-gray-700">{formatVietnamTime(selectedBackup.NgayBackup)}</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-sm font-medium text-gray-600">Dung lượng:</span>
								<span className="text-gray-700 font-medium">{formatFileSize(selectedBackup.DungLuong || 0)}</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-gray-200">
								<span className="text-sm font-medium text-gray-600">Số bảng:</span>
								<span className="text-gray-700 font-medium">{selectedBackup.SoLuongBang || 0} bảng</span>
							</div>
							{selectedBackup.MoTa && (
								<div className="flex justify-between items-start py-2">
									<span className="text-sm font-medium text-gray-600">Mô tả:</span>
									<span className="text-sm text-gray-700 text-right max-w-xs">{selectedBackup.MoTa}</span>
								</div>
							)}
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<button
								onClick={() => {
									setOpenRestoreModal(false);
									setSelectedBackup(null);
								}}
								className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-700 font-medium"
							>
								Hủy
							</button>
							<button
								onClick={() => handleRestore(selectedBackup)}
								disabled={restoring}
								className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{restoring ? (
									<>
										<RefreshCw className="w-4 h-4 animate-spin" />
										Đang restore...
									</>
								) : (
									<>
										<RotateCcw className="w-4 h-4" />
										Xác nhận Restore
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}

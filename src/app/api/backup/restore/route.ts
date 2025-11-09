import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

// POST: Restore từ backup
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { maBackup } = await req.json();
		if (!maBackup) {
			return NextResponse.json({ error: 'Thiếu mã backup' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		// Lấy thông tin backup
		const { data: backupInfo, error: infoError } = await supabase
			.from('backuplog')
			.select('*')
			.eq('mabackup', maBackup)
			.single();

		if (infoError || !backupInfo) {
			return NextResponse.json({ error: 'Không tìm thấy backup' }, { status: 404 });
		}

		// Download file backup từ storage hoặc database
		let backup: any = null;
		
		// Thử download từ storage trước
		const filePath = backupInfo.duongdan || `backups/${maBackup}.json`;
		const { data: fileData, error: downloadError } = await supabase.storage
			.from('backups')
			.download(filePath);

		if (!downloadError && fileData) {
			// Parse JSON backup từ storage
			const text = await fileData.text();
			backup = JSON.parse(text);
		} else {
			// Nếu không có trong storage, thử lấy từ database (cột DuLieuBackup)
			// Kiểm tra xem cột có tồn tại và có dữ liệu không
			if (backupInfo.dulieubackup && typeof backupInfo.dulieubackup === 'string') {
				try {
					// Parse JSON backup từ database
					backup = JSON.parse(backupInfo.dulieubackup);
				} catch (parseError) {
					return NextResponse.json({ 
						error: 'Dữ liệu backup trong database không hợp lệ.' 
					}, { status: 400 });
				}
			} else {
				// Nếu không có trong cả storage và database
				return NextResponse.json({ 
					error: 'Không thể tải file backup. Vui lòng:\n1. Kiểm tra Supabase Storage bucket "backups" đã được tạo chưa\n2. Hoặc chạy SQL migration để thêm cột DuLieuBackup vào bảng BackupLog' 
				}, { status: 404 });
			}
		}

		if (!backup.tables || typeof backup.tables !== 'object') {
			return NextResponse.json({ error: 'File backup không hợp lệ' }, { status: 400 });
		}

		// Restore từng bảng (XÓA DỮ LIỆU CŨ VÀ INSERT DỮ LIỆU MỚI)
		const restoredTables: string[] = [];
		const errors: Array<{ table: string; error: string }> = [];

		for (const [tableName, tableData] of Object.entries(backup.tables)) {
			if (!Array.isArray(tableData)) continue;

			try {
				const table = tableName.toLowerCase();

				// Xóa dữ liệu cũ (nếu có)
				// Lưu ý: Cần cẩn thận với foreign key constraints
				// Chỉ xóa nếu không có ràng buộc
				try {
					await supabase.from(table).delete().neq('1', '0'); // Xóa tất cả
				} catch (deleteErr) {
					// Nếu không xóa được, bỏ qua
					console.warn(`Cannot delete from ${table}:`, deleteErr);
				}

				// Insert dữ liệu mới
				if (tableData.length > 0) {
					const { error: insertError } = await supabase.from(table).insert(tableData);

					if (insertError) {
						errors.push({ table: tableName, error: insertError.message });
					} else {
						restoredTables.push(tableName);
					}
				}
			} catch (err: any) {
				errors.push({ table: tableName, error: err.message });
			}
		}

		// Ghi log
		await logActivity({
			action: 'SUA',
			table: 'backuplog',
			recordId: maBackup,
			status: errors.length > 0 ? 'LOI' : 'THANH_CONG',
			chiTiet: JSON.stringify({ restoredTables, errors }),
		});

		return NextResponse.json({
			ok: true,
			data: {
				maBackup,
				restoredTables,
				errors: errors.length > 0 ? errors : undefined,
				message: `Đã restore ${restoredTables.length} bảng${errors.length > 0 ? `, ${errors.length} lỗi` : ''}`,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Lỗi khi restore backup' }, { status: 500 });
	}
}


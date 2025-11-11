import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { createS3Client, DEFAULT_BACKUP_BUCKET } from '@/lib/s3Client';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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

		// Tải file backup trực tiếp từ S3
		let backup: any = null;
		const s3 = createS3Client();
		const key = `backups/${maBackup}.json`;
		const resp = await s3.send(new GetObjectCommand({
			Bucket: DEFAULT_BACKUP_BUCKET,
			Key: key,
		}));
		const text = await resp.Body?.transformToString?.();
		if (!text) {
			return NextResponse.json({ error: 'Không tìm thấy file backup trên S3' }, { status: 404 });
		}
		backup = JSON.parse(text);

		if (!backup.tables || typeof backup.tables !== 'object') {
			return NextResponse.json({ error: 'File backup không hợp lệ' }, { status: 400 });
		}

		// Restore từng bảng (XÓA DỮ LIỆU CŨ VÀ INSERT DỮ LIỆU MỚI)
		const restoredTables: string[] = [];
		const errors: Array<{ table: string; error: string }> = [];

		for (const [tableName, tableData] of Object.entries(backup.tables)) {
			if (!Array.isArray(tableData)) continue;

			try {
				const table = (tableName as string).toLowerCase();

				// Xóa dữ liệu cũ (nếu có)
				try {
					await supabase.from(table).delete().neq('1', '0');
				} catch (deleteErr) {
					// Nếu không xóa được, bỏ qua
					console.warn(`Cannot delete from ${table}:`, deleteErr);
				}

				// Insert dữ liệu mới
				if ((tableData as any[]).length > 0) {
					const { error: insertError } = await supabase.from(table).insert(tableData as any[]);

					if (insertError) {
						errors.push({ table: tableName as string, error: insertError.message });
					} else {
						restoredTables.push(tableName as string);
					}
				}
			} catch (err: any) {
				errors.push({ table: tableName as string, error: err.message });
			}
		}

		// Ghi log
		await logActivity({
			action: 'SUA',
			recordId: maBackup,
			status: errors.length > 0 ? 'LOI' : 'THANH_CONG',
			detail: JSON.stringify({ restoredTables, errors }),
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


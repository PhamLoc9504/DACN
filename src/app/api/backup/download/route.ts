import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET: Download file backup
export async function GET(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { searchParams } = new URL(req.url);
		const file = searchParams.get('file');
		const maBackup = searchParams.get('mabackup');

		if (!file && !maBackup) {
			return NextResponse.json({ error: 'Thiếu tham số file hoặc mabackup' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		let filePath = file || '';
		if (maBackup) {
			// Lấy đường dẫn từ database
			const { data: backupInfo } = await supabase
				.from('backuplog')
				.select('duongdan')
				.eq('mabackup', maBackup)
				.single();

			if (backupInfo?.duongdan) {
				filePath = backupInfo.duongdan;
			} else {
				filePath = `backups/${maBackup}.json`;
			}
		}

		const { data: fileData, error } = await supabase.storage
			.from('backups')
			.download(filePath);

		if (error || !fileData) {
			return NextResponse.json({ error: 'Không tìm thấy file backup' }, { status: 404 });
		}

		// Trả về file JSON
		const text = await fileData.text();
		return new NextResponse(text, {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Lỗi khi tải file backup' }, { status: 500 });
	}
}


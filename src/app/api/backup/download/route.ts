import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/session';
import { createS3Client, DEFAULT_BACKUP_BUCKET } from '@/lib/s3Client';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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

		const s3 = createS3Client();
		const key = file || `backups/${maBackup}.json`;
		const resp = await s3.send(new GetObjectCommand({
			Bucket: DEFAULT_BACKUP_BUCKET,
			Key: key,
		}));

		// Body là Readable stream
		const body = await resp.Body?.transformToString?.();
		if (!body) {
			return NextResponse.json({ error: 'Không tìm thấy file backup' }, { status: 404 });
		}

		return new NextResponse(body, {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Lỗi khi tải file backup' }, { status: 500 });
	}
}


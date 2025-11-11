import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { createS3Client, DEFAULT_BACKUP_BUCKET } from '@/lib/s3Client';
import { ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

// Chuyển đổi dữ liệu từ snake_case sang camelCase
function toCamel(row: any) {
	return {
		MaBackup: row.mabackup,
		NgayBackup: row.ngaybackup,
		DungLuong: row.dungluong,
		TrangThai: row.trangthai,
		DuongDan: row.duongdan,
		MoTa: row.mota,
		SoLuongBang: row.soluongbang,
		NguoiTao: row.nguoitao,
		DuLieuBackup: row.dulieubackup,
	};
}

// Danh sách các bảng cần backup
const BACKUP_TABLES = [
	'HangHoa',
	'PhieuNhap',
	'CTPHieuNhap',
	'PhieuXuat',
	'CTPHieuXuat',
	'HoaDon',
	'CT_HoaDon',
	'KhachHang',
	'NhaCC',
	'NhanVien',
	'LoaiHang',
	'Dovi_VanChuyen',
	'TaiKhoan',
] as const;

// GET: Liệt kê tất cả backups
export async function GET(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { searchParams } = new URL(req.url);
		const limit = parseInt(searchParams.get('limit') || '30', 10);

		// Liệt kê từ S3 theo prefix backups/
		const s3 = createS3Client();
		const list = await s3.send(new ListObjectsV2Command({
			Bucket: DEFAULT_BACKUP_BUCKET,
			Prefix: 'backups/',
			MaxKeys: Math.max(1, Math.min(1000, limit)),
		}));

		const contents = list.Contents || [];
		// Sắp xếp mới nhất trước
		contents.sort((a, b) => {
			const at = a.LastModified?.getTime?.() || 0;
			const bt = b.LastModified?.getTime?.() || 0;
			return bt - at;
		});

		const data = contents.map((obj) => {
			const key = obj.Key || '';
			const file = key.split('/').pop() || '';
			const ma = file.replace('.json', '');
			return {
				MaBackup: ma,
				NgayBackup: obj.LastModified?.toISOString?.() || null,
				DungLuong: Number(obj.Size || 0),
				TrangThai: 'Hoàn thành',
				DuongDan: key,
				MoTa: 'Backup trên S3',
				SoLuongBang: null,
				NguoiTao: null,
				DuLieuBackup: null,
			};
		});

		return NextResponse.json({ ok: true, data });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Lỗi khi lấy danh sách backup' }, { status: 500 });
	}
}

// POST: Tạo backup mới
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const supabase = getServerSupabase();
		const { moTa } = await req.json().catch(() => ({}));

		// Tạo mã backup
		const now = new Date();
		const maBackup = `BK${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

		// Backup từng bảng
		const backupData: Record<string, any[]> = {};
		let totalSize = 0;
		let soLuongBang = 0;

		for (const table of BACKUP_TABLES) {
			try {
				const { data, error } = await supabase.from(table.toLowerCase()).select('*');

				if (data) {
					backupData[table] = data;
					const tableSize = JSON.stringify(data).length;
					totalSize += tableSize;
					soLuongBang++;
				}
			} catch (err: any) {
				console.error(`Error backing up table ${table}:`, err.message);
				// Tiếp tục với các bảng khác
			}
		}

		// Tạo JSON backup
		const backupJson = JSON.stringify({
			version: '1.0',
			createdAt: now.toISOString(),
			createdBy: session.maTk,
			tables: backupData,
		}, null, 2);

		const backupSize = Buffer.from(backupJson, 'utf-8').length;

		// Upload trực tiếp tới Supabase S3 Gateway (không ghi database)
		const s3 = createS3Client();
		const fileName = `${maBackup}.json`;
		const objectKey = `backups/${fileName}`;

		await s3.send(new PutObjectCommand({
			Bucket: DEFAULT_BACKUP_BUCKET,
			Key: objectKey,
			Body: Buffer.from(backupJson, 'utf-8'),
			ContentType: 'application/json',
		}));

		// Ghi audit log ứng dụng (không liên quan bảng backup)
		await logActivity({
			action: 'TAO',
			recordId: maBackup,
			status: 'THANH_CONG',
		});

		return NextResponse.json({
			ok: true,
			data: {
				MaBackup: maBackup,
				NgayBackup: now.toISOString(),
				DungLuong: backupSize,
				TrangThai: 'Hoàn thành',
				DuongDan: objectKey,
				MoTa: moTa || 'Backup tự động',
				SoLuongBang: soLuongBang,
				NguoiTao: session.maTk,
				downloadUrl: null,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Lỗi khi tạo backup' }, { status: 500 });
	}
}


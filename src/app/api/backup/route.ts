import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';

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

		const supabase = getServerSupabase();
		const { searchParams } = new URL(req.url);
		const limit = parseInt(searchParams.get('limit') || '30', 10);

		const { data, error } = await supabase
			.from('backuplog')
			.select('*')
			.order('ngaybackup', { ascending: false })
			.limit(limit);

		if (error) throw error;

		// Chuyển đổi dữ liệu sang camelCase
		const mappedData = (data || []).map(toCamel);

		return NextResponse.json({ ok: true, data: mappedData });
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

		// Upload lên Supabase Storage (nếu bucket tồn tại)
		const fileName = `${maBackup}.json`;
		const filePath = `backups/${fileName}`;
		let uploadData = null;
		let uploadError = null;

		try {
			const uploadResult = await supabase.storage
				.from('backups')
				.upload(filePath, backupJson, {
					contentType: 'application/json',
					upsert: false,
				});
			
			uploadData = uploadResult.data;
			uploadError = uploadResult.error;
		} catch (err: any) {
			console.error('Storage upload error:', err);
			uploadError = err;
		}

		// Nếu upload thất bại, lưu dữ liệu JSON trực tiếp vào database
		if (uploadError) {
			console.warn('Không thể upload lên Storage, lưu dữ liệu vào database:', uploadError.message);
		}

		// Lưu thông tin backup vào database
		// Nếu upload thành công: lưu đường dẫn file
		// Nếu upload thất bại: lưu dữ liệu JSON vào cột DuLieuBackup (nếu cột tồn tại)
		const insertData: any = {
			mabackup: maBackup,
			ngaybackup: now.toISOString(),
			dungluong: backupSize,
			trangthai: uploadError ? 'Hoàn thành (không upload)' : 'Hoàn thành',
			duongdan: uploadData?.path || filePath,
			mota: moTa || 'Backup tự động',
			soluongbang: soLuongBang,
			nguoitao: session.maTk,
		};

		// Chỉ thêm dulieubackup nếu upload thất bại (cột có thể chưa tồn tại)
		if (uploadError) {
			// Thử thêm dulieubackup, nếu cột chưa tồn tại sẽ bị lỗi nhưng vẫn lưu được các trường khác
			insertData.dulieubackup = backupJson;
		}

		const { data: backupLog, error: logError } = await supabase
			.from('backuplog')
			.insert(insertData)
			.select()
			.single();

		// Nếu lỗi do cột dulieubackup chưa tồn tại, thử lại không có cột đó
		if (logError && logError.message?.includes('dulieubackup')) {
			console.warn('Cột DuLieuBackup chưa tồn tại, lưu backup không có dữ liệu JSON');
			delete insertData.dulieubackup;
			const { data: retryData, error: retryError } = await supabase
				.from('backuplog')
				.insert(insertData)
				.select()
				.single();
			
			if (retryError) throw retryError;
			
			// Chuyển đổi dữ liệu sang camelCase
			const mappedRetryData = toCamel(retryData);
			
			return NextResponse.json({
				ok: true,
				data: {
					...mappedRetryData,
					downloadUrl: null,
					warning: 'Cột DuLieuBackup chưa tồn tại. Vui lòng chạy SQL migration để thêm cột này.',
				},
			});
		}

		if (logError) throw logError;

		// Ghi log
		await logActivity({
			action: 'TAO',
			table: 'backuplog',
			recordId: maBackup,
			status: 'THANH_CONG',
		});

		// Chuyển đổi dữ liệu sang camelCase
		const mappedBackupLog = toCamel(backupLog);

		return NextResponse.json({
			ok: true,
			data: {
				...mappedBackupLog,
				downloadUrl: uploadData?.path ? `/api/backup/download?file=${encodeURIComponent(filePath)}` : null,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Lỗi khi tạo backup' }, { status: 500 });
	}
}


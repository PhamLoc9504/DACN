import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET: Export toàn bộ database dưới dạng JSON
export async function GET(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const supabase = getServerSupabase();

		const tables = [
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
		];

		const exportData: Record<string, any[]> = {};

		for (const table of tables) {
			try {
				const { data, error } = await supabase.from(table.toLowerCase()).select('*');
				if (!error && data) {
					exportData[table] = data;
				}
			} catch (err) {
				// Bỏ qua lỗi
			}
		}

		const json = JSON.stringify(
			{
				version: '1.0',
				exportedAt: new Date().toISOString(),
				exportedBy: session.maTk,
				tables: exportData,
			},
			null,
			2
		);

		return new NextResponse(json, {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="database_export_${new Date().toISOString().split('T')[0]}.json"`,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Lỗi khi export database' }, { status: 500 });
	}
}


import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { createHash } from 'crypto';
import { logCRUD } from '@/lib/auditLog';

function toCamel(row: any) {
	return {
		MaTK: row.matk,
		TenDangNhap: row.tendangnhap,
		MaNV: row.manv,
		VaiTro: row.vaitro,
		TrangThai: row.trangthai,
		NgayTao: row.ngaytao,
		LanDangNhapCuoi: row.landangnhapcuoi,
	};
}

// GET: Lấy danh sách tài khoản (chỉ Admin và Quản lý)
export async function GET(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		
		// Chỉ Admin và Quản lý mới được xem danh sách tài khoản
		if (session.vaiTro !== 'Admin' && session.vaiTro !== 'Quản lý') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1', 10);
		const limit = parseInt(searchParams.get('limit') || '10', 10);
		const q = searchParams.get('q')?.trim();
		const vaitro = searchParams.get('vaitro')?.trim();
		const trangthai = searchParams.get('trangthai')?.trim();

		const from = (page - 1) * limit;
		const to = from + limit - 1;
		const supabase = getServerSupabase();

		let query = supabase
			.from('taikhoan')
			.select('*', { count: 'exact' })
			.order('ngaytao', { ascending: false });

		if (q) {
			query = query.or(`tendangnhap.ilike.%${q}%,matk.ilike.%${q}%`);
		}
		if (vaitro) {
			query = query.eq('vaitro', vaitro);
		}
		if (trangthai) {
			query = query.eq('trangthai', trangthai);
		}

		const { data, error, count } = await query.range(from, to);
		if (error) throw error;

		return NextResponse.json({
			data: (data || []).map(toCamel),
			total: count || 0,
			page,
			limit,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// POST: Tạo tài khoản mới (chỉ Admin)
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		
		// Chỉ Admin mới được tạo tài khoản
		if (session.vaiTro !== 'Admin') {
			return NextResponse.json({ error: 'Forbidden - Chỉ Admin mới được tạo tài khoản' }, { status: 403 });
		}

		const body = await req.json();
		const { tendangnhap, matkhau, manv, vaitro } = body;

		if (!tendangnhap || !matkhau) {
			return NextResponse.json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		// Kiểm tra tên đăng nhập đã tồn tại
		const exist = await supabase
			.from('taikhoan')
			.select('matk')
			.eq('tendangnhap', tendangnhap)
			.maybeSingle();
		
		if (exist.data) {
			return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 });
		}

		// Nếu có MaNV, kiểm tra nhân viên tồn tại và chưa có tài khoản
		if (manv) {
			const emp = await supabase
				.from('nhanvien')
				.select('manv')
				.eq('manv', manv)
				.maybeSingle();
			
			if (!emp.data) {
				return NextResponse.json({ error: 'Mã nhân viên không tồn tại' }, { status: 400 });
			}

			const used = await supabase
				.from('taikhoan')
				.select('matk')
				.eq('manv', manv)
				.maybeSingle();
			
			if (used.data) {
				return NextResponse.json({ error: 'Nhân viên này đã có tài khoản' }, { status: 409 });
			}
		}

		// Hash mật khẩu
		const hash = createHash('sha256').update(matkhau).digest('hex');

		// Tạo mã tài khoản
		const matk = 'TK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

		const { data, error } = await supabase
			.from('taikhoan')
			.insert([
				{
					matk,
					tendangnhap: tendangnhap,
					matkhau: hash,
					manv: manv || null,
					vaitro: vaitro || 'Nhân viên kho',
					trangthai: 'Hoạt động',
				},
			])
			.select()
			.single();

		if (error) throw error;

		// Ghi log
		await logCRUD('TAO', 'taikhoan', matk, null, data);

		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


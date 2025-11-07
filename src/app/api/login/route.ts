import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { encodeSession } from '@/lib/session';
import { createHash } from 'crypto';
import { logAuth } from '@/lib/auditLog';

export async function POST(req: Request) {
	try {
		const { username, password } = await req.json();
		if (!username || !password) {
			return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
		}
		const supabase = getServerSupabase();
		const { data, error } = await supabase
			.from('taikhoan')
			.select('matk, tendangnhap, vaitro, trangthai, matkhau')
			.eq('tendangnhap', username)
			.eq('trangthai', 'Hoạt động')
			.limit(1)
			.maybeSingle();
		if (error) throw error;
		if (!data) {
			await logAuth('DANG_NHAP', false, username, 'Tài khoản không tồn tại hoặc bị khóa');
			return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 });
		}
		const incomingHash = createHash('sha256').update(password).digest('hex');
		const ok = data.matkhau === password || data.matkhau === incomingHash;
		if (!ok) {
			await logAuth('DANG_NHAP', false, username, 'Sai mật khẩu');
			return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 });
		}
		const payload = { maTk: data.matk, vaiTro: data.vaitro, tenDangNhap: data.tendangnhap };
		const res = NextResponse.json(payload);
		res.headers.set('Set-Cookie', `app_session=${encodeSession(payload)}; Path=/; Max-Age=604800`);
		await logAuth('DANG_NHAP', true, username);
		return res;
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}



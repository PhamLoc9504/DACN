import { NextResponse } from 'next/server';
import { supabase, getServerSupabase } from '@/lib/supabaseClient';
import { encodeSession } from '@/lib/session';
import { logAuth } from '@/lib/auditLog';

export async function POST(req: Request) {
	try {
		const { username, password } = await req.json();
		if (!username || !password) {
			return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
		}
		const email = String(username).toLowerCase().trim();

		// 1) Đăng nhập bằng Supabase Auth (email/password)
		const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (signInError) {
			let message = signInError.message || 'Đăng nhập thất bại';
			if (message.includes('Invalid login credentials')) {
				message = 'Sai email hoặc mật khẩu';
			} else if (message.toLowerCase().includes('email not confirmed')) {
				message = 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn.';
			}
			await logAuth('DANG_NHAP', false, email, message);
			return NextResponse.json({ error: message }, { status: 401 });
		}

		// 2) Tìm tài khoản nội bộ tương ứng để lấy vai trò, MaTK
		const serverSupabase = getServerSupabase();
		const { data, error } = await serverSupabase
			.from('taikhoan')
			.select('matk, tendangnhap, vaitro, trangthai')
			.eq('tendangnhap', email)
			.eq('trangthai', 'Hoạt động')
			.limit(1)
			.maybeSingle();
		if (error) throw error;
		if (!data) {
			const msg = 'Tài khoản chưa được cấu hình hoặc đã bị khóa trong hệ thống';
			await logAuth('DANG_NHAP', false, email, msg);
			return NextResponse.json({ error: msg }, { status: 403 });
		}

		// 3) Set cookie session như cũ để các API hiện tại dùng
		const payload = { maTk: data.matk, vaiTro: data.vaitro, tenDangNhap: data.tendangnhap };
		const res = NextResponse.json(payload);
		res.headers.set('Set-Cookie', `app_session=${encodeSession(payload)}; Path=/; Max-Age=604800`);
		await logAuth('DANG_NHAP', true, email);
		return res;
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


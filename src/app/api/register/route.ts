import { NextResponse } from 'next/server';
import { supabase, getServerSupabase } from '@/lib/supabaseClient';
import { createHash, randomUUID } from 'crypto';

export async function POST(req: Request) {
	try {
		const { email, password, fullName } = await req.json();
		if (!email || !password) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
		const username = String(email).toLowerCase().trim();

		// 1) Đăng ký user trên Supabase Auth (Supabase tự gửi email xác thực)
		const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
			? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
			: undefined;
		const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
			email: username,
			password,
			options: {
				emailRedirectTo: redirectUrl,
			},
		});
		if (signUpError) {
			return NextResponse.json({ error: signUpError.message || 'Đăng ký Supabase Auth thất bại' }, { status: 400 });
		}

		// 2) Tạo nhân viên + tài khoản nội bộ để giữ mapping và vai trò
		const serverSupabase = getServerSupabase();

		// Kiểm tra email đã có trong TaiKhoan chưa
		const exist = await serverSupabase
			.from('taikhoan')
			.select('matk')
			.eq('tendangnhap', username)
			.maybeSingle();
		if (exist.data) return NextResponse.json({ error: 'Email này đã có tài khoản' }, { status: 409 });

		// Tự tạo mã nhân viên NVxx
		const last = await serverSupabase
			.from('nhanvien')
			.select('manv')
			.like('manv', 'NV%')
			.order('manv', { ascending: false })
			.limit(1)
			.maybeSingle();
		let nextNumber = 1;
		if (last.data?.manv) {
			const num = parseInt(String(last.data.manv).replace(/^NV/i, ''), 10);
			if (!isNaN(num) && num >= 1) nextNumber = num + 1;
		}
		const maNv = 'NV' + String(nextNumber).padStart(2, '0');

		// Tạo nhân viên
		const { error: empErr } = await serverSupabase.from('nhanvien').insert([
			{
				manv: maNv,
				hoten: fullName || username,
				chucvu: 'Nhân viên kho',
			},
		]);
		if (empErr) throw empErr;

		// Tạo tài khoản nội bộ (vẫn hash mật khẩu để nếu sau này cần dùng)
		const hash = createHash('sha256').update(password).digest('hex');
		const maTk = 'TK' + randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
		const { error } = await serverSupabase.from('taikhoan').insert([
			{
				matk: maTk,
				tendangnhap: username,
				matkhau: hash,
				vaitro: 'Nhân viên kho',
				trangthai: 'Hoạt động',
				manv: maNv,
			},
		]);
		if (error) throw error;

		return NextResponse.json({ ok: true, maTk, maNv, userId: signUpData.user?.id });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

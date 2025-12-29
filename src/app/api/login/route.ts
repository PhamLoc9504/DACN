import { NextResponse } from 'next/server';
import { supabase, getServerSupabase } from '@/lib/supabaseClient';
import { encodeSession } from '@/lib/session';
import { logAuth } from '@/lib/auditLog';

// Cấu hình bảo mật đăng nhập
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 5;

export async function POST(req: Request) {
	try {
		const { username, password } = await req.json();
		if (!username || !password) {
			return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
		}
		const email = String(username).toLowerCase().trim();

		const serverSupabase = getServerSupabase();

		// Lấy IP từ header (khi chạy local thường sẽ là ::1)
		const ip =
			req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			req.headers.get('x-real-ip') ||
			'unknown';

		// 0) Kiểm tra IP + username có đang bị khóa không (dùng bảng login_security)
		if (ip !== 'unknown') {
			const { data: sec } = await serverSupabase
				.from('login_security')
				.select('failed_attempts, lock_until')
				.eq('ip_address', ip)
				.eq('username', email)
				.maybeSingle();

			if (sec?.lock_until) {
				const lockedUntil = new Date(sec.lock_until as string);
				const now = new Date();
				if (lockedUntil > now) {
					const remainingMs = lockedUntil.getTime() - now.getTime();
					const remainingMinutes = Math.ceil(remainingMs / 60000);
					const message =
						`Bạn đã nhập sai mật khẩu quá ${MAX_FAILED_ATTEMPTS} lần. ` +
						`IP này tạm thời bị khóa trong ${LOCK_DURATION_MINUTES} phút. ` +
						`Vui lòng thử lại sau (còn khoảng ${remainingMinutes} phút).`;

					await logAuth('DANG_NHAP', false, email, `IP bị khóa tạm thời qua login_security: ${ip}`);
					return NextResponse.json({ error: message, locked: true }, { status: 429 });
				}
			}
		}

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

			// Cập nhật số lần đăng nhập sai theo IP + username trong login_security
			if (ip !== 'unknown') {
				const now = new Date();
				const lockUntil = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000);

				const { data: existing } = await serverSupabase
					.from('login_security')
					.select('failed_attempts')
					.eq('ip_address', ip)
					.eq('username', email)
					.maybeSingle();

				const currentFailed = existing?.failed_attempts || 0;
				const nextFailed = currentFailed + 1;
				const shouldLock = nextFailed >= MAX_FAILED_ATTEMPTS;

				if (existing) {
					await serverSupabase
						.from('login_security')
						.update({
							failed_attempts: nextFailed,
							last_attempt_at: now.toISOString(),
							lock_until: shouldLock ? lockUntil.toISOString() : null,
						})
						.eq('ip_address', ip)
						.eq('username', email);
				} else {
					await serverSupabase.from('login_security').insert({
						ip_address: ip,
						username: email,
						failed_attempts: 1,
						last_attempt_at: now.toISOString(),
						lock_until: shouldLock ? lockUntil.toISOString() : null,
					});
				}

				if (shouldLock) {
					message =
						`Bạn đã nhập sai mật khẩu quá ${MAX_FAILED_ATTEMPTS} lần. ` +
						`IP này tạm thời bị khóa trong ${LOCK_DURATION_MINUTES} phút.`;
				}
			}

			await logAuth('DANG_NHAP', false, email, message);
			return NextResponse.json({ error: message }, { status: 401 });
		}

		// 2) Tìm tài khoản nội bộ tương ứng để lấy vai trò, MaTK
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

		// 2b) Đăng nhập thành công: reset đếm sai nếu có
		if (ip !== 'unknown') {
			await serverSupabase
				.from('login_security')
				.upsert(
					{
						ip_address: ip,
						username: email,
						failed_attempts: 0,
						last_attempt_at: new Date().toISOString(),
						lock_until: null,
					},
					{ onConflict: 'ip_address,username' }
				);
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


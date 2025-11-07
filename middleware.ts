import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
	'/login',
	'/register',
	'/api/login',
	'/api/register',
	'/chinh-sach-bao-mat',
	'/dieu-khoan-su-dung',
	'/chinh-sach-cookie',
];

// Cấu hình giờ làm việc (có thể lấy từ env hoặc database)
const WORKING_HOURS = {
	start: parseInt(process.env.WORKING_HOURS_START || '8', 10), // 8:00
	end: parseInt(process.env.WORKING_HOURS_END || '17', 10), // 17:00
	enabled: process.env.WORKING_HOURS_ENABLED !== 'false', // Mặc định bật
};

// Vai trò được phép truy cập ngoài giờ làm việc
const BYPASS_ROLES = ['Admin', 'Quản lý'];

function decodeSession(value: string | undefined | null): { maTk?: string; vaiTro?: string; tenDangNhap?: string } | null {
	if (!value) return null;
	try {
		const json = Buffer.from(value, 'base64url').toString('utf8');
		return JSON.parse(json);
	} catch {
		return null;
	}
}

function isWithinWorkingHours(): boolean {
	if (!WORKING_HOURS.enabled) return true;
	
	const now = new Date();
	const hour = now.getHours();
	const dayOfWeek = now.getDay(); // 0 = Chủ nhật, 6 = Thứ bảy
	
	// Chỉ áp dụng từ thứ 2 đến thứ 6 (1-5)
	if (dayOfWeek === 0 || dayOfWeek === 6) {
		return false; // Cuối tuần không cho phép
	}
	
	return hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end;
}

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	
	// Cho phép các đường dẫn công khai
	if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
	
	// Cho phép static assets
	if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/assets')) {
		return NextResponse.next();
	}
	
	// Kiểm tra session
	const sessionCookie = req.cookies.get('app_session')?.value;
	if (!sessionCookie) {
		const url = req.nextUrl.clone();
		url.pathname = '/login';
		return NextResponse.redirect(url);
	}
	
	// Kiểm tra giờ làm việc
	const session = decodeSession(sessionCookie);
	if (session?.vaiTro && BYPASS_ROLES.includes(session.vaiTro)) {
		// Admin và Quản lý được phép truy cập mọi lúc
		return NextResponse.next();
	}
	
	// Kiểm tra nếu ngoài giờ làm việc
	if (!isWithinWorkingHours()) {
		const url = req.nextUrl.clone();
		url.pathname = '/login';
		url.searchParams.set('error', 'outside_working_hours');
		url.searchParams.set('message', `Hệ thống chỉ hoạt động từ ${WORKING_HOURS.start}:00 đến ${WORKING_HOURS.end}:00, từ thứ 2 đến thứ 6. Vui lòng liên hệ Admin để được hỗ trợ.`);
		return NextResponse.redirect(url);
	}
	
	return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};



import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
	'/login',
	'/register',
	'/api/login',
	'/api/register',
];

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
	// static assets
	if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/assets')) {
		return NextResponse.next();
	}
	const session = req.cookies.get('app_session')?.value;
	if (!session) {
		const url = req.nextUrl.clone();
		url.pathname = '/login';
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};



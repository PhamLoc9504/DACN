import { NextResponse } from 'next/server';
import { logAuth } from '@/lib/auditLog';

function redirectToLogin(req: Request) {
	const url = new URL('/login', req.url);
	const res = NextResponse.redirect(url);
	res.headers.set('Set-Cookie', 'app_session=; Path=/; Max-Age=0');
	return res;
}

export async function GET(req: Request) {
	await logAuth('DANG_XUAT', true);
	return redirectToLogin(req);
}

export async function POST(req: Request) {
	await logAuth('DANG_XUAT', true);
	return redirectToLogin(req);
}



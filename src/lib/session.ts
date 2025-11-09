import { cookies, headers } from 'next/headers';

export type AppSession = { maTk: string; vaiTro: string; tenDangNhap: string };

const COOKIE_NAME = 'app_session';

export function encodeSession(session: AppSession): string {
	return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
}

export function decodeSession(value: string | undefined | null): AppSession | null {
	if (!value) return null;
	try {
		const json = Buffer.from(value, 'base64url').toString('utf8');
		return JSON.parse(json);
	} catch {
		return null;
	}
}

export async function setSessionCookie(session: AppSession) {
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, encodeSession(session), { path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSessionCookie() {
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export async function getSessionFromCookies(): Promise<AppSession | null> {
    try {
        const store: any = await cookies();
        let val: string | undefined;
        if (store && typeof store.get === 'function') {
            val = store.get(COOKIE_NAME)?.value;
        } else if (store && typeof store.getAll === 'function') {
            const found = store.getAll().find((c: any) => c?.name === COOKIE_NAME);
            val = found?.value;
        }
        if (!val) {
            const hdrs: any = await headers();
            const cookieStr: string = hdrs?.get?.('cookie') || '';
            const match = cookieStr
                .split(';')
                .map((s) => s.trim())
                .find((s) => s.startsWith(COOKIE_NAME + '='));
            if (match) val = decodeURIComponent(match.split('=')[1]);
        }
        return decodeSession(val);
    } catch {
        return null;
    }
}



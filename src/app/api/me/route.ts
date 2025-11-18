import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/session';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function GET() {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = getServerSupabase();
    const { data } = await supabase
        .from('taikhoan')
        .select('manv')
        .eq('matk', session.maTk)
        .limit(1)
        .maybeSingle();
    const maNV = (data?.manv as string | null) || null;
    return NextResponse.json({ maTk: session.maTk, vaiTro: session.vaiTro, tenDangNhap: session.tenDangNhap, maNV });
}


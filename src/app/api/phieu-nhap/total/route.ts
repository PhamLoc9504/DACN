import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const so = searchParams.get('sopn');
        if (!so) return NextResponse.json({ error: 'Missing sopn' }, { status: 400 });
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ctphieunhap')
            .select('tongtien')
            .eq('sopn', so);
        if (error) throw error;
        const total = (data || []).reduce((s: number, r: any) => s + (r.tongtien || 0), 0);
        return NextResponse.json({ total });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}



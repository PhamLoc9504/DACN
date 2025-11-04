import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any) {
	return {
		MaNCC: row.mancc,
		TenNCC: row.tenncc,
		DiaChi: row.diachi,
		SDT: row.sdt,
	};
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const q = searchParams.get('q')?.trim().toLowerCase() || '';
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const supabase = getServerSupabase();
        let query = supabase.from('nhacc').select('*', { count: 'exact' }).order('mancc', { ascending: true });
        if (q) {
            query = query.or(`tenncc.ilike.%${q}%,sdt.ilike.%${q}%`);
        }
        const { data, error, count } = await query.range(from, to);
        if (error) throw error;
        return NextResponse.json({ data: (data || []).map(toCamel), total: count || 0, page, limit });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}



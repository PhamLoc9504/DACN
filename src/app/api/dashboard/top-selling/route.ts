import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ctphieuxuat')
            .select('mahh, slxuat, tongtien');
        if (error) throw error;
        const agg = new Map<string, { mahh: string; qty: number; revenue: number }>();
        for (const r of data || []) {
            const key = String((r as any).mahh);
            const item = agg.get(key) || { mahh: key, qty: 0, revenue: 0 };
            item.qty += (r as any).slxuat || 0;
            item.revenue += (r as any).tongtien || 0;
            agg.set(key, item);
        }
        const rows = Array.from(agg.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
        // fetch product names
        const ids = rows.map((r) => r.mahh);
        if (ids.length) {
            const { data: hh } = await supabase.from('hanghoa').select('mahh, tenhh').in('mahh', ids);
            const nameMap = new Map<string, string>((hh || []).map((h: any) => [String(h.mahh), String(h.tenhh)]));
            for (const r of rows) (r as any).tenhh = nameMap.get(r.mahh) || r.mahh;
        }
        return NextResponse.json({ data: rows });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}



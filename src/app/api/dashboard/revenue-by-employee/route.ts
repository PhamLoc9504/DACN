import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('hoadon')
            .select('manv, tongtien, trangthai, sopx');
        if (error) throw error;
        const agg = new Map<string, number>();
        for (const r of data || []) {
            if (!(r as any).sopx) continue; // chỉ tính hóa đơn xuất
            if ((r as any).trangthai !== 'Đã thanh toán') continue;
            const key = String((r as any).manv || '');
            if (!key) continue;
            agg.set(key, (agg.get(key) || 0) + ((r as any).tongtien || 0));
        }
        const rows = Array.from(agg.entries()).map(([manv, revenue]) => ({ manv, revenue }));
        // resolve names
        if (rows.length) {
            const { data: nv } = await supabase.from('nhanvien').select('manv, hoten').in('manv', rows.map(r => r.manv));
            const nameMap = new Map<string, string>((nv || []).map((n: any) => [String(n.manv), String(n.hoten)]));
            for (const r of rows) (r as any).ten = nameMap.get(r.manv) || r.manv;
        }
        rows.sort((a, b) => b.revenue - a.revenue);
        return NextResponse.json({ data: rows });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}



import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function extractRegion(address?: string | null): string {
    if (!address) return 'Khác';
    const cleaned = String(address).trim();
    if (!cleaned) return 'Khác';
    // Lấy từ cuối cùng (thường là tỉnh/thành) nếu có dấu phẩy
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1] || cleaned;
    // Chuẩn hóa viết hoa chữ cái đầu
    return last.charAt(0).toUpperCase() + last.slice(1);
}

export async function GET() {
    try {
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('khachhang')
            .select('diachi, makh');
        if (error) throw error;
        const agg = new Map<string, number>();
        for (const r of data || []) {
            const region = extractRegion((r as any).diachi);
            agg.set(region, (agg.get(region) || 0) + 1);
        }
        const rows = Array.from(agg.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
        return NextResponse.json({ data: rows });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}



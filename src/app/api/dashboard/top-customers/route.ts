import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('HoaDon')
      .select('MaKH, TongTien, KhachHang:MaKH ( TenKH )');

    if (error) throw error;

    type Row = {
      MaKH: string | null;
      TongTien: number | null;
      KhachHang?: { TenKH: string | null }[] | null;
    };

    const agg = new Map<string, { maKh: string; tenKh: string; totalRevenue: number; invoiceCount: number }>();

    for (const raw of (data || []) as any[]) {
      const r: Row = {
        MaKH: raw.MaKH ?? null,
        TongTien: raw.TongTien ?? null,
        KhachHang: Array.isArray(raw.KhachHang) ? raw.KhachHang : raw.KhachHang ? [raw.KhachHang] : null,
      };

      if (!r.MaKH) continue;
      const key = r.MaKH;
      const tenKh = r.KhachHang && r.KhachHang[0] ? r.KhachHang[0].TenKH : 'Không rõ tên';

      const existing =
        agg.get(key) || {
          maKh: key,
          tenKh: tenKh || 'Không rõ tên',
          totalRevenue: 0,
          invoiceCount: 0,
        };

      const amount = Number(r.TongTien ?? 0);
      existing.totalRevenue += Number.isFinite(amount) ? amount : 0;
      existing.invoiceCount += 1;
      agg.set(key, existing);
    }

    const list = Array.from(agg.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 20);

    return NextResponse.json({ data: list });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

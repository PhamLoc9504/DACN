import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

type HistoryRow = {
  time: string;
  type: 'Nhập hàng' | 'Xuất hàng';
  qty: number;
  actor?: string | null;
  ref?: string | null;
  ending?: number | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mahh = searchParams.get('mahh')?.trim();
    const limit = Number(searchParams.get('limit') || 50);
    const from = searchParams.get('from')?.trim();
    if (!mahh) {
      return NextResponse.json({ error: 'Thiếu mã hàng hóa (mahh)' }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 50 ? limit : 50;

    // Lấy lịch sử nhập
    let importQuery = supabase
      .from('ctphieunhap')
      .select('mahh, slnhap, phieunhap!inner(ngaynhap, manv, sopn)')
      .eq('mahh', mahh);
    if (from) {
      importQuery = importQuery.gte('phieunhap.ngaynhap', from);
    }
    const { data: importRows, error: importErr } = await importQuery;
    if (importErr) throw importErr;

    // Lấy lịch sử xuất
    let exportQuery = supabase
      .from('ctphieuxuat')
      .select('mahh, slxuat, phieuxuat!inner(ngayxuat, manv, sopx)')
      .eq('mahh', mahh);
    if (from) {
      exportQuery = exportQuery.gte('phieuxuat.ngayxuat', from);
    }
    const { data: exportRows, error: exportErr } = await exportQuery;
    if (exportErr) throw exportErr;

    const history: HistoryRow[] = [];

    for (const r of importRows || []) {
      const rec: any = r;
      history.push({
        time: rec.phieunhap?.ngaynhap || '',
        type: 'Nhập hàng',
        qty: Number(rec.slnhap || 0),
        actor: rec.phieunhap?.manv || null,
        ref: rec.phieunhap?.sopn || null,
      });
    }

    for (const r of exportRows || []) {
      const rec: any = r;
      history.push({
        time: rec.phieuxuat?.ngayxuat || '',
        type: 'Xuất hàng',
        qty: -Number(rec.slxuat || 0),
        actor: rec.phieuxuat?.manv || null,
        ref: rec.phieuxuat?.sopx || null,
      });
    }

    history.sort((a, b) => {
      const ta = new Date(a.time).getTime();
      const tb = new Date(b.time).getTime();
      return tb - ta;
    });

    const limited = history.slice(0, safeLimit);
    return NextResponse.json({ data: limited });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

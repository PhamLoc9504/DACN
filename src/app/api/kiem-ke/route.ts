import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

// GET /api/kiem-ke?page=&limit=&q=&trangThai=
export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const trangThai = url.searchParams.get('trangThai') || '';

    let query = supabase.from('inventory_checks' as any).select('id, ma_kk, ngay_kiem_ke, ma_nv, trang_thai, ghi_chu', { count: 'exact' });

    if (q) {
      query = query.or(`ma_kk.ilike.%${q}%,ma_nv.ilike.%${q}%`);
    }
    if (trangThai) {
      query = query.eq('trang_thai', trangThai);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.order('ngay_kiem_ke', { ascending: false }).range(from, to);
    if (error) throw error;

    // Lấy chi tiết đếm số dòng / sản phẩm
    const ids = (data || []).map((d: any) => d.id);
    let chiTietMap: Record<string, number> = {};
    if (ids.length) {
      const { data: ct, error: ctErr } = await supabase
        .from('inventory_check_details' as any)
        .select('inventory_check_id', { count: 'exact' })
        .in('inventory_check_id', ids as any);
      if (ctErr) throw ctErr;
      (ct || []).forEach((row: any) => {
        const key = row.inventory_check_id as string;
        chiTietMap[key] = (chiTietMap[key] || 0) + 1;
      });
    }

    const items = (data || []).map((d: any) => ({
      id: d.id,
      maKK: d.ma_kk,
      ngayKiemKe: d.ngay_kiem_ke,
      nguoiKiemKe: d.ma_nv,
      trangThai: d.trang_thai,
      ghiChu: d.ghi_chu || '',
      soLuongSanPham: chiTietMap[d.id] || 0,
    }));

    return NextResponse.json({ data: items, total: count ?? items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/kiem-ke - tạo mới phiếu kiểm kê cùng chi tiết
export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();
    const body = await req.json();
    const { maKK, ngayKiemKe, nguoiKiemKe, trangThai, ghiChu, chiTiet } = body || {};

    if (!maKK || !ngayKiemKe || !nguoiKiemKe) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }
    if (!Array.isArray(chiTiet) || chiTiet.length === 0) {
      return NextResponse.json({ error: 'Cần ít nhất một dòng chi tiết' }, { status: 400 });
    }

    const { data: inserted, error } = await supabase
      .from('inventory_checks' as any)
      .insert({
        ma_kk: maKK,
        ngay_kiem_ke: ngayKiemKe,
        ma_nv: nguoiKiemKe,
        trang_thai: trangThai || 'dang-tien-hanh',
        ghi_chu: ghiChu || '',
      })
      .select('id')
      .single();

    if (error) throw error;
    const inventoryCheckId = inserted.id as string;

    const detailsPayload = (chiTiet as any[]).map((ct) => ({
      inventory_check_id: inventoryCheckId,
      ma_hh: ct.mahh,
      so_luong_sach: ct.soLuongSach ?? 0,
      so_luong_thuc_te: ct.soLuongThucTe ?? 0,
      chenh_lech: ct.chenhLech ?? 0,
      ly_do: ct.lyDo || '',
    }));

    const { error: ctErr } = await supabase.from('inventory_check_details' as any).insert(detailsPayload);
    if (ctErr) throw ctErr;

    return NextResponse.json({ ok: true, id: inventoryCheckId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

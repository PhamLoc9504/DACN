import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

// GET /api/kiem-ke/:id - lấy phiếu + chi tiết
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();
    const id = params.id;

    const { data: header, error } = await supabase
      .from('inventory_checks' as any)
      .select('id, ma_kk, ngay_kiem_ke, ma_nv, trang_thai, ghi_chu')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!header) return NextResponse.json({ error: 'Không tìm thấy phiếu kiểm kê' }, { status: 404 });

    const { data: details, error: ctErr } = await supabase
      .from('inventory_check_details' as any)
      .select('id, ma_hh, so_luong_sach, so_luong_thuc_te, chenh_lech, ly_do')
      .eq('inventory_check_id', id);
    if (ctErr) throw ctErr;

    return NextResponse.json({
      id: header.id,
      maKK: header.ma_kk,
      ngayKiemKe: header.ngay_kiem_ke,
      nguoiKiemKe: header.ma_nv,
      trangThai: header.trang_thai,
      ghiChu: header.ghi_chu || '',
      chiTiet: (details || []).map((d: any) => ({
        id: d.id,
        mahh: d.ma_hh,
        soLuongSach: d.so_luong_sach ?? 0,
        soLuongThucTe: d.so_luong_thuc_te ?? 0,
        chenhLech: d.chenh_lech ?? 0,
        lyDo: d.ly_do || '',
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/kiem-ke/:id - cập nhật header + chi tiết, và nếu trạng thái = hoan-thanh thì cập nhật tồn kho
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();
    const id = params.id;
    const body = await req.json();
    const { maKK, ngayKiemKe, nguoiKiemKe, trangThai, ghiChu, chiTiet } = body || {};

    if (!maKK || !ngayKiemKe || !nguoiKiemKe) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }
    if (!Array.isArray(chiTiet) || chiTiet.length === 0) {
      return NextResponse.json({ error: 'Cần ít nhất một dòng chi tiết' }, { status: 400 });
    }

    const { error: upErr } = await supabase
      .from('inventory_checks' as any)
      .update({
        ma_kk: maKK,
        ngay_kiem_ke: ngayKiemKe,
        ma_nv: nguoiKiemKe,
        trang_thai: trangThai || 'dang-tien-hanh',
        ghi_chu: ghiChu || '',
      })
      .eq('id', id);
    if (upErr) throw upErr;

    // Xóa chi tiết cũ và thêm lại đơn giản
    const { error: delErr } = await supabase
      .from('inventory_check_details' as any)
      .delete()
      .eq('inventory_check_id', id);
    if (delErr) throw delErr;

    const detailsPayload = (chiTiet as any[]).map((ct) => ({
      inventory_check_id: id,
      ma_hh: ct.mahh,
      so_luong_sach: ct.soLuongSach ?? 0,
      so_luong_thuc_te: ct.soLuongThucTe ?? 0,
      chenh_lech: ct.chenhLech ?? 0,
      ly_do: ct.lyDo || '',
    }));

    const { error: ctErr } = await supabase.from('inventory_check_details' as any).insert(detailsPayload);
    if (ctErr) throw ctErr;

    // Nếu trạng thái là hoàn thành thì cập nhật tồn kho theo số lượng thực tế
    if (trangThai === 'hoan-thanh') {
      for (const ct of detailsPayload) {
        const diff = Number(ct.so_luong_thuc_te) - Number(ct.so_luong_sach);
        if (isNaN(diff) || diff === 0) continue;
        const { data: hh, error: hhErr } = await supabase
          .from('hanghoa' as any)
          .select('so_luong_ton')
          .eq('mahh', ct.ma_hh)
          .maybeSingle();
        if (hhErr) continue;
        const current = (hh?.so_luong_ton as number | null) ?? 0;
        const newQty = Number(ct.so_luong_thuc_te);
        await supabase
          .from('hanghoa' as any)
          .update({ so_luong_ton: newQty })
          .eq('mahh', ct.ma_hh);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

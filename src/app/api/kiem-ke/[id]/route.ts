import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

const ADJUST_CUSTOMER_ID = 'SYS_ADJUST';
const ADJUST_CUSTOMER_NAME = 'Điều chỉnh kiểm kê';

function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function ensureAdjustCustomer(supabase: any) {
  const { data: existing } = await supabase
    .from('khachhang')
    .select('makh')
    .eq('makh', ADJUST_CUSTOMER_ID)
    .maybeSingle();
  if (!existing) {
    await supabase.from('khachhang').insert({
      makh: ADJUST_CUSTOMER_ID,
      tenkh: ADJUST_CUSTOMER_NAME,
      sdt: null,
      diachi: 'Nội bộ',
    });
  }
  return ADJUST_CUSTOMER_ID;
}

async function ensureAdjustSupplier(supabase: any) {
  const { data: existing } = await supabase
    .from('nhacc')
    .select('mancc')
    .eq('mancc', ADJUST_CUSTOMER_ID)
    .maybeSingle();
  if (!existing) {
    await supabase.from('nhacc').insert({
      mancc: ADJUST_CUSTOMER_ID,
      tenncc: ADJUST_CUSTOMER_NAME,
      sdt: null,
      diachi: 'Nội bộ',
    });
  }
  return ADJUST_CUSTOMER_ID;
}

async function getLastCost(supabase: any, maHH: string) {
  const { data, error } = await supabase
    .from('ctphieunhap' as any)
    .select('dgnhap')
    .eq('mahh', maHH)
    .order('sopn', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.dgnhap) return 0;
  return Number(data.dgnhap) || 0;
}

async function resolveMaNVFromSession(supabase: any, maTk: string) {
  const { data, error } = await supabase
    .from('taikhoan' as any)
    .select('manv')
    .eq('matk', maTk)
    .maybeSingle();
  if (error) throw error;
  const maNV = data?.manv as string | undefined;
  if (!maNV) throw new Error('Tài khoản hiện tại chưa được gán cho nhân viên (MaNV)');
  return maNV;
}

async function nextAdjustCode(supabase: any, table: string, column: string, prefix: string, pad: number) {
  const { data, error } = await supabase
    .from(table as any)
    .select(column)
    .ilike(column, `${prefix}%`)
    .order(column, { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  let nextNum = 1;
  const lastVal = data?.[column];
  if (lastVal) {
    const match = String(lastVal).match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return prefix + String(nextNum).padStart(pad, '0');
}

// GET /api/kiem-ke/:id - lấy phiếu + chi tiết
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();
    const { id: idParam } = await params;
    const filterColumn = isUUID(idParam) ? 'id' : 'ma_kk';

    const { data: header, error } = await supabase
      .from('inventory_checks' as any)
      .select('id, ma_kk, ngay_kiem_ke, ma_nv, trang_thai, ghi_chu')
      .eq(filterColumn, idParam)
      .maybeSingle();
    if (error) throw error;
    if (!header) return NextResponse.json({ error: 'Không tìm thấy phiếu kiểm kê' }, { status: 404 });

    const { data: details, error: ctErr } = await supabase
      .from('inventory_check_details' as any)
      .select('id, ma_hh, so_luong_sach, so_luong_thuc_te, chenh_lech, ly_do')
      .eq('inventory_check_id', header.id);
    if (ctErr) throw ctErr;

    const maHHs = Array.from(new Set((details || []).map((d: any) => d.ma_hh).filter(Boolean)));
    let tenMap: Record<string, string> = {};
    if (maHHs.length) {
      const { data: hh, error: hhErr } = await supabase
        .from('hanghoa' as any)
        .select('mahh, tenhh')
        .in('mahh', maHHs as any);
      if (!hhErr) {
        (hh || []).forEach((row: any) => {
          if (row?.mahh) tenMap[String(row.mahh)] = row.tenhh || '';
        });
      }
    }

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
        tenhh: tenMap[String(d.ma_hh)] || '',
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
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();
    const { id: idParam } = await params;
    const filterColumn = isUUID(idParam) ? 'id' : 'ma_kk';
    const body = await req.json();
    const { maKK, ngayKiemKe, nguoiKiemKe, trangThai, ghiChu, chiTiet } = body || {};

    if (!maKK || !ngayKiemKe || !nguoiKiemKe) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }
    if (!Array.isArray(chiTiet) || chiTiet.length === 0) {
      return NextResponse.json({ error: 'Cần ít nhất một dòng chi tiết' }, { status: 400 });
    }

    const { data: header, error: headerErr } = await supabase
      .from('inventory_checks' as any)
      .select('id, trang_thai')
      .eq(filterColumn, idParam)
      .maybeSingle();
    if (headerErr) throw headerErr;
    if (!header) return NextResponse.json({ error: 'Không tìm thấy phiếu kiểm kê' }, { status: 404 });

    const shouldBalance = header.trang_thai !== 'hoan-thanh' && trangThai === 'hoan-thanh';

    const { error: upErr } = await supabase
      .from('inventory_checks' as any)
      .update({
        ma_kk: maKK,
        ngay_kiem_ke: ngayKiemKe,
        ma_nv: nguoiKiemKe,
        trang_thai: trangThai || 'dang-tien-hanh',
        ghi_chu: ghiChu || '',
      })
      .eq(filterColumn, idParam);
    if (upErr) throw upErr;

    // Xóa chi tiết cũ và thêm lại đơn giản
    const { error: delErr } = await supabase
      .from('inventory_check_details' as any)
      .delete()
      .eq('inventory_check_id', header.id);
    if (delErr) throw delErr;

    const detailsPayload = (chiTiet as any[]).map((ct) => ({
      inventory_check_id: header.id,
      ma_hh: ct.mahh,
      so_luong_sach: ct.soLuongSach ?? 0,
      so_luong_thuc_te: ct.soLuongThucTe ?? 0,
      chenh_lech: ct.chenhLech ?? 0,
      ly_do: ct.lyDo || '',
    }));

    const { error: ctErr } = await supabase.from('inventory_check_details' as any).insert(detailsPayload);
    if (ctErr) throw ctErr;

    if (shouldBalance) {
      const maNV = await resolveMaNVFromSession(supabase, session.maTk);
      const positives: Array<{ ma_hh: string; qty: number }> = [];
      const negatives: Array<{ ma_hh: string; qty: number }> = [];

      for (const ct of detailsPayload) {
        const diff = Number(ct.so_luong_thuc_te) - Number(ct.so_luong_sach);
        if (isNaN(diff) || diff === 0) continue;
        if (diff > 0) positives.push({ ma_hh: ct.ma_hh, qty: diff });
        else negatives.push({ ma_hh: ct.ma_hh, qty: Math.abs(diff) });

        await supabase
          .from('hanghoa' as any)
          .update({ soluongton: Number(ct.so_luong_thuc_te) })
          .eq('mahh', ct.ma_hh);
      }

      if (positives.length > 0) {
        const adjustSupplier = await ensureAdjustSupplier(supabase);
        const soPN = await nextAdjustCode(supabase, 'phieunhap', 'sopn', 'DCN', 7);
        const { error: pnErr } = await supabase.from('phieunhap' as any).insert({
          sopn: soPN,
          ngaynhap: ngayKiemKe,
          manv: maNV,
          mancc: adjustSupplier,
        });
        if (pnErr) throw pnErr;

        const ctPN = [];
        for (const ct of positives) {
          const cost = await getLastCost(supabase, ct.ma_hh);
          ctPN.push({
            sopn: soPN,
            mahh: ct.ma_hh,
            slnhap: ct.qty,
            dgnhap: cost,
            tongtien: ct.qty * cost,
          });
        }
        const { error: pnCtErr } = await supabase.from('ctphieunhap' as any).insert(ctPN);
        if (pnCtErr) throw pnCtErr;
      }

      if (negatives.length > 0) {
        await ensureAdjustCustomer(supabase);
        const soPX = await nextAdjustCode(supabase, 'phieuxuat', 'sopx', 'DCX', 7);
        const { error: pxErr } = await supabase.from('phieuxuat' as any).insert({
          sopx: soPX,
          ngayxuat: ngayKiemKe,
          manv: maNV,
        });
        if (pxErr) throw pxErr;

        const ctPX = [];
        for (const ct of negatives) {
          const cost = await getLastCost(supabase, ct.ma_hh);
          ctPX.push({
            sopx: soPX,
            mahh: ct.ma_hh,
            slxuat: ct.qty,
            dongia: cost,
            tongtien: ct.qty * cost,
          });
        }
        const { error: pxCtErr } = await supabase.from('ctphieuxuat' as any).insert(ctPX);
        if (pxCtErr) throw pxCtErr;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

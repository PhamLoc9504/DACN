import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD } from '@/lib/auditLog';

function todayVietnamDate() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // yyyy-mm-dd
}

const ADJUST_CUSTOMER_ID = 'SYS_ADJUST';
const ADJUST_CUSTOMER_NAME = 'Điều chỉnh kiểm kê';
const ADJUST_NOTE_PREFIX = 'Cân bằng kiểm kê ';

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
  // Lấy giá nhập gần nhất, fallback 0
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

    const effectiveDate = ngayKiemKe || todayVietnamDate();

    const { data: inserted, error } = await supabase
      .from('inventory_checks' as any)
      .insert({
        ma_kk: maKK,
        ngay_kiem_ke: effectiveDate,
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

    if (trangThai === 'hoan-thanh') {
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
        const soPN = await nextAdjustCode(supabase, 'phieunhap', 'sopn', 'DCN', 2);
        const { error: pnErr } = await supabase.from('phieunhap' as any).insert({
          sopn: soPN,
          ngaynhap: effectiveDate,
          manv: maNV,
          mancc: adjustSupplier,
        });
        if (pnErr) throw pnErr;

        const ctPN = [];
        for (const ct of positives) {
          // Hàng thừa: coi như được cho không, ghi nhận giá 0 để không tạo công nợ
          const cost = 0;
          ctPN.push({
            sopn: soPN,
            mahh: ct.ma_hh,
            slnhap: ct.qty,
            dgnhap: cost,
            tongtien: 0,
          });
        }
        const { error: pnCtErr } = await supabase.from('ctphieunhap' as any).insert(ctPN);
        if (pnCtErr) throw pnCtErr;
      }

      if (negatives.length > 0) {
        await ensureAdjustCustomer(supabase);
        const soPX = await nextAdjustCode(supabase, 'phieuxuat', 'sopx', 'DCX', 2);
        const { error: pxErr } = await supabase.from('phieuxuat' as any).insert({
          sopx: soPX,
          ngayxuat: effectiveDate,
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

    return NextResponse.json({ ok: true, id: inventoryCheckId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('taikhoan')
      .select('manv, tendangnhap, vaitro, trangthai')
      .like('tendangnhap', '%@gmail.%')
      .neq('vaitro', 'Khách hàng')
      .neq('vaitro', 'Nhà cung cấp');

    if (error) throw error;

    const active = (data || []).filter((acc) => acc.trangthai === 'Hoạt động');

    const staffIds = active.map((a) => a.manv).filter(Boolean);

    let names: Record<string, string> = {};
    if (staffIds.length > 0) {
      const { data: nvData, error: nvError } = await supabase
        .from('nhanvien')
        .select('manv, hoten, chucvu')
        .in('manv', staffIds as string[]);
      if (nvError) throw nvError;
      names = Object.fromEntries(
        (nvData || []).map((nv: any) => [nv.manv, `${nv.hoten || nv.manv}`]),
      );
    }

    const staffs = active.map((acc) => ({
      id: acc.manv as string,
      email: acc.tendangnhap as string,
      name: names[acc.manv as string] || (acc.tendangnhap as string),
      role: acc.vaitro as string,
    }));

    return NextResponse.json({ staffs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

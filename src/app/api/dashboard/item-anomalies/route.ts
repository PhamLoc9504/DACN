import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

// Trả về danh sách mặt hàng có lượng nhập hoặc xuất cao bất thường (so với trung bình toàn kho)
export async function GET() {
  try {
    const supabase = getServerSupabase();

    // Tổng hợp nhập theo mặt hàng
    const { data: nhapData, error: nhapError } = await supabase
      .from('ctphieunhap')
      .select('mahh, slnhap');
    if (nhapError) throw nhapError;

    const nhapAgg = new Map<string, number>();
    for (const r of nhapData || []) {
      const key = String((r as any).mahh);
      nhapAgg.set(key, (nhapAgg.get(key) || 0) + ((r as any).slnhap || 0));
    }

    // Tổng hợp xuất theo mặt hàng
    const { data: xuatData, error: xuatError } = await supabase
      .from('ctphieuxuat')
      .select('mahh, slxuat');
    if (xuatError) throw xuatError;

    const xuatAgg = new Map<string, number>();
    for (const r of xuatData || []) {
      const key = String((r as any).mahh);
      xuatAgg.set(key, (xuatAgg.get(key) || 0) + ((r as any).slxuat || 0));
    }

    const allMahh = Array.from(new Set([...nhapAgg.keys(), ...xuatAgg.keys()]));

    // Tính trung bình trên các mặt hàng có phát sinh
    const nhapValues = Array.from(nhapAgg.values()).filter((v) => v > 0);
    const xuatValues = Array.from(xuatAgg.values()).filter((v) => v > 0);
    const avgNhap = nhapValues.length ? nhapValues.reduce((s, v) => s + v, 0) / nhapValues.length : 0;
    const avgXuat = xuatValues.length ? xuatValues.reduce((s, v) => s + v, 0) / xuatValues.length : 0;

    const anomalies: { mahh: string; nhap: number; xuat: number; nhapHigh: boolean; xuatHigh: boolean }[] = [];
    for (const mahh of allMahh) {
      const nhap = nhapAgg.get(mahh) || 0;
      const xuat = xuatAgg.get(mahh) || 0;
      const nhapHigh = avgNhap > 0 && nhap >= avgNhap * 2;
      const xuatHigh = avgXuat > 0 && xuat >= avgXuat * 2;
      if (nhapHigh || xuatHigh) {
        anomalies.push({ mahh, nhap, xuat, nhapHigh, xuatHigh });
      }
    }

    // Lấy thông tin hàng hóa kèm tồn kho
    if (anomalies.length) {
      const { data: hhData } = await supabase
        .from('hanghoa')
        .select('mahh, tenhh, soluongton')
        .in('mahh', anomalies.map((x) => x.mahh));
      const infoMap = new Map<string, any>((hhData || []).map((h: any) => [String(h.mahh), h]));
      for (const a of anomalies) {
        const info = infoMap.get(a.mahh);
        (a as any).tenhh = info?.tenhh || a.mahh;
        (a as any).ton = info?.soluongton ?? null;
      }
    }

    // Sắp xếp theo mức độ bất thường (ưu tiên xuất cao, sau đó nhập cao)
    anomalies.sort((a, b) => (b.xuatHigh ? b.xuat : 0) - (a.xuatHigh ? a.xuat : 0) || (b.nhapHigh ? b.nhap : 0) - (a.nhapHigh ? a.nhap : 0));

    return NextResponse.json({ data: anomalies.slice(0, 10) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

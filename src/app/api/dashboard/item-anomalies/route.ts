import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

// Trả về danh sách mặt hàng có lượng nhập hoặc xuất cao bất thường (so với trung bình toàn kho)
export async function GET() {
  try {
    const supabase = getServerSupabase();

		// Ngưỡng cảnh báo:
		// - Xuất: báo nếu một trong hai điều kiện
		//    + Khối lượng xuất hôm nay >= HARD_XUAT_QTY (ví dụ bán sỉ 50+)
		//    + Hoặc gấp MULTIPLIER_XUAT lần trung bình 7 ngày và >= MIN_XUAT_QTY
		// - Nhập: tăng ngưỡng để tránh báo nhỏ lẻ (>=20 và >=3x TB7d)
		const MULTIPLIER_NHAP = 3;
		const MIN_NHAP_QTY = 20;
		// - Xuất: giữ ngưỡng đã nâng (>=50 hoặc >=3x TB7d và >=20)
		const MULTIPLIER_XUAT = 3;
		const MIN_XUAT_QTY = 20;
		const HARD_XUAT_QTY = 50;
		const today = new Date();
		const todayStr = today.toISOString().slice(0, 10);
		const startPrev7 = new Date(today);
		startPrev7.setDate(startPrev7.getDate() - 7);
		const startPrev7Str = startPrev7.toISOString().slice(0, 10);

		const { data: nhapRows, error: nhapError } = await supabase
			.from('ctphieunhap')
			.select('mahh, slnhap, phieunhap!inner(ngaynhap)');
		if (nhapError) throw nhapError;

		const { data: xuatRows, error: xuatError } = await supabase
			.from('ctphieuxuat')
			.select('mahh, slxuat, phieuxuat!inner(ngayxuat)');
		if (xuatError) throw xuatError;

		type Agg = {
			mahh: string;
			nhapToday: number;
			xuatToday: number;
			nhapPrev7Total: number;
			xuatPrev7Total: number;
		};

		const agg = new Map<string, Agg>();
		const get = (mahh: string): Agg => {
			const key = String(mahh);
			let v = agg.get(key);
			if (!v) {
				v = { mahh: key, nhapToday: 0, xuatToday: 0, nhapPrev7Total: 0, xuatPrev7Total: 0 };
				agg.set(key, v);
			}
			return v;
		};

		for (const r of nhapRows || []) {
			const mahh = String((r as any).mahh);
			const qty = Number((r as any).slnhap || 0);
			const dateStr = String((r as any).phieunhap?.ngaynhap || '').slice(0, 10);
			if (!dateStr) continue;
			const item = get(mahh);
			if (dateStr === todayStr) item.nhapToday += qty;
			else if (dateStr >= startPrev7Str && dateStr < todayStr) item.nhapPrev7Total += qty;
		}

		for (const r of xuatRows || []) {
			const mahh = String((r as any).mahh);
			const qty = Number((r as any).slxuat || 0);
			const dateStr = String((r as any).phieuxuat?.ngayxuat || '').slice(0, 10);
			if (!dateStr) continue;
			const item = get(mahh);
			if (dateStr === todayStr) item.xuatToday += qty;
			else if (dateStr >= startPrev7Str && dateStr < todayStr) item.xuatPrev7Total += qty;
		}

		const results: Array<{
			mahh: string;
			tenhh?: string;
			ton?: number | null;
			nhapToday: number;
			xuatToday: number;
			avgNhap7d: number;
			avgXuat7d: number;
			ratioNhap: number;
			ratioXuat: number;
			nhapHigh: boolean;
			xuatHigh: boolean;
		}> = [];

		for (const v of agg.values()) {
			const avgNhap7d = v.nhapPrev7Total / 7;
			const avgXuat7d = v.xuatPrev7Total / 7;
			const ratioNhap = avgNhap7d > 0 ? v.nhapToday / avgNhap7d : 0;
			const ratioXuat = avgXuat7d > 0 ? v.xuatToday / avgXuat7d : 0;

			const nhapHigh = v.nhapToday >= MIN_NHAP_QTY && avgNhap7d > 0 && ratioNhap >= MULTIPLIER_NHAP;
			const xuatHigh =
				v.xuatToday >= HARD_XUAT_QTY ||
				(v.xuatToday >= MIN_XUAT_QTY && avgXuat7d > 0 && ratioXuat >= MULTIPLIER_XUAT);
			if (!nhapHigh && !xuatHigh) continue;

			results.push({
				mahh: v.mahh,
				nhapToday: v.nhapToday,
				xuatToday: v.xuatToday,
				avgNhap7d,
				avgXuat7d,
				ratioNhap,
				ratioXuat,
				nhapHigh,
				xuatHigh,
			});
		}

		if (results.length) {
			const { data: hhData } = await supabase
				.from('hanghoa')
				.select('mahh, tenhh, soluongton')
				.in('mahh', results.map((x) => x.mahh));
			const infoMap = new Map<string, any>((hhData || []).map((h: any) => [String(h.mahh), h]));
			for (const a of results) {
				const info = infoMap.get(a.mahh);
				(a as any).tenhh = info?.tenhh || a.mahh;
				(a as any).ton = info?.soluongton ?? null;
			}
		}

		results.sort((a, b) => {
			const aScore = Math.max(a.ratioXuat || 0, a.ratioNhap || 0);
			const bScore = Math.max(b.ratioXuat || 0, b.ratioNhap || 0);
			return bScore - aScore;
		});

    return NextResponse.json({
			meta: {
				today: todayStr,
				avgWindowDays: 7,
				multiplierNhap: MULTIPLIER_NHAP,
				minNhapQty: MIN_NHAP_QTY,
				multiplierXuat: MULTIPLIER_XUAT,
				minXuatQty: MIN_XUAT_QTY,
				hardXuatQty: HARD_XUAT_QTY,
			},
			data: results.slice(0, 10),
		});
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

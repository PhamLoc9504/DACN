import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

// Body: { phieu: { SoPX, NgayXuat, MaNV }, chitiet: [{ MaHH, SLXuat, DonGia }] }
export async function POST(req: Request) {
	try {
		const { phieu, chitiet } = await req.json();
		if (!phieu?.SoPX || !Array.isArray(chitiet) || chitiet.length === 0) {
			return NextResponse.json({ error: 'Thiếu dữ liệu phiếu hoặc chi tiết' }, { status: 400 });
		}
		const supabase = getServerSupabase();
		const { error: errPX } = await supabase.from('phieuxuat').insert([
			{ sopx: phieu.SoPX, ngayxuat: phieu.NgayXuat ?? null, manv: phieu.MaNV ?? null },
		]);
		if (errPX) throw errPX;
		for (const row of chitiet) {
			// kiểm tra tồn kho
			const { data: cur } = await supabase.from('hanghoa').select('soluongton').eq('mahh', row.MaHH).maybeSingle();
			const current = cur?.soluongton || 0;
			if (current < (row.SLXuat || 0)) {
				return NextResponse.json({ error: `Tồn kho không đủ cho ${row.MaHH}` }, { status: 400 });
			}
			const { error: errCT } = await supabase.from('ctphieuxuat').insert([
				{
					sopx: phieu.SoPX,
					mahh: row.MaHH,
					slxuat: row.SLXuat,
					dongia: row.DonGia,
					tongtien: (row.SLXuat || 0) * (row.DonGia || 0),
				},
			]);
			if (errCT) throw errCT;
			const newQty = current - (row.SLXuat || 0);
			const { error: errUpd } = await supabase.from('hanghoa').update({ soluongton: newQty }).eq('mahh', row.MaHH);
			if (errUpd) throw errUpd;
		}
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}



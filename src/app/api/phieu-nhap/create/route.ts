import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

// Body: { phieu: { SoPN, NgayNhap, MaNV, MaNCC }, chitiet: [{ MaHH, SLNhap, DGNhap }] }
export async function POST(req: Request) {
	try {
		const { phieu, chitiet } = await req.json();
		if (!phieu?.SoPN || !Array.isArray(chitiet) || chitiet.length === 0) {
			return NextResponse.json({ error: 'Thiếu dữ liệu phiếu hoặc chi tiết' }, { status: 400 });
		}
		const supabase = getServerSupabase();
		// 1) insert phieunhap
		const { error: errPN } = await supabase.from('phieunhap').insert([
			{
				sopn: phieu.SoPN,
				ngaynhap: phieu.NgayNhap ?? null,
				manv: phieu.MaNV ?? null,
				mancc: phieu.MaNCC ?? null,
			},
		]);
		if (errPN) throw errPN;
		// 2) insert chi tiet + update stock
		for (const row of chitiet) {
			const { error: errCT } = await supabase.from('ctphieunhap').insert([
				{
					sopn: phieu.SoPN,
					mahh: row.MaHH,
					slnhap: row.SLNhap,
					dgnhap: row.DGNhap,
					tongtien: (row.SLNhap || 0) * (row.DGNhap || 0),
				},
			]);
			if (errCT) throw errCT;
			// update ton kho += SLNhap
			const { error: errUpd } = await supabase.rpc('exec', {} as any);
			// fallback: direct update (Supabase chưa có RPC 'exec'; dùng update tăng đơn giản)
			const { error: errUpd2 } = await supabase
				.from('hanghoa')
				.update({})
				.eq('mahh', 'dummy');
			// Thay bằng câu lệnh tăng trực tiếp
			const { error: errIncr } = await supabase.rpc('increment_stock', {
				p_mahh: row.MaHH,
				p_delta: row.SLNhap,
			});
			if (errIncr && (errUpd || errUpd2)) {
				// nếu không có RPC increment_stock, dùng update thủ công
				const { data: cur } = await supabase.from('hanghoa').select('soluongton').eq('mahh', row.MaHH).maybeSingle();
				const current = (cur?.soluongton || 0) + (row.SLNhap || 0);
				const { error: errFinal } = await supabase.from('hanghoa').update({ soluongton: current }).eq('mahh', row.MaHH);
				if (errFinal) throw errFinal;
			}
		}
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}



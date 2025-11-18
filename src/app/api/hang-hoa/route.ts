import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

// Add a new endpoint to search product by barcode
export async function GET_BAK(req: Request) {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode');
    
    if (!barcode) {
        return GET(req);
    }
    
    try {
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('hanghoa')
            .select('*')
            .eq('barcode', barcode)
            .single();
            
        if (error) throw error;
        
        if (!data) {
            return NextResponse.json({ data: null }, { status: 404 });
        }
        
        return NextResponse.json({ data: toCamel(data) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}

function toCamel(row: any) {
	return {
		MaHH: row.mahh,
		TenHH: row.tenhh,
		MaLoai: row.maloai,
		DonGia: row.dongia,
		SoLuongTon: row.soluongton,
		DVT: row.dvt,
		MaNCC: row.mancc,
		Barcode: row.barcode,
		Quantity: row.quantity,
		TrangThai: row.trangthai,
	};
}

export async function GET(req: Request) {
	try {
			const { searchParams } = new URL(req.url);
			const barcode = searchParams.get('barcode')?.trim();
			const page = parseInt(searchParams.get('page') || '1', 10);
			const limit = parseInt(searchParams.get('limit') || '10', 10);
			const q = searchParams.get('q')?.trim().toLowerCase() || '';
			const from = (page - 1) * limit;
			const to = from + limit - 1;
			const supabase = getServerSupabase();

			// Nếu có barcode -> ưu tiên tìm theo mã vạch, không phân trang
			if (barcode) {
				const { data, error } = await supabase
					.from('hanghoa')
					.select('*')
					.eq('barcode', barcode)
					.order('mahh', { ascending: true });
				if (error) throw error;
				return NextResponse.json({ data: (data || []).map(toCamel) });
			}

			// Ngược lại: luồng cũ, phân trang + tìm kiếm theo q
			let query = supabase.from('hanghoa').select('*', { count: 'exact' }).order('mahh', { ascending: true });
			if (q) {
				query = query.or(`mahh.ilike.%${q}%,tenhh.ilike.%${q}%`);
			}
			const { data, error, count } = await query.range(from, to);
			if (error) throw error;
			return NextResponse.json({ data: (data || []).map(toCamel), total: count || 0, page, limit });
	} catch (e: any) {
			return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
		}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const supabase = getServerSupabase();
		const { error } = await supabase.from('hanghoa').insert([
			{
				mahh: body.MaHH,
				tenhh: body.TenHH,
				maloai: body.MaLoai || null,
				dongia: body.DonGia || null,
				soluongton: body.SoLuongTon || 0,
				dvt: body.DVT,
				barcode: body.Barcode || null,
				quantity: body.Quantity || null,
				mancc: body.MaNCC || null,
			},
		]);
		if (error) throw error;
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function PUT(req: Request) {
	try {
		const body = await req.json();
		const supabase = getServerSupabase();
		const { error } = await supabase
			.from('hanghoa')
			.update({
				tenhh: body.TenHH,
				maloai: body.MaLoai || null,
				dongia: body.DonGia || null,
				soluongton: body.SoLuongTon || 0,
				dvt: body.DVT,
				barcode: body.Barcode || null,
				quantity: body.Quantity || null,
				mancc: body.MaNCC || null,
			})
			.eq('mahh', body.MaHH);
		if (error) throw error;
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
        const supabase = getServerSupabase();
        // Soft delete: set trangthai = 'Ngừng kinh doanh'
        const { error } = await supabase.from('hanghoa').update({ trangthai: 'Ngừng kinh doanh' }).eq('mahh', id);
        if (error) {
            // Column might not exist
            if ((error as any).code === '42703') {
                return NextResponse.json({
                    error:
                        "Bảng hanghoa chưa có cột 'trangthai'. Hãy thêm: ALTER TABLE HangHoa ADD COLUMN TrangThai VARCHAR(20) DEFAULT 'Hoạt động';",
                }, { status: 400 });
            }
            throw error;
        }
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}



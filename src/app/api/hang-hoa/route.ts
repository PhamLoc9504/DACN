import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { hangHoaSchema, validateWithSchema, sanitizeString } from '@/lib/validation';
import { handleApiError, createError } from '@/lib/errorHandler';

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
		// Hỗ trợ cả hai kiểu tên cột: NgaySanXuat / ngaysanxuat
		NgaySanXuat: row.NgaySanXuat ?? row.ngaysanxuat ?? null,
		NgayHetHan: row.NgayHetHan ?? row.ngayhethan ?? null,
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
			// Lọc theo ngày sản xuất / hết hạn (nếu có)
			const nsxFrom = searchParams.get('nsxFrom')?.trim();
			const nsxTo = searchParams.get('nsxTo')?.trim();
			const expFrom = searchParams.get('expFrom')?.trim();
			const expTo = searchParams.get('expTo')?.trim();
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

			// Ngược lại: luồng cũ, phân trang + tìm kiếm theo q + lọc ngày SX/HSD
			let query = supabase.from('hanghoa').select('*', { count: 'exact' }).order('mahh', { ascending: true });
			if (q) {
				query = query.or(`mahh.ilike.%${q}%,tenhh.ilike.%${q}%`);
			}
			if (nsxFrom) {
				query = query.gte('NgaySanXuat', nsxFrom);
			}
			if (nsxTo) {
				query = query.lte('NgaySanXuat', nsxTo);
			}
			if (expFrom) {
				query = query.gte('NgayHetHan', expFrom);
			}
			if (expTo) {
				query = query.lte('NgayHetHan', expTo);
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
		
		// Validate input với Zod schema
		const validation = validateWithSchema(hangHoaSchema, body);
		if (!validation.success) {
			const firstError = Object.values(validation.errors)[0];
			return NextResponse.json(
				{ 
					error: firstError || 'Dữ liệu không hợp lệ',
					errors: validation.errors,
					code: 'VALIDATION_ERROR'
				}, 
				{ status: 400 }
			);
		}

		// Sanitize string inputs
		const sanitized = {
			...validation.data,
			TenHH: sanitizeString(validation.data.TenHH),
			MaHH: sanitizeString(validation.data.MaHH),
			Barcode: validation.data.Barcode ? sanitizeString(validation.data.Barcode) : null,
		};

		const supabase = getServerSupabase();
		const { error } = await supabase.from('hanghoa').insert([
			{
				mahh: sanitized.MaHH,
				tenhh: sanitized.TenHH,
				maloai: sanitized.MaLoai || null,
				dongia: sanitized.DonGia || null,
				soluongton: sanitized.SoLuongTon || 0,
				dvt: sanitized.DVT,
				barcode: sanitized.Barcode || null,
				quantity: sanitized.Quantity || null,
				mancc: sanitized.MaNCC || null,
				// Cột trong DB được tạo với tên CamelCase: "NgaySanXuat", "NgayHetHan"
				NgaySanXuat: sanitized.NgaySanXuat || null,
				NgayHetHan: sanitized.NgayHetHan || null,
			},
		]);
		
		if (error) {
			// Handle duplicate key error
			if (error.code === '23505') {
				return NextResponse.json(
					{ 
						error: 'Mã hàng hóa đã tồn tại',
						code: 'DUPLICATE_ERROR'
					}, 
					{ status: 409 }
				);
			}
			throw error;
		}
		
		return NextResponse.json({ ok: true });
	} catch (e: unknown) {
		const appError = handleApiError(e);
		return NextResponse.json(
			{ error: appError.message, code: appError.code },
			{ status: appError.statusCode || 500 }
		);
	}
}

export async function PUT(req: Request) {
	try {
		const body = await req.json();
		
		// Validate input với Zod schema
		const validation = validateWithSchema(hangHoaSchema, body);
		if (!validation.success) {
			const firstError = Object.values(validation.errors)[0];
			return NextResponse.json(
				{ 
					error: firstError || 'Dữ liệu không hợp lệ',
					errors: validation.errors,
					code: 'VALIDATION_ERROR'
				}, 
				{ status: 400 }
			);
		}

		// Sanitize string inputs
		const sanitized = {
			...validation.data,
			TenHH: sanitizeString(validation.data.TenHH),
			Barcode: validation.data.Barcode ? sanitizeString(validation.data.Barcode) : null,
		};

		const supabase = getServerSupabase();
		const { error } = await supabase
			.from('hanghoa')
			.update({
				tenhh: sanitized.TenHH,
				maloai: sanitized.MaLoai || null,
				dongia: sanitized.DonGia || null,
				soluongton: sanitized.SoLuongTon || 0,
				dvt: sanitized.DVT,
				barcode: sanitized.Barcode || null,
				quantity: sanitized.Quantity || null,
				mancc: sanitized.MaNCC || null,
				NgaySanXuat: sanitized.NgaySanXuat || null,
				NgayHetHan: sanitized.NgayHetHan || null,
			})
			.eq('mahh', sanitized.MaHH);
			
		if (error) {
			if (error.code === 'PGRST116') {
				return NextResponse.json(
					{ 
						error: 'Không tìm thấy hàng hóa cần cập nhật',
						code: 'NOT_FOUND'
					}, 
					{ status: 404 }
				);
			}
			throw error;
		}
		
		return NextResponse.json({ ok: true });
	} catch (e: unknown) {
		const appError = handleApiError(e);
		return NextResponse.json(
			{ error: appError.message, code: appError.code },
			{ status: appError.statusCode || 500 }
		);
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



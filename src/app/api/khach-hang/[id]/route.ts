import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD } from '@/lib/auditLog';

function toCamel(row: any) {
	return {
		MaKH: row.makh,
		TenKH: row.tenkh,
		SDT: row.sdt,
		DiaChi: row.diachi,
	};
}

// GET: Lấy chi tiết khách hàng
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const makh = id;
		const supabase = getServerSupabase();

		const { data, error } = await supabase
			.from('khachhang')
			.select('*')
			.eq('makh', makh)
			.single();

		if (error || !data) {
			return NextResponse.json({ error: 'Khách hàng không tồn tại' }, { status: 404 });
		}

		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// PUT: Cập nhật khách hàng
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const makh = id;
		const body = await req.json();
		const { TenKH, SDT, DiaChi } = body;

		const supabase = getServerSupabase();

		// Lấy dữ liệu cũ để log
		const { data: oldData } = await supabase
			.from('khachhang')
			.select('*')
			.eq('makh', makh)
			.single();

		if (!oldData) {
			return NextResponse.json({ error: 'Khách hàng không tồn tại' }, { status: 404 });
		}

		// Cập nhật
		const updateData: any = {};
		if (TenKH !== undefined) updateData.tenkh = TenKH || null;
		if (SDT !== undefined) updateData.sdt = SDT || null;
		if (DiaChi !== undefined) updateData.diachi = DiaChi || null;

		const { data: updatedData, error } = await supabase
			.from('khachhang')
			.update(updateData)
			.eq('makh', makh)
			.select()
			.single();

		if (error) throw error;

		// Ghi log
		await logCRUD('SUA', 'khachhang', makh, oldData, updatedData);

		return NextResponse.json({ data: toCamel(updatedData) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// DELETE: Xóa khách hàng
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const makh = id;
		const supabase = getServerSupabase();

		// Lấy dữ liệu cũ để log
		const { data: oldData } = await supabase
			.from('khachhang')
			.select('*')
			.eq('makh', makh)
			.single();

		if (!oldData) {
			return NextResponse.json({ error: 'Khách hàng không tồn tại' }, { status: 404 });
		}

		// Kiểm tra xem khách hàng có hóa đơn không
		const { data: invoices } = await supabase
			.from('hoadon')
			.select('mahd')
			.eq('makh', makh)
			.limit(1);

		if (invoices && invoices.length > 0) {
			return NextResponse.json({ error: 'Không thể xóa khách hàng đã có hóa đơn' }, { status: 400 });
		}

		// Xóa
		const { error } = await supabase.from('khachhang').delete().eq('makh', makh);

		if (error) throw error;

		// Ghi log
		await logCRUD('XOA', 'khachhang', makh, oldData, null);

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


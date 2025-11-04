import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { createHash, randomUUID } from 'crypto';

export async function POST(req: Request) {
	try {
		const { username, password, maNV } = await req.json();
		if (!username || !password) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
		const supabase = getServerSupabase();
		// Check exist
		const exist = await supabase.from('taikhoan').select('matk').eq('tendangnhap', username).maybeSingle();
		if (exist.data) return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 409 });
		// If MaNV provided, validate it exists and not already linked
		let manvValue: string | null = null;
		if (maNV && typeof maNV === 'string' && maNV.trim()) {
			const emp = await supabase.from('nhanvien').select('manv').eq('manv', maNV).maybeSingle();
			if (!emp.data) return NextResponse.json({ error: 'Mã nhân viên không tồn tại' }, { status: 400 });
			const used = await supabase.from('taikhoan').select('matk').eq('manv', maNV).maybeSingle();
			if (used.data) return NextResponse.json({ error: 'Mã nhân viên đã được gán tài khoản' }, { status: 409 });
			manvValue = maNV;
		}
		const hash = createHash('sha256').update(password).digest('hex');
		const maTk = 'TK' + randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
		const { error } = await supabase.from('taikhoan').insert([
			{
				matk: maTk,
				tendangnhap: username,
				matkhau: hash,
				vaitro: 'Nhân viên kho',
				trangthai: 'Hoạt động',
				manv: manvValue,
			},
		]);
		if (error) throw error;
		return NextResponse.json({ ok: true, maTk });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}



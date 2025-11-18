import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { createHash } from 'crypto';
import { logCRUD } from '@/lib/auditLog';
import { hasAnyRole, normalizeUserRole, UserRole } from '@/lib/roles';

function toCamel(row: any) {
	return {
		MaTK: row.matk,
		TenDangNhap: row.tendangnhap,
		MaNV: row.manv,
		VaiTro: row.vaitro,
		TrangThai: row.trangthai,
		NgayTao: row.ngaytao,
		LanDangNhapCuoi: row.landangnhapcuoi,
	};
}

// PUT: Cập nhật tài khoản (chỉ Admin)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		
		// Chỉ Quản lý kho được phép chỉnh sửa
		if (!hasAnyRole(session.vaiTro, [UserRole.ADMIN])) {
			return NextResponse.json({ error: 'Forbidden - Chỉ Quản lý kho mới được cập nhật tài khoản' }, { status: 403 });
		}

		const { id } = await params;
		const matk = id;
		const body = await req.json();
		const { matkhau, manv, vaitro, trangthai } = body;

		const supabase = getServerSupabase();

		// Lấy dữ liệu cũ để log
		const { data: oldData } = await supabase
			.from('taikhoan')
			.select('*')
			.eq('matk', matk)
			.single();

		if (!oldData) {
			return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });
		}

		// Không cho phép Admin tự khóa tài khoản của mình
		if (session.maTk === matk && trangthai === 'Khóa') {
			return NextResponse.json({ error: 'Không thể khóa tài khoản của chính mình' }, { status: 400 });
		}

		// Chuẩn bị dữ liệu cập nhật
		const updateData: any = {};
		if (matkhau) {
			updateData.matkhau = createHash('sha256').update(matkhau).digest('hex');
		}
		if (manv !== undefined) {
			// Nếu có MaNV mới, kiểm tra
			if (manv) {
				const emp = await supabase
					.from('nhanvien')
					.select('manv')
					.eq('manv', manv)
					.maybeSingle();
				
				if (!emp.data) {
					return NextResponse.json({ error: 'Mã nhân viên không tồn tại' }, { status: 400 });
				}

				// Kiểm tra nhân viên khác đã dùng chưa
				const used = await supabase
					.from('taikhoan')
					.select('matk')
					.eq('manv', manv)
					.neq('matk', matk)
					.maybeSingle();
				
				if (used.data) {
					return NextResponse.json({ error: 'Nhân viên này đã có tài khoản khác' }, { status: 409 });
				}
			}
			updateData.manv = manv || null;
		}
		if (vaitro !== undefined) {
			const newRole = normalizeUserRole(vaitro);
			if (newRole === UserRole.ADMIN && session.vaiTro !== UserRole.ADMIN) {
				return NextResponse.json({ error: 'Không thể nâng cấp tài khoản lên Quản lý kho' }, { status: 403 });
			}
			if (newRole !== UserRole.ADMIN && oldData.vaitro === UserRole.ADMIN) {
				return NextResponse.json({ error: 'Không thể hạ cấp tài khoản Quản lý kho' }, { status: 403 });
			}
			updateData.vaitro = newRole;
		}
		if (trangthai !== undefined) updateData.trangthai = trangthai;

		const { data, error } = await supabase
			.from('taikhoan')
			.update(updateData)
			.eq('matk', matk)
			.select()
			.single();

		if (error) throw error;

		// Ghi log
		await logCRUD('SUA', 'taikhoan', matk, oldData, data);

		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// DELETE: Xóa tài khoản (chỉ Admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		
		// Chỉ Admin mới được xóa tài khoản
		if (!hasAnyRole(session.vaiTro, [UserRole.ADMIN])) {
			return NextResponse.json({ error: 'Forbidden - Chỉ Admin mới được xóa tài khoản' }, { status: 403 });
		}

		const { id } = await params;
		const matk = id;

		// Không cho phép xóa tài khoản của chính mình
		if (session.maTk === matk) {
			return NextResponse.json({ error: 'Không thể xóa tài khoản của chính mình' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		// Lấy dữ liệu cũ để log
		const { data: oldData } = await supabase
			.from('taikhoan')
			.select('*')
			.eq('matk', matk)
			.single();

		if (!oldData) {
			return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });
		}

		// Xóa tài khoản
		const { error } = await supabase
			.from('taikhoan')
			.delete()
			.eq('matk', matk);

		if (error) throw error;

		// Ghi log
		await logCRUD('XOA', 'taikhoan', matk, oldData, null);

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


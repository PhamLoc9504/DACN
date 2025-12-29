import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { createHash, createHmac } from 'crypto';
import { UserRole, hasAnyRole } from '@/lib/roles';

async function buildInvoicePayload(mahd: string) {
	const supabase = getServerSupabase();

	const { data: invoice, error: invErr } = await supabase
		.from('hoadon')
		.select('mahd, ngaylap, makh, tongtien, trangthai, sopx, sopn, manv, hinhthucgiao, phuongthuctt')
		.eq('mahd', mahd)
		.limit(1)
		.maybeSingle();

	if (invErr) throw invErr;
	if (!invoice) {
		return { notFound: true as const };
	}

	const { data: items, error: itemsErr } = await supabase
		.from('ct_hoadon')
		.select('mahh, soluong, dongia, tongtien')
		.eq('mahd', mahd)
		.order('mahh', { ascending: true });

	if (itemsErr) throw itemsErr;

	const payload = {
		invoice: {
			MaHD: invoice.mahd,
			NgayLap: invoice.ngaylap,
			MaKH: invoice.makh,
			TongTien: invoice.tongtien,
			TrangThai: invoice.trangthai,
			SoPX: invoice.sopx,
			SoPN: invoice.sopn,
			MaNV: invoice.manv,
			HinhThucGiao: invoice.hinhthucgiao,
			PhuongThucTT: invoice.phuongthuctt,
		},
		items: (items || []).map((it) => ({
			MaHH: it.mahh,
			SoLuong: it.soluong,
			DonGia: it.dongia,
			TongTien: it.tongtien,
		})),
	};

	return { notFound: false as const, payload };
}

function hashPayload(payload: unknown): string {
	const json = JSON.stringify(payload);
	return createHash('sha256').update(json).digest('hex');
}

function signHash(hash: string, secret: string): string {
	return createHmac('sha256', secret).update(hash).digest('hex');
}

async function resolveSignerInfo(signedBy: string) {
	const supabase = getServerSupabase();
	const { data: account } = await supabase
		.from('taikhoan')
		.select('matk, tendangnhap, manv, vaitro')
		.or(`tendangnhap.eq.${signedBy},matk.eq.${signedBy}`)
		.limit(1)
		.maybeSingle();

	const roleOrTitle = (account?.vaitro as string | null) || '';
	const maNV = (account?.manv as string | null) || null;

	let fullName = '';
	let title = roleOrTitle;

	if (maNV) {
		const { data: emp } = await supabase
			.from('nhanvien')
			.select('hoten, chucvu')
			.eq('manv', maNV)
			.limit(1)
			.maybeSingle();
		fullName = (emp?.hoten as string | null) || '';
		const chucVu = (emp?.chucvu as string | null) || '';
		title = chucVu || title;
	}

	const signedByName = fullName || '';
	const signedByTitle = title || '';
	const signedByDisplay = signedByName
		? `${signedByName}${signedByTitle ? ` (${signedByTitle})` : ''}`
		: signedBy;

	return { signedByName, signedByTitle, signedByDisplay };
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id')?.trim();
		if (!id) {
			return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		}

		const { notFound, payload } = await buildInvoicePayload(id);
		if (notFound) {
			return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
		}

		const supabase = getServerSupabase();
		const { data: log, error } = await supabase
			.from('EInvoiceLog' as any)
			.select('payload_hash, signature, signed_at, signed_by, status')
			.eq('mahd', id)
			.maybeSingle();

		if (error) throw error;

		if (!log) {
			return NextResponse.json({ signed: false, reason: 'NOT_SIGNED' });
		}

		const currentHash = hashPayload(payload);
		const valid = currentHash === log.payload_hash;
		const signer = await resolveSignerInfo(log.signed_by);

		return NextResponse.json({
			signed: true,
			valid,
			status: log.status,
			signedBy: log.signed_by,
			signedByName: signer.signedByName,
			signedByTitle: signer.signedByTitle,
			signedByDisplay: signer.signedByDisplay,
			signedAt: log.signed_at,
			hash: log.payload_hash,
			signature: log.signature,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const id = (body?.id || body?.mahd || body?.MaHD) as string | undefined;
		if (!id) {
			return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		}

		const secret = process.env.EINVOICE_SIGN_SECRET as string | undefined;
		if (!secret) {
			return NextResponse.json(
				{ error: 'Missing EINVOICE_SIGN_SECRET on server. Please configure it in environment variables.' },
				{ status: 500 },
			);
		}

		// Authorization: only logged-in users with appropriate role may sign
		const session = await getSessionFromCookies();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (!hasAnyRole(session.vaiTro, [UserRole.ADMIN, UserRole.ACCOUNTANT])) {
			return NextResponse.json(
				{ error: 'Bạn không có quyền ký số hóa đơn. Chỉ Quản lý kho hoặc Kế toán được phép ký.' },
				{ status: 403 },
			);
		}

		const { notFound, payload } = await buildInvoicePayload(id);
		if (notFound) {
			return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
		}
		// Business rule: only allow signing when invoice is paid
		const status = (payload as any)?.invoice?.TrangThai as string | undefined;
		if (status !== 'Đã thanh toán') {
			return NextResponse.json(
				{ error: 'Chỉ được ký số cho hóa đơn đã thanh toán.' },
				{ status: 400 },
			);
		}

		const hash = hashPayload(payload);
		const signature = signHash(hash, secret);

		const signedBy = session.tenDangNhap || session.maTk;
		const signer = await resolveSignerInfo(signedBy);

		const supabase = getServerSupabase();
		const { data, error } = await supabase
			.from('EInvoiceLog' as any)
			.upsert(
				{
					mahd: id,
					payload_hash: hash,
					signature,
					status: 'SIGNED',
					signed_by: signedBy,
					// signed_at: default NOW()
					raw_payload: payload as any,
				},
				{ onConflict: 'mahd' },
			)
			.select('payload_hash, signature, signed_at, signed_by, status')
			.single();

		if (error) throw error;

		return NextResponse.json({
			signed: true,
			valid: true,
			status: data.status,
			signedBy: data.signed_by,
			signedByName: signer.signedByName,
			signedByTitle: signer.signedByTitle,
			signedByDisplay: signer.signedByDisplay,
			signedAt: data.signed_at,
			hash: data.payload_hash,
			signature: data.signature,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

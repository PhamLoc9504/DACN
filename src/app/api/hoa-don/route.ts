import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD, logActivity } from '@/lib/auditLog';

function toCamel(row: any) {
	return {
		MaHD: row.mahd,
		NgayLap: row.ngaylap,
		MaKH: row.makh,
		TongTien: row.tongtien,
		TrangThai: row.trangthai,
		SoPX: row.sopx,
		SoPN: row.sopn,
		MaNV: row.manv,
	};
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1', 10);
		const limit = parseInt(searchParams.get('limit') || '10', 10);
		const status = searchParams.get('status')?.trim();
		const id = searchParams.get('id')?.trim();
		const q = searchParams.get('q')?.trim();
		const fromDate = searchParams.get('from')?.trim();
		const toDate = searchParams.get('to')?.trim();
		const minAmount = searchParams.get('minAmount')?.trim();
		const maxAmount = searchParams.get('maxAmount')?.trim();
		const supabase = getServerSupabase();

		if (id) {
			const { data, error } = await supabase.from('hoadon').select('*').eq('mahd', id).limit(1).maybeSingle();
			if (error) throw error;
			if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
			return NextResponse.json({ data: toCamel(data) });
		}

		const from = (page - 1) * limit;
		const to = from + limit - 1;
		let query = supabase.from('hoadon').select('*', { count: 'exact' }).order('ngaylap', { ascending: false });
		
		if (status) {
			query = query.eq('trangthai', status);
		}
		if (q) {
			query = query.or(`mahd.ilike.%${q}%,makh.ilike.%${q}%`);
		}
		if (fromDate) {
			query = query.gte('ngaylap', fromDate);
		}
		if (toDate) {
			query = query.lte('ngaylap', toDate);
		}
		if (minAmount) {
			query = query.gte('tongtien', minAmount);
		}
		if (maxAmount) {
			query = query.lte('tongtien', maxAmount);
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

        // Resolve MaNV from session (account -> employee)
        let resolvedMaNV: string | null = body.MaNV ?? null;
        const session = await getSessionFromCookies();
        if (session) {
            const { data: tk } = await supabase
                .from('taikhoan')
                .select('manv')
                .eq('matk', session.maTk)
                .limit(1)
                .maybeSingle();
            if (tk?.manv) resolvedMaNV = tk.manv as string;
        }

        // Generate MaHD like HDxx if missing
        let newMaHD: string | undefined = body.MaHD;
        if (!newMaHD) {
            const { data: last } = await supabase
                .from('hoadon')
                .select('mahd')
                .ilike('mahd', 'HD%')
                .order('mahd', { ascending: false })
                .limit(1)
                .maybeSingle();
            const lastNum = last?.mahd ? (parseInt(String(last.mahd).replace(/[^0-9]/g, ''), 10) || 0) : 0;
            const nextNum = lastNum + 1;
            const padded = String(nextNum).padStart(2, '0');
            newMaHD = `HD${padded}`;
        }

        // Compute TongTien from voucher details if provided
        let computedTongTien: number | null = null;
        if (body.SoPN) {
            const { data: details, error: errCT } = await supabase
                .from('ctphieunhap')
                .select('tongtien')
                .eq('sopn', body.SoPN);
            if (errCT) throw errCT;
            computedTongTien = (details || []).reduce((s: number, r: any) => s + (r.tongtien || 0), 0);
        } else if (body.SoPX) {
            const { data: details, error: errCT } = await supabase
                .from('ctphieuxuat')
                .select('tongtien')
                .eq('sopx', body.SoPX);
            if (errCT) throw errCT;
            computedTongTien = (details || []).reduce((s: number, r: any) => s + (r.tongtien || 0), 0);
        }

        const { data, error } = await supabase
            .from('hoadon')
            .insert({
                mahd: newMaHD,
                ngaylap: body.NgayLap,
                makh: body.SoPN ? null : body.MaKH,
                tongtien: computedTongTien ?? body.TongTien,
                trangthai: body.TrangThai,
                sopx: body.SoPX,
                sopn: body.SoPN,
                manv: resolvedMaNV,
            })
            .select('*')
            .single();
        if (error) {
            await logActivity({
                action: 'TAO',
                table: 'hoadon',
                recordId: newMaHD,
                status: 'LOI',
                error: error.message,
            });
            throw error;
        }
        await logCRUD('TAO', 'hoadon', newMaHD, undefined, toCamel(data));
        return NextResponse.json({ data: toCamel(data) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const id = body.MaHD as string | undefined;
        if (!id) return NextResponse.json({ error: 'Missing MaHD' }, { status: 400 });
        const supabase = getServerSupabase();
        // Lấy giá trị cũ để log
        const { data: oldData } = await supabase.from('hoadon').select('*').eq('mahd', id).maybeSingle();
        const { data, error } = await supabase
            .from('hoadon')
            .update({
                ngaylap: body.NgayLap,
                makh: body.SoPN ? null : body.MaKH,
                tongtien: body.TongTien,
                trangthai: body.TrangThai,
                sopx: body.SoPX,
                sopn: body.SoPN,
                manv: body.MaNV,
            })
            .eq('mahd', id)
            .select('*')
            .single();
        if (error) {
            await logActivity({
                action: 'SUA',
                table: 'hoadon',
                recordId: id,
                status: 'LOI',
                error: error.message,
            });
            throw error;
        }
        await logCRUD('SUA', 'hoadon', id, oldData ? toCamel(oldData) : undefined, toCamel(data));
        return NextResponse.json({ data: toCamel(data) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const supabase = getServerSupabase();
        // Lấy giá trị cũ để log
        const { data: oldData } = await supabase.from('hoadon').select('*').eq('mahd', id).maybeSingle();
        const { error } = await supabase.from('hoadon').delete().eq('mahd', id);
        if (error) {
            await logActivity({
                action: 'XOA',
                table: 'hoadon',
                recordId: id,
                status: 'LOI',
                error: error.message,
            });
            throw error;
        }
        await logCRUD('XOA', 'hoadon', id, oldData ? toCamel(oldData) : undefined);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}



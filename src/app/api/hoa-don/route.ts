import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

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
                makh: body.MaKH,
                tongtien: computedTongTien ?? body.TongTien,
                trangthai: body.TrangThai,
                sopx: body.SoPX,
                sopn: body.SoPN,
                manv: resolvedMaNV,
            })
            .select('*')
            .single();
        if (error) throw error;
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
        const { data, error } = await supabase
            .from('hoadon')
            .update({
                ngaylap: body.NgayLap,
                makh: body.MaKH,
                tongtien: body.TongTien,
                trangthai: body.TrangThai,
                sopx: body.SoPX,
                sopn: body.SoPN,
                manv: body.MaNV,
            })
            .eq('mahd', id)
            .select('*')
            .single();
        if (error) throw error;
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
        const { error } = await supabase.from('hoadon').delete().eq('mahd', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}



import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { encryptText, decryptText } from '@/lib/chatCrypto';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const staffId = url.searchParams.get('staffId');
    if (!staffId) return NextResponse.json({ error: 'Thiếu staffId' }, { status: 400 });

    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();

    const account = await supabase
      .from('taikhoan')
      .select('manv')
      .eq('matk', session.maTk)
      .maybeSingle();

    const currentUserId = account.data?.manv as string | undefined;
    if (!currentUserId) return NextResponse.json({ error: 'Không tìm được nhân viên hiện tại' }, { status: 400 });

    const { data, error } = await supabase
      .from('staff_messages' as any)
      .select('id, sender_id, receiver_id, text, created_at')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${staffId}),and(sender_id.eq.${staffId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (error) throw error;

    const messages = (data ?? []).map((m: any) => ({
      ...m,
      text: decryptText(m.text),
    }));

    return NextResponse.json({ messages, currentUserId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { staffId, text } = await req.json();
    if (!staffId || !text) return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });

    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const supabase = getServerSupabase();

    const account = await supabase
      .from('taikhoan')
      .select('manv')
      .eq('matk', session.maTk)
      .maybeSingle();

    const currentUserId = account.data?.manv as string | undefined;
    if (!currentUserId) return NextResponse.json({ error: 'Không tìm được nhân viên hiện tại' }, { status: 400 });

    const cipherText = encryptText(String(text));

    const { data, error } = await supabase
      .from('staff_messages' as any)
      .insert({
        sender_id: currentUserId,
        receiver_id: staffId,
        text: cipherText,
      })
      .select('id, sender_id, receiver_id, text, created_at')
      .single();

    if (error) throw error;

    const message = {
      ...data,
      text: decryptText(data.text),
    };

    return NextResponse.json({ message, currentUserId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

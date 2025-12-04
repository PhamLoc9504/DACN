import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Thiếu file' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}-${(file as any).name || 'upload'}`;
    const path = `chat/${fileName}`;

    const { error } = await supabase.storage.from('chat-files').upload(path, buffer, {
      contentType: (file as any).type || 'application/octet-stream',
      upsert: false,
    });

    if (error) throw error;

    const { data: publicData } = supabase.storage.from('chat-files').getPublicUrl(path);

    return NextResponse.json({ url: publicData.publicUrl, name: (file as any).name || fileName });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email là bắt buộc' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Tìm user theo email
    const { data: user, error: userError } = await supabase
      .from('NguoiDung')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Không tìm thấy user với email này' }, { status: 404 });
    }

    // Reset mật khẩu về 88888888
    const { error: updateError } = await supabase
      .from('NguoiDung')
      .update({ matkhau: '88888888' })
      .eq('email', email);

    if (updateError) {
      return NextResponse.json({ error: 'Reset mật khẩu thất bại' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Mật khẩu đã được reset về: 88888888',
      success: true 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}

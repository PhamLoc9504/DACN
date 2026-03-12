import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    // Kiểm tra xem request có body không trước khi parse
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: 'Body không được để trống' }, { status: 400 });
    }
    
    const body = JSON.parse(text);
    const { email } = body;

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
    console.error("Lỗi API reset-password:", error); // Xem log ở terminal để biết lỗi thật
    return NextResponse.json({ error: 'Lỗi định dạng dữ liệu' }, { status: 500 });
  }
}

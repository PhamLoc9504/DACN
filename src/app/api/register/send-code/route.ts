import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { sendVerificationEmail } from '@/lib/mail';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Thiếu email' }, { status: 400 });
    const normalized = String(email).toLowerCase().trim();
    const code = generateCode();

    const supabase = getServerSupabase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from('email_verification_codes').upsert({
      email: normalized,
      code,
      expires_at: expiresAt,
      used: false,
    });
    if (error) throw error;

    await sendVerificationEmail(normalized, code);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

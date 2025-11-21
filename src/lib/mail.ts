import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || user;

export async function sendVerificationEmail(to: string, code: string) {
  if (!host || !user || !pass || !from) {
    console.warn('SMTP env vars are missing, skip sending email. Code =', code, 'for', to);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = 'Mã xác nhận đăng ký kho hàng';
  const text = `Mã xác nhận của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`;

  await transporter.sendMail({ from, to, subject, text });
}

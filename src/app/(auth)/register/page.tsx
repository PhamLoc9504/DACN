'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [fullName, setFullName] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [okMsg, setOkMsg] = useState<string | null>(null);
	const [agreedToTerms, setAgreedToTerms] = useState(false);

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setOkMsg(null);
		if (!agreedToTerms) {
			setError('Vui lòng đồng ý với Điều khoản Sử dụng và Chính sách Bảo mật');
			return;
		}
		if (password !== confirm) {
			setError('Mật khẩu nhập lại không khớp');
			return;
		}
		setLoading(true);
		try {
			const res = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, fullName }),
			});
			const body = await res.json();
			if (!res.ok) {
				setError(body.error || 'Đăng ký thất bại');
				return;
			}
			setOkMsg('Đăng ký thành công! Đang chuyển hướng...');
			setTimeout(() => router.replace('/login'), 1500);
		} catch (err: any) {
			setError(err.message || 'Đăng ký thất bại');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center text-[#4e3c33]">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#f5ebe0] p-8">
				<div className="text-center mb-6">
					<div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-[#e08d86] to-[#f3bca9] flex items-center justify-center text-white font-bold shadow-md">K</div>
					<h1 className="mt-3 text-2xl font-semibold text-[#d47b8a]">Đăng ký tài khoản</h1>
					<p className="text-sm text-[#9c8579] mt-1">Tạo tài khoản để sử dụng hệ thống</p>
				</div>
				<form onSubmit={handleRegister} className="space-y-5">
					<div>
						<label className="block text-sm mb-1 text-gray-500">Email</label>
						<input type="email" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vd: nv01@congty.com" />
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Họ tên</label>
						<input type="text" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Họ và tên nhân viên" />
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Mật khẩu</label>
						<input type="password" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Nhập lại mật khẩu</label>
						<input type="password" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
					</div>
					<div className="flex items-start gap-2">
						<input type="checkbox" id="agree-terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1" />
						<label htmlFor="agree-terms" className="text-sm text-gray-600">Tôi đồng ý với các điều khoản sử dụng</label>
					</div>
					{error && <p className="text-sm text-red-600 text-center">{error}</p>}
					{okMsg && <p className="text-sm text-green-600 text-center">{okMsg}</p>}
					<button type="submit" className="w-full bg-gradient-to-r from-[#e08d86] to-[#f3b8a8] text-white font-medium rounded-xl py-2 hover:brightness-105 transition disabled:opacity-60" disabled={loading || !agreedToTerms}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</button>
				</form>
				<div className="mt-5 text-sm text-center text-[#8b7065]">Đã có tài khoản? <a href="/login" className="text-[#d47b8a] font-medium hover:underline hover:text-[#c06c7a] transition">Đăng nhập</a></div>
			</div>
		</div>
	);
}

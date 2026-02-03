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
		<div className="min-h-screen bg-gradient-to-br from-[#f2f4fb] via-[#e6ebf7] to-[#dbe1f0] flex items-center justify-center px-4">
			<div className="w-full max-w-sm bg-[#eef1f8]/85 backdrop-blur-xl rounded-[32px] shadow-[24px_24px_48px_-28px_rgba(79,90,119,0.45),-18px_-18px_36px_rgba(255,255,255,0.9)] border border-white/60 px-8 py-10">
				<div className="text-center mb-9">
					<div className="mx-auto h-12 w-12 rounded-full bg-white shadow-[10px_10px_24px_rgba(150,167,198,0.4),-10px_-10px_24px_rgba(255,255,255,0.95)] flex items-center justify-center text-[#6b7aa6] text-xl">
						<span className="i-ph-user-plus"></span>
					</div>
					<h1 className="mt-4 text-2xl font-semibold text-[#3d4766]">Create account</h1>
					<p className="text-sm text-[#7681a6] mt-1">Join to manage your warehouse</p>
				</div>

				<form onSubmit={handleRegister} className="space-y-4">
					<div className="space-y-2">
						<label className="block text-sm text-[#6b7aa6]">Email address</label>
						<div className="relative">
							<input
								type="email"
								className="w-full rounded-2xl bg-[#eef1f8] text-[#3d4766] px-4 py-3 shadow-[8px_8px_18px_rgba(150,167,198,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] border border-transparent focus:border-[#9fb4ff] focus:outline-none focus:ring-2 focus:ring-[#cfd8ff]"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								placeholder="Email address"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="block text-sm text-[#6b7aa6]">Full name</label>
						<input
							type="text"
							className="w-full rounded-2xl bg-[#eef1f8] text-[#3d4766] px-4 py-3 shadow-[8px_8px_18px_rgba(150,167,198,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] border border-transparent focus:border-[#9fb4ff] focus:outline-none focus:ring-2 focus:ring-[#cfd8ff]"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							required
							placeholder="Your full name"
						/>
					</div>

					<div className="space-y-2">
						<label className="block text-sm text-[#6b7aa6]">Password</label>
						<input
							type="password"
							className="w-full rounded-2xl bg-[#eef1f8] text-[#3d4766] px-4 py-3 shadow-[8px_8px_18px_rgba(150,167,198,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] border border-transparent focus:border-[#9fb4ff] focus:outline-none focus:ring-2 focus:ring-[#cfd8ff]"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							placeholder="Password"
						/>
					</div>

					<div className="space-y-2">
						<label className="block text-sm text-[#6b7aa6]">Confirm password</label>
						<input
							type="password"
							className="w-full rounded-2xl bg-[#eef1f8] text-[#3d4766] px-4 py-3 shadow-[8px_8px_18px_rgba(150,167,198,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] border border-transparent focus:border-[#9fb4ff] focus:outline-none focus:ring-2 focus:ring-[#cfd8ff]"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							required
							placeholder="Confirm password"
						/>
					</div>

					<div className="flex items-start gap-2 pt-1">
						<input
							type="checkbox"
							id="agree-terms"
							checked={agreedToTerms}
							onChange={(e) => setAgreedToTerms(e.target.checked)}
							className="mt-1 accent-[#9fb4ff]"
						/>
						<div className="text-sm text-[#6b7aa6] leading-relaxed">
							<label htmlFor="agree-terms" className="cursor-pointer">
								I agree to the Terms of Service
							</label>
							{' '}
							<button
								type="button"
								onClick={() => router.push('/register/terms')}
								className="text-[#7587d2] underline underline-offset-2 hover:text-[#5e72c5] font-medium"
							>
								View details
							</button>
						</div>
					</div>

					{error && <p className="text-sm text-red-500 text-center">{error}</p>}
					{okMsg && <p className="text-sm text-emerald-500 text-center">{okMsg}</p>}

					<button
						type="submit"
						className="w-full rounded-2xl bg-[#e9edf5] text-[#3d4766] font-semibold py-3 shadow-[10px_10px_22px_rgba(146,163,184,0.27),-10px_-10px_22px_rgba(255,255,255,0.95)] hover:shadow-[14px_14px_26px_rgba(146,163,184,0.30),-12px_-12px_22px_rgba(255,255,255,0.97)] transition disabled:opacity-60"
						disabled={loading || !agreedToTerms}
					>
						{loading ? 'Processing...' : 'Sign Up'}
					</button>
				</form>

				<div className="mt-6 text-sm text-center text-[#6b7aa6]">
					Already have an account?{' '}
					<a href="/login" className="text-[#7587d2] font-semibold hover:underline">
						Sign in
					</a>
				</div>

				<div className="mt-6 flex items-center gap-3 text-xs text-[#7a86aa]">
					<div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#cdd4e6] to-transparent" />
					<span>OR CONTINUE WITH</span>
					<div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#cdd4e6] to-transparent" />
				</div>

				<div className="mt-4 grid grid-cols-3 gap-3 text-[#6b7aa6]">
					<button
						type="button"
						className="h-10 rounded-xl bg-[#eef1f8] shadow-[6px_6px_14px_rgba(146,163,184,0.2),-6px_-6px_14px_rgba(255,255,255,0.9)] hover:brightness-105 transition"
					>
						G
					</button>
					<button
						type="button"
						className="h-10 rounded-xl bg-[#eef1f8] shadow-[6px_6px_14px_rgba(146,163,184,0.2),-6px_-6px_14px_rgba(255,255,255,0.9)] hover:brightness-105 transition"
					>
						F
					</button>
					<button
						type="button"
						className="h-10 rounded-xl bg-[#eef1f8] shadow-[6px_6px_14px_rgba(146,163,184,0.2),-6px_-6px_14px_rgba(255,255,255,0.9)] hover:brightness-105 transition"
					>
						T
					</button>
				</div>
			</div>
		</div>
	);
}

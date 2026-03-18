'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			});
			const body = await res.json();
			if (!res.ok) {
				setError(body.error || 'Đăng nhập thất bại');
				return;
			}
            localStorage.setItem('app_session', JSON.stringify(body));
            // thông báo cho các components đang chạy cập nhật lại
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('app:session-updated'));
            }
            router.replace('/');
		} catch (err: any) {
			setError(err.message || 'Đăng nhập thất bại');
		} finally {
			setLoading(false);
		}
	}

	async function handleForgotPassword() {
		if (!username) {
			setError('Vui lòng nhập email trước khi reset mật khẩu');
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: username }),
			});
			
			const body = await res.json();
			if (!res.ok) {
				setError(body.error || 'Reset mật khẩu thất bại');
				return;
			}
			setError('Mật khẩu đã được reset về: 88888888');
		} catch (err: any) {
			setError(err.message || 'Reset mật khẩu thất bại');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#f2f4fb] via-[#e6ebf7] to-[#dbe1f0] flex items-center justify-center px-4">
			<div className="w-full max-w-sm bg-[#eef1f8]/85 backdrop-blur-xl rounded-[32px] shadow-[24px_24px_48px_-28px_rgba(79,90,119,0.45),-18px_-18px_36px_rgba(255,255,255,0.9)] border border-white/60 px-8 py-10">
				<div className="text-center mb-9">
					<div className="mx-auto h-12 w-12 rounded-full bg-white shadow-[10px_10px_24px_rgba(150,167,198,0.4),-10px_-10px_24px_rgba(255,255,255,0.95)] flex items-center justify-center text-[#6b7aa6] text-xl">
						<span className="i-ph-user"></span>
					</div>
					<h1 className="mt-4 text-2xl font-semibold text-[#3d4766]">Welcome back</h1>
					<p className="text-sm text-[#7681a6] mt-1">Please sign in to continue</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-5">
					<div className="space-y-2">
						<label className="block text-sm text-[#6b7aa6]">Email address</label>
						<input
							type="email"
							className="w-full rounded-2xl bg-[#eef1f8] text-[#3d4766] px-4 py-3 shadow-[8px_8px_18px_rgba(150,167,198,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)] border border-transparent focus:border-[#9fb4ff] focus:outline-none focus:ring-2 focus:ring-[#cfd8ff]"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							placeholder="Email address"
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

					{error && (
						<div className="p-3 rounded-2xl text-sm text-center bg-red-50 border border-red-200 text-red-600">
							{error}
						</div>
					)}

					<button
						type="submit"
						className="w-full rounded-2xl bg-[#e9edf5] text-[#3d4766] font-semibold py-3 shadow-[10px_10px_22px_rgba(146,163,184,0.27),-10px_-10px_22px_rgba(255,255,255,0.95)] hover:shadow-[14px_14px_26px_rgba(146,163,184,0.30),-12px_-12px_22px_rgba(255,255,255,0.97)] transition disabled:opacity-60"
						disabled={loading}
					>
						{loading ? 'Đang đăng nhập...' : 'Sign In'}
					</button>
				</form>

				<div className="mt-4 text-center">
					<button
						type="button"
						onClick={handleForgotPassword}
						className="text-[#7587d2] text-sm hover:underline"
						disabled={loading}
					>
						Quên mật khẩu?
					</button>
				</div>

				<div className="mt-6 text-sm text-center text-[#6b7aa6]">
					Don’t have an account?{' '}
					<a href="/register" className="text-[#7587d2] font-semibold hover:underline">
						Sign up
					</a>
				</div>

				{/* Demo Account Info */}
				<div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
					<div className="flex items-center gap-2 mb-2">
						<span className="text-blue-600 text-sm">🔑</span>
						<h3 className="text-sm font-semibold text-blue-800">Tài khoản demo</h3>
					</div>
					<div className="space-y-1 text-xs text-gray-700">
						<div className="flex justify-between">
							<span className="font-medium">Email:</span>
							<button
								type="button"
								onClick={() => setUsername('minhloc090504@gmail.com')}
								className="text-blue-600 hover:underline ml-2"
							>
								minhloc090504@gmail.com
							</button>
						</div>
						<div className="flex justify-between">
							<span className="font-medium">Mật khẩu:</span>
							<button
								type="button"
								onClick={() => setPassword('loc090504')}
								className="text-blue-600 hover:underline ml-2"
							>
								loc090504
							</button>
						</div>
					</div>
					<p className="text-xs text-blue-600 mt-2 italic">
						Click vào tài khoản/mật khẩu để điền tự động
					</p>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
			<LoginContent />
		</Suspense>
	);
}



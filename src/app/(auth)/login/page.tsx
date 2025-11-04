'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
	const router = useRouter();
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

	return (
		<div className="min-h-screen flex items-center justify-center text-[#4e3c33]">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#f5ebe0] p-8">
				<div className="text-center mb-6">
					<div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-[#e08d86] to-[#f3bca9] flex items-center justify-center text-white font-bold shadow-md">
						K
					</div>
					<h1 className="mt-3 text-2xl font-semibold text-[#d47b8a]">Đăng nhập hệ thống</h1>
					<p className="text-sm text-[#9c8579] mt-1">Hệ thống quản lý kho hàng</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-5">
					<div>
						<label className="block text-sm mb-1 text-gray-500">Tên đăng nhập</label>
						<input type="text" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Nhập tên đăng nhập..." />
					</div>
					<div>
						<label className="block text-sm mb-1 text-gray-500">Mật khẩu</label>
						<input type="password" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Nhập mật khẩu..." />
					</div>
					{error && <p className="text-sm text-red-600 text-center">{error}</p>}
					<button type="submit" className="w-full bg-gradient-to-r from-[#e08d86] to-[#f3b8a8] text-white font-medium rounded-xl py-2 hover:brightness-105 transition disabled:opacity-60" disabled={loading}>
						{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
					</button>
				</form>

				<div className="mt-5 text-sm text-center text-[#8b7065]">
					Chưa có tài khoản?{' '}
					<a href="/register" className="text-[#d47b8a] font-medium hover:underline hover:text-[#c06c7a] transition">Đăng ký</a>
				</div>
			</div>
		</div>
	);
}



'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AppSession } from '@/lib/session';

const items = [
	{ href: '/', label: '📊 Dashboard' },
	{ href: '/hang-hoa', label: '📦 Hàng hóa' },
	{ href: '/nhap-hang', label: '📥 Nhập hàng' },
	{ href: '/xuat-hang', label: '📤 Xuất hàng' },
	{ href: '/hoa-don', label: '🧾 Hóa đơn' },
	{ href: '/khach-hang', label: '👥 Khách hàng' },
	{ href: '/nha-cung-cap', label: '🏭 Nhà cung cấp' },
	{ href: '/nhan-vien', label: '👔 Nhân viên' },
	{ href: '/bao-cao', label: '📈 Báo cáo' },
	{ href: '/van-chuyen', label: '🚚 Vận chuyển' },
];

export default function Sidebar({ session }: { session?: AppSession | null }) {
	const pathname = usePathname();

	return (
		<aside className="hidden md:flex md:w-72 lg:w-72 xl:w-80 shrink-0 flex-col bg-gradient-to-b from-[#fffaf6] to-[#fff2ee] border-r border-[#e7d8c8] shadow-[10px_0_24px_-12px_rgba(0,0,0,0.15)] ring-1 ring-[#f1e6d9]">
			{/* Header */}
			<div className="px-6 py-5 border-b border-[#eadbcb] bg-[#fff7f2]/70 backdrop-blur-sm">
				<div className="font-semibold text-xl tracking-tight text-[#e28c8c]">
					📦 Kho Hàng
				</div>
				<div className="text-xs text-[#c9a69d]">Warehouse Management System</div>
			</div>

			{/* Nav Items */}
			<nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
				{items.map((i) => {
					const active = pathname === i.href;
					return (
						<Link
							key={i.href}
							href={i.href}
							className={cn(
								'group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 border',
								active
									? 'bg-[#fde7e2] text-[#d46b6b] shadow-sm border-[#efc9c2] ring-1 ring-[#f7ddd6]'
									: 'text-[#7b6a60] hover:text-[#d46b6b] hover:bg-[#fff0ee] border-transparent hover:border-[#f3ddd6] hover:shadow-sm'
							)}
						>
							{/* Left accent for active item */}
							{active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-[#e28c8c] shadow-[0_0_0_1px_rgba(226,140,140,0.25)]" />}
							<span>{i.label}</span>
							{active && (
								<span className="ml-auto h-2 w-2 rounded-full bg-[#e28c8c] shadow-inner animate-pulse" />
							)}
						</Link>
					);
				})}

				{/* Footer / Login or Role */}
				<div className="pt-4 mt-4 border-t border-[#eadbcb]">
					{session ? (
						<div className="flex items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium text-[#8d7a70] bg-[#fff3ef] border border-[#ecd9c7] ring-1 ring-[#f3e6da]">
							<span className="truncate">Vai trò</span>
							<span className="ml-2 rounded-md px-2 py-0.5 bg-[#fde7e2] text-[#d46b6b] shadow-sm border border-[#efc9c2]">
								{session.vaiTro}
							</span>
						</div>
					) : (
						<Link
							href="/login"
							className="block rounded-xl px-3.5 py-2 text-sm font-medium text-[#8d7a70] hover:text-[#d46b6b] hover:bg-[#fff0ee] transition-all border border-transparent hover:border-[#f3ddd6] hover:shadow-sm"
						>
							🔐 Đăng nhập
						</Link>
					)}
				</div>
			</nav>

			{/* Footer */}
			<div className="px-5 py-3 border-t border-[#eadbcb] text-xs text-[#c9a69d]">
				© {new Date().getFullYear()} MindWarehouse Pro
			</div>
		</aside>
	);
}

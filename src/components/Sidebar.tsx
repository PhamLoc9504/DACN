'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AppSession } from '@/lib/session';
import { canAccessFeature, FeatureKey, getRoleDisplayName, PermissionLevel } from '@/lib/roles';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Receipt,
  MessageSquare,
  Users,
  ClipboardCheck,
  Building2,
  UserCog,
  BarChart3,
  Truck,
  Settings,
  Shield,
  Database,
  Monitor,
  FileText,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Bell,
  HelpCircle,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SidebarItem = {
	href: string;
	label: string;
	feature: FeatureKey;
	required?: PermissionLevel;
  icon?: React.ReactNode;
  badge?: string | number;
};

const dashboardItems: SidebarItem[] = [
	{ href: '/', label: 'Dashboard Doanh Thu', feature: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
	{ href: '/thong-ke-khach-hang', label: 'Dashboard Khách Hàng', feature: 'dashboard', icon: <Users className="w-4 h-4" /> },
];

const items: SidebarItem[] = [
	{ href: '/hang-hoa', label: 'Hàng Hóa', feature: 'inventory', icon: <Package className="w-4 h-4" /> },
	{ href: '/nhap-hang', label: 'Nhập Hàng', feature: 'import', required: 'edit', icon: <ArrowDownToLine className="w-4 h-4" /> },
	{ href: '/xuat-hang', label: 'Xuất Hàng', feature: 'export', required: 'edit', icon: <ArrowUpFromLine className="w-4 h-4" /> },
	{ href: '/hoa-don', label: 'Hóa Đơn', feature: 'invoice', required: 'view', icon: <Receipt className="w-4 h-4" /> },
	{ href: '/kenh-chat', label: 'Kênh Chat', feature: 'dashboard', required: 'none', icon: <MessageSquare className="w-4 h-4" />, badge: "3" },
	{ href: '/cham-soc-khach-hang', label: 'Chăm Sóc KH', feature: 'customer-management', icon: <Users className="w-4 h-4" /> },
	{ href: '/kiem-ke-kho', label: 'Kiểm Kê Kho', feature: 'inventory', icon: <ClipboardCheck className="w-4 h-4" /> },
	{ href: '/nha-cung-cap', label: 'Nhà Cung Cấp', feature: 'supplier-management', required: 'view', icon: <Building2 className="w-4 h-4" /> },
	{ href: '/nhan-vien', label: 'Nhân Viên', feature: 'staff-management', required: 'edit', icon: <UserCog className="w-4 h-4" /> },
	{ href: '/bao-cao', label: 'Báo Cáo', feature: 'reports', required: 'view', icon: <BarChart3 className="w-4 h-4" /> },
	{ href: '/van-chuyen', label: 'Vận Chuyển', feature: 'shipping', required: 'view', icon: <Truck className="w-4 h-4" /> },
];

const systemItems: SidebarItem[] = [
	{ href: '/quan-ly-tai-khoan', label: 'Quản Lý Tài Khoản', feature: 'account-management', required: 'view', icon: <Shield className="w-4 h-4" /> },
	{ href: '/nhat-ky', label: 'Nhật Ký Hệ Thống', feature: 'audit-log', required: 'view', icon: <FileText className="w-4 h-4" /> },
	{ href: '/giam-sat-he-thong', label: 'Giám Sát Hệ Thống', feature: 'system-monitor', required: 'view', icon: <Monitor className="w-4 h-4" /> },
	{ href: '/backup', label: 'Backup & Restore', feature: 'backup', required: 'view', icon: <Database className="w-4 h-4" /> },
	{ href: '/cau-hinh-he-thong', label: 'Cấu Hình Hệ Thống', feature: 'system-settings', required: 'view', icon: <Settings className="w-4 h-4" /> },
];

export default function Sidebar({ session }: { session?: AppSession | null }) {
	const pathname = usePathname();
	const role = session?.vaiTro;
	const visibleDashboard = session
		? dashboardItems.filter((item) => canAccessFeature(role, item.feature, item.required ?? 'view'))
		: dashboardItems;
	const visiblePrimary = session
		? items.filter((item) => canAccessFeature(role, item.feature, item.required ?? 'view'))
		: items;
	const visibleSystem = session
		? systemItems.filter((item) => canAccessFeature(role, item.feature, item.required ?? 'view'))
		: [];
	const showSystem = visibleSystem.length > 0;
	const isDashboardRoute = visibleDashboard.some((i) => pathname === i.href);
	const [openDashboard, setOpenDashboard] = useState(isDashboardRoute);
  const [openSystem, setOpenSystem] = useState(false);

  const handleLogout = () => {
    // Handle logout logic
  };

	return (
		<aside className="hidden md:flex md:w-64 lg:w-72 xl:w-80 shrink-0 flex-col px-4 py-6 bg-gradient-to-b from-slate-50 to-gray-100">
			<div className="flex-1 rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50 border border-white/20 flex flex-col overflow-hidden">
				{/* Header with gradient */}
				<div className="relative px-6 py-5 border-b border-slate-100/50 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full translate-y-12 -translate-x-12"></div>
          </div>
          
          <div className="relative flex items-center gap-3">
            <motion.div 
              className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Zap className="w-5 h-5" />
            </motion.div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-800">
                Warehouse Pro
              </div>
              <div className="text-xs text-slate-500/80 font-medium">Intelligent Management</div>
            </div>
          </div>
        </div>

				{/* User Profile Section */}
        {session && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 py-4 border-b border-slate-100/50 bg-gradient-to-r from-slate-50 to-gray-50/50"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-md">
                  {session.tenDangNhap?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-800 truncate">
                  {session.tenDangNhap || 'Người dùng'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {getRoleDisplayName(session.vaiTro)}
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </motion.div>
        )}

				{/* Nav Items */}
				<nav className="p-4 space-y-1 flex-1 overflow-y-auto scrollbar-thin">
					{/* Dashboard group */}
					{visibleDashboard.length > 0 && (
						<div className="space-y-1 mb-3">
							<button
								type="button"
								onClick={() => setOpenDashboard((v) => !v)}
								className={cn(
									'group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 hover:bg-slate-50/80',
									isDashboardRoute || openDashboard
										? 'text-blue-600 bg-blue-50/50'
										: 'text-slate-500 hover:text-slate-700'
								)}
							>
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isDashboardRoute || openDashboard
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                )}>
                  <LayoutDashboard className="w-4 h-4" />
                </div>
								<span>Dashboard</span>
								{openDashboard ? (
                  <ChevronDown className="ml-auto w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-400" />
                )}
							</button>
							<AnimatePresence>
								{openDashboard && (
									<motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 pl-9"
                  >
										{visibleDashboard.map((i) => {
											const active = pathname === i.href;
											return (
												<Link
													key={i.href}
													href={i.href}
													className={cn(
														'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
														active
															? 'text-blue-600 bg-blue-50'
															: 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
													)}
												>
													{active && (
														<motion.div 
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-blue-500"
                                                            />
													)}
													<span className="text-slate-400">{i.icon}</span>
													<span className="flex-1">{i.label}</span>
												</Link>
											);
										})}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}

					{visiblePrimary.map((i) => {
						const active = pathname === i.href;
						return (
							<Link
								key={i.href}
								href={i.href}
								className={cn(
									'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-slate-50/80',
									active
										? 'text-blue-600 bg-blue-50/50'
										: 'text-slate-600 hover:text-slate-700'
								)}
							>
								{active && (
									<motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-blue-500"
                  />
								)}
								<div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  active
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                )}>
									{i.icon}
								</div>
								<span className="flex-1">{i.label}</span>
                {i.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                    {i.badge}
                  </span>
                )}
							</Link>
						);
					})}

					{/* Quản lý hệ thống */}
					{showSystem && (
						<div className="space-y-1 pt-4 mt-2 border-t border-slate-100/50">
							<button
								type="button"
								onClick={() => setOpenSystem((v) => !v)}
								className={cn(
									'group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 hover:bg-slate-50/80',
									openSystem
										? 'text-slate-800'
										: 'text-slate-500 hover:text-slate-700'
								)}
							>
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  openSystem
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-600'
                )}>
                  <Settings className="w-4 h-4" />
                </div>
								<span>Quản Lý Hệ Thống</span>
								{openSystem ? (
                  <ChevronDown className="ml-auto w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-400" />
                )}
							</button>
							<AnimatePresence>
								{openSystem && (
									<motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 pl-9"
                  >
										{visibleSystem.map((item) => {
											const active = pathname === item.href;
											return (
												<Link
													key={item.href}
													href={item.href}
													className={cn(
														'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
														active
															? 'text-blue-600 bg-blue-50'
															: 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
													)}
												>
													{active && (
														<motion.div 
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-blue-500"
                                                            />
													)}
													<span className="text-slate-400">{item.icon}</span>
													<span className="flex-1">{item.label}</span>
												</Link>
											);
										})}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}
				</nav>

				{/* Footer */}
				<div className="px-5 py-4 border-t border-slate-100/50 bg-gradient-to-r from-slate-50 to-gray-50/50">
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                    <span className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {getRoleDisplayName(session.vaiTro)}
                    </span>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <User className="w-4 h-4" />
              Đăng Nhập
            </Link>
          )}
          
          <div className="mt-4 pt-3 border-t border-slate-100/50 text-center">
            <div className="text-[10px] text-slate-400/70 font-medium">
              &copy; {new Date().getFullYear()} Warehouse Pro v2.0
            </div>
            <div className="text-[9px] text-slate-400/50 mt-1">
              Intelligent Warehouse Management System
            </div>
          </div>
        </div>
			</div>
		</aside>
	);
}
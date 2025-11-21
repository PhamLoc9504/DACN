'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import type { AppSession } from '@/lib/session';
import { getRoleDisplayName } from '@/lib/roles';

export default function AppShell({ children, session }: { children: React.ReactNode; session?: AppSession | null }) {
  const [clientSession, setClientSession] = useState<AppSession | null | undefined>(session);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const openTimerRef = useRef<number | undefined>(undefined);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const pathname = usePathname();
  const isAuth = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  function readClientSession() {
    try {
      const raw = window.localStorage.getItem('app_session');
      if (raw) {
        const parsed = JSON.parse(raw) as AppSession;
        setClientSession(parsed);
      } else {
        setClientSession(null);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    readClientSession();
  }, [pathname]);

  useEffect(() => {
    if (clientSession?.maTk) {
      setAvatarUrl(`/uploads/avatars/${clientSession.maTk}.png`);
    } else {
      setAvatarUrl(null);
    }
  }, [clientSession?.maTk]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'app_session') readClientSession();
    };
    const onCustom = () => readClientSession();
    const onAvatar = (e: any) => {
      const url = e?.detail?.url as string | undefined;
      if (url) setAvatarUrl(url + '?t=' + Date.now());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('app:session-updated', onCustom as EventListener);
    window.addEventListener('app:avatar-updated', onAvatar as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app:session-updated', onCustom as EventListener);
      window.removeEventListener('app:avatar-updated', onAvatar as EventListener);
    };
  }, []);

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fe]">
      <Sidebar session={clientSession ?? session ?? null} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-gradient-to-r from-[#5e72e4] to-[#825ee4] shadow-md">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">K</div>
              <div>
                <div className="font-semibold tracking-tight text-white text-base">Hệ thống quản lý kho hàng</div>
                <div className="text-xs text-white/80">Warehouse Management System</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm text-white">
              <span className="px-3 py-1 rounded-md bg-white/10 border border-white/20 font-medium shadow-sm">
                🇻🇳 VI
              </span>
              {clientSession ? (
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
                    openTimerRef.current = window.setTimeout(() => setMenuOpen(true), 100);
                  }}
                  onMouseLeave={() => {
                    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
                    closeTimerRef.current = window.setTimeout(() => setMenuOpen(false), 180);
                  }}
                >
                  <button className="px-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#5e72e4] font-semibold overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-6 w-6 object-cover" onError={() => setAvatarUrl(null)} />
                      ) : (
                        clientSession.tenDangNhap?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </span>
                    <span className="whitespace-nowrap">
                      {clientSession.tenDangNhap} - {getRoleDisplayName(clientSession.vaiTro)}
                    </span>
                  </button>
                  <div className={`${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'} transition-opacity absolute right-0 mt-2 w-48 rounded-md shadow-lg border border-slate-100 bg-white text-slate-700 z-50`}>
                    <div className="py-1 text-sm">
                      <a href="/profile" className="block px-3 py-2 text-[#6f5a50] hover:bg-[#fff0ee] hover:text-[#d46b6b]">Xem thông tin</a>
                      <form action="/api/logout" method="post">
                        <button className="w-full text-left block px-3 py-2 text-[#6f5a50] hover:bg-[#fff0ee] hover:text-[#d46b6b]">Đăng xuất</button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <a href="/login" className="px-3 py-1.5 rounded-md bg-white/10 text-white font-medium text-sm hover:bg-white/15 transition">
                  Đăng nhập
                </a>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 bg-[#f8f9fe] min-w-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </div>

        <footer className="border-t border-[#f6e5db] bg-gradient-to-r from-[#fff9f6] to-[#fff5f0] py-4 shadow-inner">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9b8376]">
              <div className="flex flex-wrap items-center gap-4 justify-center">
                <span> 2023 MindWarehouse Pro — All rights reserved.</span>
                <span className="hidden sm:inline">|</span>
              </div>
              <span className="text-[#b59788]">Powered by <strong>Next.js + Supabase</strong></span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}



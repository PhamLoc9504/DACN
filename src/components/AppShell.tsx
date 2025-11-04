'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import type { AppSession } from '@/lib/session';

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
    <div className="flex min-h-screen">
      <Sidebar session={clientSession ?? session ?? null} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#f8e4d8] bg-gradient-to-r from-[#fff8f5]/95 to-[#fff3ed]/95 backdrop-blur-sm shadow-[0_1px_8px_rgba(240,180,150,0.25)]">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#f09c8b] via-[#f8b9a4] to-[#ffd4bf]" />
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#ec928a] to-[#f5b9a6] shadow-sm flex items-center justify-center text-white font-bold">K</div>
              <div>
                <div className="font-semibold tracking-tight text-[#4a372e] text-base">Hệ thống quản lý kho hàng</div>
                <div className="text-xs text-[#a48c7d]">Warehouse Management System</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="px-3 py-1 rounded-md bg-[#fff9f6] border border-[#f5e6dd] text-[#6f5a50] font-medium shadow-sm">🇻🇳 VI</span>
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
                  <button className="px-3 py-1.5 rounded-md bg-[#fff9f6] border border-[#f5e6dd] text-[#6f5a50] font-medium hover:bg-[#fff4ef] transition flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#ec928a] to-[#f5b9a6] text-white font-semibold overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-6 w-6 object-cover" onError={() => setAvatarUrl(null)} />
                      ) : (
                        clientSession.tenDangNhap?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </span>
                    <span className="whitespace-nowrap">{clientSession.tenDangNhap} - {clientSession.vaiTro}</span>
                  </button>
                  <div className={`${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'} transition-opacity absolute right-0 mt-2 w-48 rounded-md shadow-lg border border-[#f3e9dd] bg-[#fffaf6] z-50`}>
                    <div className="py-1 text-sm">
                      <a href="/profile" className="block px-3 py-2 text-[#6f5a50] hover:bg-[#fff0ee] hover:text-[#d46b6b]">Xem thông tin</a>
                      <form action="/api/logout" method="post">
                        <button className="w-full text-left block px-3 py-2 text-[#6f5a50] hover:bg-[#fff0ee] hover:text-[#d46b6b]">Đăng xuất</button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <a href="/login" className="px-3 py-1.5 rounded-md bg-gradient-to-r from-[#f09c8b] to-[#f6b6a2] text-white font-medium text-sm hover:brightness-105 transition">Đăng nhập</a>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 bg-gradient-to-b from-[#fffaf8] to-[#fff3ed] min-w-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </div>

        <footer className="border-t border-[#f6e5db] bg-gradient-to-r from-[#fff9f6] to-[#fff5f0] py-4 shadow-inner">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-[#9b8376]">
            <span>© {new Date().getFullYear()} MindWarehouse Pro — All rights reserved.</span>
            <span className="text-[#b59788]">Powered by <strong>Next.js + Supabase</strong></span>
          </div>
        </footer>
      </main>
    </div>
  );
}



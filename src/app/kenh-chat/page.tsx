'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ChatMessage = {
  id: string | number;
  author: 'me' | 'other';
  text: string;
  time: string;
};

type Staff = {
  id: string;
  name: string;
  role: string;
  email: string;
};

export default function StaffChatPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [activeStaffId, setActiveStaffId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const activeStaff = staffs.find((s) => s.id === activeStaffId) || staffs[0];

  async function handleDeleteConversation() {
    if (!activeStaff) return;
    if (!confirm(`Xóa toàn bộ hội thoại với ${activeStaff.name}?`)) return;
    try {
      const res = await fetch(`/api/chat/messages?staffId=${encodeURIComponent(activeStaff.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa hội thoại thất bại');
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRecallMessage(id: string | number) {
    try {
      const res = await fetch(`/api/chat/messages?messageId=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thu hồi tin nhắn thất bại');
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeStaff) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload file thất bại');

      const text = `Tệp: ${data.name}\n${data.url}`;
      // gửi như một tin nhắn mới
      const prev = input;
      setInput(text);
      await handleSend();
      setInput(prev);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/chat/staffs');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi tải danh sách tài khoản');
        const list: Staff[] = data.staffs || [];
        setStaffs(list);
        if (list.length > 0) {
          setActiveStaffId((prev) => prev || list[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeStaffId) return;
    (async () => {
      try {
        const res = await fetch(`/api/chat/messages?staffId=${encodeURIComponent(activeStaffId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi tải tin nhắn');
        const nowUserId: string = data.currentUserId;
        setCurrentUserId(nowUserId);
        const list: ChatMessage[] = (data.messages || []).map((m: any) => {
          const created = m.created_at ? new Date(m.created_at) : new Date();
          const time = `${created.getHours().toString().padStart(2, '0')}:${created
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
          return {
            id: m.id,
            author: m.sender_id === nowUserId ? 'me' : 'other',
            text: m.text,
            time,
          };
        });
        setMessages(list);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [activeStaffId]);

  // Realtime: lắng nghe tin nhắn mới trên bảng staff_messages cho cuộc hội thoại hiện tại
  useEffect(() => {
    if (!currentUserId || !activeStaffId) return;

    const channel = supabase
      .channel('staff-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'staff_messages' },
        async (payload) => {
          const m: any = payload.new;
          if (!m) return;

          const inCurrentThread =
            (m.sender_id === currentUserId && m.receiver_id === activeStaffId) ||
            (m.sender_id === activeStaffId && m.receiver_id === currentUserId);
          if (!inCurrentThread) return;

          // Lấy lại toàn bộ messages đã được giải mã từ server để đảm bảo không lộ bản mã hoá trên client
          try {
            const res = await fetch(`/api/chat/messages?staffId=${encodeURIComponent(activeStaffId)}`);
            const data = await res.json();
            if (!res.ok) return;
            const nowUserId: string = data.currentUserId;
            setCurrentUserId(nowUserId);
            const list: ChatMessage[] = (data.messages || []).map((msg: any) => {
              const created = msg.created_at ? new Date(msg.created_at) : new Date();
              const time = `${created.getHours().toString().padStart(2, '0')}:${created
                .getMinutes()
                .toString()
                .padStart(2, '0')}`;
              return {
                id: msg.id,
                author: msg.sender_id === nowUserId ? 'me' : 'other',
                text: msg.text,
                time,
              };
            });
            setMessages(list);
          } catch (e) {
            console.error(e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeStaffId]);

  async function handleSend() {
    const value = input.trim();
    if (!value || !activeStaff) return;
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: activeStaff.id, text: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gửi tin nhắn thất bại');
      const m = data.message;
      const created = m.created_at ? new Date(m.created_at) : new Date();
      const time = `${created.getHours().toString().padStart(2, '0')}:${created
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      const author: 'me' | 'other' = currentUserId && m.sender_id === currentUserId ? 'me' : 'me';
      setMessages((prev) => [
        ...prev,
        {
          id: m.id,
          author,
          text: m.text,
          time,
        },
      ]);
      setInput('');
    } catch (e) {
      console.error(e);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const getStatusColor = () => 'bg-emerald-500';

  const getStatusText = () => 'Đang hoạt động';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6" />
        <div className="h-[calc(100vh-180px)] flex gap-4">
          <div className="w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">Tài khoản có email</h3>
                  <p className="text-xs text-blue-100">{staffs.length} tài khoản</p>
                </div>
                <div className="relative">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  placeholder="Tìm kiếm nhân viên..."
                  className="w-full text-sm rounded-xl bg-white/20 backdrop-blur border border-white/30 px-4 py-2.5 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {staffs.map((s) => {
                const isActive = activeStaff && s.id === activeStaff.id;
                const hasUnread = false;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveStaffId(s.id)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg ${
                          isActive
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            : 'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}
                      >
                        {s.name.split(' ').pop()?.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ${getStatusColor()} ring-2 ring-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`font-semibold text-sm truncate ${
                            isActive ? 'text-blue-700' : 'text-gray-900'
                          }`}
                        >
                          {s.name}
                        </span>
                        {hasUnread && !isActive && (
                          <span className="flex h-2 w-2 ml-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 truncate">{s.role}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                    {activeStaff?.name?.split(' ').pop()?.charAt(0).toUpperCase()}
                  </div>
                  {activeStaff && (
                    <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ${getStatusColor()} ring-2 ring-white`} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{activeStaff?.name}</h3>
                  <p className="text-xs text-blue-100">
                    {getStatusText()} • {activeStaff?.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Xóa hội thoại
                </button>
                <label className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <input type="file" className="hidden" onChange={handleUploadFile} disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-sm font-medium">Chưa có tin nhắn</p>
                  <p className="text-xs mt-1">Bắt đầu cuộc trò chuyện với {activeStaff?.name}</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.author === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="group max-w-[80%] flex flex-col items-end">
                      <div
                        className={`w-full rounded-lg px-4 py-2 shadow ${
                          m.author === 'me'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-xs opacity-80">
                          <span>{m.author === 'me' ? 'Bạn' : activeStaff?.name}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                      </div>
                      {m.author === 'me' && (
                        <button
                          type="button"
                          onClick={() => handleRecallMessage(m.id)}
                          className="mt-1 text-[11px] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                          Thu hồi
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-3">
                <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={activeStaff ? `Nhắn tin cho ${activeStaff.name}...` : 'Chưa chọn tài khoản để chat'}
                    className="w-full px-5 py-3 pr-12 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

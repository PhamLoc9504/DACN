'use client';

import { useState } from 'react';

type ChatMessage = {
  id: number;
  author: 'me' | 'other';
  text: string;
  time: string;
};

type Staff = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'busy';
};

const STAFFS: Staff[] = [
  { id: 'nv01', name: 'Nguyễn An', role: 'Nhân viên kho', status: 'online' },
  { id: 'nv02', name: 'Trần Thuỷ', role: 'Kế toán', status: 'online' },
  { id: 'nv03', name: 'Lê Minh', role: 'Nhân viên bán hàng', status: 'busy' },
  { id: 'nv04', name: 'Phạm Lan', role: 'CSKH', status: 'offline' },
];

export default function StaffChatPage() {
  const [activeStaffId, setActiveStaffId] = useState<string>(STAFFS[0]?.id || '');
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({
    nv01: [
      {
        id: 1,
        author: 'other',
        text: 'Anh/chị check giúp em tồn kho mã HH001 với ạ.',
        time: '09:05',
      },
      {
        id: 2,
        author: 'me',
        text: 'Để em kiểm tra ngay nhé!',
        time: '09:06',
      },
    ],
    nv02: [
      {
        id: 1,
        author: 'other',
        text: 'Mọi người nhớ cập nhật hóa đơn hôm nay trước 17h nhé.',
        time: '09:12',
      },
    ],
  });
  const [input, setInput] = useState('');
  const [nextId, setNextId] = useState(100);

  const activeStaff = STAFFS.find((s) => s.id === activeStaffId) || STAFFS[0];
  const messages = threads[activeStaff?.id] || [];

  function handleSend() {
    const value = input.trim();
    if (!value || !activeStaff) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    setThreads((prev) => {
      const old = prev[activeStaff.id] || [];
      return {
        ...prev,
        [activeStaff.id]: [...old, { id: nextId, author: 'me', text: value, time }],
      };
    });
    setNextId((id) => id + 1);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'busy': return 'bg-amber-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online': return 'Đang hoạt động';
      case 'busy': return 'Bận';
      case 'offline': return 'Ngoại tuyến';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
        </div>

        {/* Main Chat Container */}
        <div className="h-[calc(100vh-180px)] flex gap-4">
          {/* Sidebar - Danh sách nhân viên */}
          <div className="w-80 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Sidebar Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">Nhân viên</h3>
                  <p className="text-xs text-blue-100">{STAFFS.length} thành viên</p>
                </div>
                <div className="relative">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                  </span>
                </div>
              </div>
              
              {/* Search Box */}
              <div className="relative">
                <input
                  placeholder="Tìm kiếm nhân viên..."
                  className="w-full text-sm rounded-xl bg-white/20 backdrop-blur border border-white/30 px-4 py-2.5 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Staff List */}
            <div className="flex-1 overflow-y-auto py-2">
              {STAFFS.map((s) => {
                const isActive = s.id === activeStaff.id;
                const hasUnread = threads[s.id]?.length > 0;
                
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
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg ${
                        isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        {s.name.split(' ').pop()?.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ${getStatusColor(s.status)} ring-2 ring-white`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-semibold text-sm truncate ${
                          isActive ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {s.name}
                        </span>
                        {hasUnread && !isActive && (
                          <span className="flex h-2 w-2 ml-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 truncate">{s.role}</span>
                        {threads[s.id]?.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {threads[s.id][threads[s.id].length - 1].time}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                    {activeStaff.name.split(' ').pop()?.charAt(0).toUpperCase()}
                  </div>
                  <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ${getStatusColor(activeStaff.status)} ring-2 ring-white`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{activeStaff.name}</h3>
                  <p className="text-xs text-blue-100">{getStatusText(activeStaff.status)} • {activeStaff.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/20 rounded-lg transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-white/20 rounded-lg transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium">Chưa có tin nhắn</p>
                  <p className="text-xs mt-1">Bắt đầu cuộc trò chuyện với {activeStaff.name}</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.author === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                        m.author === 'me'
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${
                          m.author === 'me' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {m.author === 'me' ? 'Bạn' : activeStaff.name}
                        </span>
                        <span className={`text-[10px] ${
                          m.author === 'me' ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {m.time}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-3">
                <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Nhắn tin cho ${activeStaff.name}...`}
                    className="w-full px-5 py-3 pr-12 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
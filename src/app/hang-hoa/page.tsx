'use client';

import { useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/Pagination';
import { supabase, type Tables } from '@/lib/supabaseClient';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Calendar, Search } from 'lucide-react';

export default function HangHoaPage() {
  // State quản lý dữ liệu
  const [rows, setRows] = useState<Tables['HangHoa'][]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [loai, setLoai] = useState<string>('');
  const [loaiList, setLoaiList] = useState<Tables['LoaiHang'][]>([]);
  const [nccList, setNccList] = useState<Tables['NhaCC'][]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);

  // State quản lý form
  const empty: Tables['HangHoa'] & { Barcode?: string; Quantity?: string } = {
    MaHH: '',
    TenHH: '',
    MaLoai: '',
    DonGia: 0,
    SoLuongTon: 0,
    DVT: 'Cái',
    MaNCC: '',
    Barcode: '',
    Quantity: '',
  };

  const [form, setForm] = useState<Tables['HangHoa'] & { Barcode?: string; Quantity?: string }>(empty);

  // Hàm xử lý khi quét mã vạch thành công
  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Mã vạch đã quét:', barcode);

    try {
      // 1. Ưu tiên kiểm tra trong kho trước theo Barcode
      const existRes = await fetch(`/api/hang-hoa?barcode=${encodeURIComponent(barcode)}`);
      const existData = await existRes.json();

      if (existRes.ok && Array.isArray(existData.data) && existData.data.length > 0) {
        // Đã có hàng hóa trong kho với barcode này -> chỉ xem
        const item = existData.data[0] as Tables['HangHoa'] & { Barcode?: string; Quantity?: string };
        setForm(item);
        setMode('edit');
        setViewOnly(true);
        setShowBarcodeScanner(false);
        setOpen(true);
        return;
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra hàng hóa theo mã vạch:', err);
    }

    // 2. Nếu chưa có trong kho: tạo mới với Barcode đã quét, cố gắng lấy thêm info từ API bên ngoài
    let nextForm: Tables['HangHoa'] & { Barcode?: string; Quantity?: string } = {
      ...empty,
      Barcode: barcode,
    };

    try {
      const res = await fetch(`/api/barcode-lookup?barcode=${encodeURIComponent(barcode)}`);
      const data = await res.json();

      if (res.ok && data) {
        nextForm = {
          ...nextForm,
          TenHH: data.TenHH || nextForm.TenHH,
          // Không dùng Quantity làm ĐVT nữa, chỉ điền vào field Quantity riêng
          Quantity: data.Quantity || nextForm.Quantity,
        };
      } else {
        console.warn('Không tìm thấy thông tin từ API mã vạch:', data?.error);
      }
    } catch (err) {
      console.error('Lỗi khi gọi API mã vạch bên ngoài:', err);
    }

    setForm(nextForm);
    setMode('create');
    setViewOnly(false);
    setShowBarcodeScanner(false);
    setOpen(true); // Mở form thêm mới
  };

  // Sinh mã hàng hóa tự động dạng HHxx dựa trên các mã hiện có
  async function generateNextMaHH() {
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '10000');
      const res = await fetch(`/api/hang-hoa?${params.toString()}`).then((r) => r.json());
      const data: Tables['HangHoa'][] = res.data || [];
      let maxNum = 0;
      for (const item of data) {
        if (item.MaHH && item.MaHH.startsWith('HH')) {
          const suffix = item.MaHH.slice(2);
          const num = parseInt(suffix, 10);
          if (!Number.isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      const next = maxNum + 1;
      // HH01, HH02, HH03, ...
      return `HH${String(next).padStart(2, '0')}`;
    } catch (e) {
      console.error('Lỗi khi sinh MaHH tự động:', e);
      return 'HH01';
    }
  }

  // Load dữ liệu
  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      params.set('page', String(page));
      params.set('limit', String(limit));

      try {
        const [hangRes, loaiRes, nccRes] = await Promise.all([
          fetch(`/api/hang-hoa?${params.toString()}`).then((r) => r.json()),
          fetch('/api/loai-hang').then((r) => r.json()).catch(() => ({ data: [] })),
          fetch('/api/nha-cc').then((r) => r.json()).catch(() => ({ data: [] })),
        ]);

        setRows(hangRes.data || []);
        setTotal(hangRes.total || 0);
        setLoaiList(loaiRes.data || []);
        setNccList(nccRes.data || []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [q, page, limit]);

  const LOW_THRESHOLD = 5;

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const byLoai = loai ? r.MaLoai === loai : true;
        const byStatus = (r as any).TrangThai ? (r as any).TrangThai !== 'Ngừng kinh doanh' : true;
        return byLoai && byStatus;
      }),
    [rows, loai]
  );

  const lowStock = useMemo(() => rows.filter((r) => (r.SoLuongTon || 0) <= LOW_THRESHOLD), [rows]);

  async function refresh() {
    setPage(1);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', '1');
    params.set('limit', String(limit));
    const res = await fetch(`/api/hang-hoa?${params.toString()}`).then((r) => r.json());
    setRows(res.data || []);
    setTotal(res.total || 0);
  }

  async function handleCreate() {
    // Nếu MaHH đang trống, tự sinh mã mới dạng HHxx
    let maHH = form.MaHH?.trim();
    if (!maHH) {
      maHH = await generateNextMaHH();
    }

    const payload = { ...form, MaHH: maHH };

    const res = await fetch('/api/hang-hoa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Lưu hàng hóa thất bại. Vui lòng kiểm tra lại các trường bắt buộc (Mã HH, Tên HH, ĐVT, Loại, Nhà cung cấp...).');
      return;
    }
    setOpen(false);
    await refresh();
  }

  async function handleUpdate() {
    const res = await fetch('/api/hang-hoa', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Cập nhật hàng hóa thất bại. Vui lòng kiểm tra lại các trường bắt buộc.');
      return;
    }
    setOpen(false);
    await refresh();
  }

  async function adjustStock(mahh: string, delta: number) {
    const item = rows.find((r) => r.MaHH === mahh);
    if (!item) return;
    const next = Math.max(0, (item.SoLuongTon || 0) + delta);
    await supabase.from('HangHoa').update({ SoLuongTon: next }).eq('MaHH', mahh);
    setRows((prev) => prev.map((r) => (r.MaHH === mahh ? { ...r, SoLuongTon: next } as any : r)));
  }

  async function exportCSV() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', '1');
    params.set('limit', '10000');
    const res = await fetch(`/api/hang-hoa?${params.toString()}`).then((r) => r.json());
    const data: Tables['HangHoa'][] = res.data || [];
    const headers = ['MaHH','TenHH','MaLoai','DonGia','SoLuongTon','DVT','MaNCC'];
    const lines = [headers.join(',')].concat(
      data.map((r) => [r.MaHH, r.TenHH, r.MaLoai, r.DonGia, r.SoLuongTon, r.DVT, r.MaNCC]
        .map((v) => (v === null || v === undefined ? '' : String(v).replace(/"/g, '""')))
        .map((v) => /[,\"]/.test(v) ? '"' + v + '"' : v)
        .join(','))
    );
    const content = '﻿' + lines.join('');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hang_hoa.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa hàng hóa này?')) return;
    try {
      const res = await fetch(`/api/hang-hoa?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(body.error || 'Xóa thất bại. Có thể hàng hóa đang được tham chiếu trong phiếu/chi tiết.');
        return;
      }
      await refresh();
    } catch (e: any) {
      alert(e.message || 'Xóa thất bại');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff7f9] to-[#fff1f3] p-8 text-gray-800">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#b03f5a] tracking-tight">📦 Quản lý hàng hóa</h1>
              <p className="text-sm text-gray-500">Giao diện sang trọng • thân thiện • tối ưu cho quản kho</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/60 border border-[#fde8ee] rounded-2xl px-3 py-2 shadow-sm">
                <Search className="text-[#c75a72]" />
                <input
                  className="w-72 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                  placeholder="Tìm mã hoặc tên hàng..."
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="bg-white/60 border border-[#fde8ee] rounded-xl px-3 py-2 text-sm outline-none shadow-sm"
                  value={loai}
                  onChange={(e) => { setLoai(e.target.value); setPage(1); }}
                >
                  <option value="">Tất cả loại</option>
                  {loaiList.map((l) => (
                    <option key={l.MaLoai} value={l.MaLoai}>{l.TenLoai}</option>
                  ))}
                </select>

                <select
                  className="bg-white/60 border border-[#fde8ee] rounded-xl px-3 py-2 text-sm outline-none shadow-sm"
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>

                <Button variant="secondary" onClick={exportCSV}>Xuất CSV</Button>

                <Button
                  variant="secondary"
                  onClick={() => setShowBarcodeScanner(true)}
                >
                  Quét mã
                </Button>

                <Button
                  variant="pink"
                  onClick={() => { setMode('create'); setViewOnly(false); setForm(empty); setOpen(true); }}
                >
                  + Thêm hàng
                </Button>
              </div>
            </div>
          </div>

          {/* Cảnh báo tồn thấp */}
          {lowStock.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3 mb-6">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-medium">Cảnh báo tồn kho thấp</div>
                <div>Có {lowStock.length} mặt hàng có tồn ≤ {LOW_THRESHOLD}.</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lowStock.slice(0, 6).map((i) => (
                    <span key={i.MaHH} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-rose-100">
                      <span className="font-medium">{i.MaHH}</span>
                      <span className="text-rose-500">{i.SoLuongTon}</span>
                    </span>
                  ))}
                  {lowStock.length > 6 && <span className="text-rose-500">+{lowStock.length - 6} nữa</span>}
                </div>
              </div>
            </div>
          )}

          {/* Table card */}
          <div className="rounded-3xl bg-white/60 backdrop-blur-sm border border-[#f7e5ea] shadow-lg overflow-hidden">
            <table className="min-w-full text-sm w-full">
              <thead>
                <tr className="text-left bg-transparent text-[#8b3d4f] border-b border-[#f5ebe0]">
                  <th className="py-4 px-6 font-semibold">Mã HH</th>
                  <th className="py-4 px-6 font-semibold">Tên hàng</th>
                  <th className="py-4 px-6 font-semibold">Loại</th>
                  <th className="py-4 px-6 font-semibold">Đơn giá</th>
                  <th className="py-4 px-6 font-semibold">Tồn</th>
                  <th className="py-4 px-6 font-semibold">ĐVT</th>
                  <th className="py-4 px-6 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f5ebe0] animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-4 px-6">
                          <div className="h-4 w-28 bg-[#ffeef2] rounded" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!loading && filtered.map((r) => (
                  <tr
                    key={r.MaHH}
                    className="border-b border-[#f5ebe0] hover:bg-[#fff0f4] transition cursor-pointer"
                    onClick={() => {
                      setMode('edit');
                      setForm(r as any);
                      setViewOnly(true);
                      setOpen(true);
                    }}
                  >
                    <td className="py-4 px-6 font-medium">{r.MaHH}</td>
                    <td className="py-4 px-6">{r.TenHH}</td>
                    <td className="py-4 px-6 text-gray-600">{r.MaLoai}</td>
                    <td className="py-4 px-6 text-[#b03f5a] font-semibold">{(r.DonGia || 0).toLocaleString('vi-VN')} ₫</td>
                    <td className={`py-4 px-6 font-semibold ${ (r.SoLuongTon || 0) <= LOW_THRESHOLD ? 'text-red-500' : 'text-green-600' }`}>{r.SoLuongTon}</td>
                    <td className="py-4 px-6 text-gray-700">{r.DVT}</td>
                    <td className="py-4 px-6 text-right text-xs text-gray-400">Nhấn để xem</td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-500 bg-white">
                      <div className="mx-auto h-12 w-12 rounded-full bg-[#fff0f4] mb-3 flex items-center justify-center text-[#b03f5a]">
                        <Calendar />
                      </div>
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center pt-6">
            <Pagination page={page} limit={limit} total={total} onChange={setPage} />
          </div>

          {/* Modal Thêm/Sửa / Xem chi tiết */}
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title={viewOnly ? 'Thông tin hàng hóa' : mode === 'create' ? 'Thêm hàng hóa' : 'Sửa hàng hóa'}
            hideFooter
          >
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (viewOnly) { setOpen(false); return; }
                mode === 'create' ? handleCreate() : handleUpdate();
              }}
            >
              <div className="space-y-4">
                {mode === 'edit' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mã HH</Label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" value={form.MaHH || ''} readOnly />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Tên hàng</Label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f3c0cc] disabled:bg-gray-50"
                    value={form.TenHH || ''}
                    onChange={(e) => setForm({ ...form, TenHH: e.target.value })}
                    required
                    disabled={viewOnly}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loại</Label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f3c0cc] disabled:bg-gray-50"
                      value={form.MaLoai || ''}
                      onChange={(e) => setForm({ ...form, MaLoai: e.target.value })}
                      disabled={viewOnly}
                    >
                      <option value="">Chọn loại</option>
                      {loaiList.map((l) => (
                        <option key={l.MaLoai} value={l.MaLoai}>{l.TenLoai}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Nhà cung cấp</Label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f3c0cc] disabled:bg-gray-50"
                      value={form.MaNCC || ''}
                      onChange={(e) => setForm({ ...form, MaNCC: e.target.value })}
                      required
                      disabled={viewOnly}
                    >
                      <option value="">Chọn nhà cung cấp</option>
                      {nccList.map((ncc) => (
                        <option key={ncc.MaNCC} value={ncc.MaNCC}>{ncc.TenNCC}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Đơn giá</Label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f3c0cc] disabled:bg-gray-50"
                      value={form.DonGia || 0}
                      onChange={(e) => setForm({ ...form, DonGia: Number(e.target.value) })}
                      disabled={viewOnly}
                    />
                  </div>

                  <div>
                    <Label>Quantity</Label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f3c0cc] disabled:bg-gray-50"
                      value={form.Quantity || ''}
                      onChange={(e) => setForm({ ...form, Quantity: e.target.value })}
                      placeholder={viewOnly ? '' : 'Ví dụ: 380g, 1L...'}
                      disabled={viewOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tồn kho</Label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f3c0cc] disabled:bg-gray-50"
                      value={form.SoLuongTon || 0}
                      onChange={(e) => setForm({ ...form, SoLuongTon: Number(e.target.value) })}
                      disabled={viewOnly}
                    />
                  </div>

                  <div>
                    <Label>ĐVT</Label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f3c0cc] disabled:bg-gray-50"
                      value={form.DVT}
                      onChange={(e) => setForm({ ...form, DVT: e.target.value })}
                      disabled={viewOnly}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 pt-4 border-t mt-4">
                {viewOnly && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setViewOnly(false)}
                    >
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => form.MaHH && handleDelete(form.MaHH)}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
                <div className="flex gap-3 ml-auto">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Đóng</Button>
                  {!viewOnly && (<Button type="submit">{mode === 'create' ? 'Tạo' : 'Lưu'}</Button>)}
                </div>
              </div>
            </form>
          </Modal>

          {/* Barcode Scanner Modal */}
          {showBarcodeScanner && (
            <BarcodeScanner
              open={showBarcodeScanner}
              onClose={() => setShowBarcodeScanner(false)}
              onScan={handleBarcodeScanned}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

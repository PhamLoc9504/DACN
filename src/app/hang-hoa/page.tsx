'use client';

import { useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/Pagination';
import { supabase, type Tables } from '@/lib/supabaseClient';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Barcode, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  CheckCircle,
  XCircle,
  Hash,
  Tag,
  DollarSign,
  Box,
  Building
} from 'lucide-react';

type HangHoaRow = Tables['HangHoa'] & { Barcode?: string; Quantity?: string };

export default function HangHoaPage() {
  // State quản lý dữ liệu
  const [rows, setRows] = useState<HangHoaRow[]>([]);
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
  const [selectedItem, setSelectedItem] = useState<HangHoaRow | null>(null);

  // State quản lý form
  const empty: HangHoaRow = {
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

  const [form, setForm] = useState<HangHoaRow>(empty);

  // Hàm xử lý khi quét mã vạch thành công
  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Mã vạch đã quét:', barcode);

    try {
      const existRes = await fetch(`/api/hang-hoa?barcode=${encodeURIComponent(barcode)}`);
      const existData = await existRes.json();

      if (existRes.ok && Array.isArray(existData.data) && existData.data.length > 0) {
        const item = existData.data[0] as HangHoaRow;
        setSelectedItem(item);
        setForm(item);
        setMode('edit');
        setOpen(true);
        setShowBarcodeScanner(false);
        return;
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra hàng hóa theo mã vạch:', err);
    }

    let nextForm: HangHoaRow = {
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
          Quantity: data.Quantity || nextForm.Quantity,
        };
      } else {
        console.warn('Không tìm thấy thông tin từ API mã vạch:', data?.error);
      }
    } catch (err) {
      console.error('Lỗi khi gọi API mã vạch bên ngoài:', err);
    }

    setSelectedItem(null);
    setForm(nextForm);
    setMode('create');
    setShowBarcodeScanner(false);
    setOpen(true);
  };

  // Sinh mã hàng hóa tự động
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

        setRows((hangRes.data || []) as HangHoaRow[]);
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
  const totalValue = useMemo(() => 
    rows.reduce((sum, item) => sum + (item.DonGia || 0) * (item.SoLuongTon || 0), 0), 
    [rows]
  );

  async function refresh() {
    setPage(1);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', '1');
    params.set('limit', String(limit));
    const res = await fetch(`/api/hang-hoa?${params.toString()}`).then((r) => r.json());
    setRows((res.data || []) as HangHoaRow[]);
    setTotal(res.total || 0);
  }

  async function handleCreate() {
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
      alert(data.error || 'Lưu hàng hóa thất bại. Vui lòng kiểm tra lại các trường bắt buộc.');
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
      setOpen(false);
      await refresh();
    } catch (e: any) {
      alert(e.message || 'Xóa thất bại');
    }
  }

  const handleRowClick = (item: HangHoaRow) => {
    setSelectedItem(item);
    setForm(item as any);
    setMode('edit');
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quản lý Hàng hóa</h1>
              <p className="text-gray-600 mt-1">Tổng quan và quản lý toàn bộ hàng hóa trong kho</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowBarcodeScanner(true)}
                className="hidden md:flex items-center gap-2"
              >
                <Barcode className="w-4 h-4" />
                Quét mã vạch
              </Button>
              
              <Button
                variant="primary"
                onClick={() => { 
                  setMode('create'); 
                  setSelectedItem(null);
                  setForm(empty); 
                  setOpen(true); 
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm hàng hóa
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handleRowClick(rows[0] || empty)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tổng mặt hàng</p>
                <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handleRowClick(rows[0] || empty)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tổng giá trị kho</p>
                <p className="text-2xl font-bold text-gray-900">{(totalValue / 1000000).toFixed(1)}M ₫</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => lowStock.length > 0 && handleRowClick(lowStock[0])}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Hàng sắp hết</p>
                <p className="text-2xl font-bold text-gray-900">{lowStock.length}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handleRowClick(rows[0] || empty)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tổng số lượng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rows.reduce((sum, item) => sum + (item.SoLuongTon || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Tìm kiếm theo mã, tên hàng..."
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={loai}
                  onChange={(e) => { setLoai(e.target.value); setPage(1); }}
                >
                  <option value="">Tất cả loại hàng</option>
                  {loaiList.map((l) => (
                    <option key={l.MaLoai} value={l.MaLoai}>{l.TenLoai}</option>
                  ))}
                </select>
              </div>

              <Button
                variant="secondary"
                onClick={exportCSV}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Xuất CSV
              </Button>

              <select
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={limit}
                onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        {lowStock.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => lowStock.length > 0 && handleRowClick(lowStock[0])}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-amber-800">Cảnh báo: Hàng sắp hết</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Có {lowStock.length} mặt hàng có tồn kho ≤ {LOW_THRESHOLD}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {lowStock.length} sản phẩm
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mã hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tên hàng hóa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="inline-flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">Không tìm thấy hàng hóa</p>
                          <p className="text-gray-500 text-sm mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr 
                      key={item.MaHH} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-mono font-semibold text-gray-900 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            {item.MaHH}
                          </div>
                          {item.Barcode && (
                            <span className="text-xs text-gray-500 hidden md:inline">({item.Barcode})</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.TenHH}</div>
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                              {item.Quantity || 'Không có mô tả'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{item.MaLoai}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {(item.DonGia || 0).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-gray-400" />
                          <span className={`font-semibold ${
                            (item.SoLuongTon || 0) <= LOW_THRESHOLD 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {item.SoLuongTon}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {(item.SoLuongTon || 0) <= LOW_THRESHOLD ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            <XCircle className="w-3 h-3" />
                            <span>Sắp hết</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            <CheckCircle className="w-3 h-3" />
                            <span>Đủ hàng</span>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Click để xem
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-medium">{(page - 1) * limit + 1}</span> -{' '}
              <span className="font-medium">{Math.min(page * limit, total)}</span> trong{' '}
              <span className="font-medium">{total}</span> hàng hóa
            </div>
            
            <Pagination page={page} limit={limit} total={total} onChange={setPage} />
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === 'create' ? 'Thêm hàng hóa mới' : 'Chi tiết hàng hóa'}
      >
        <div className="space-y-6">
          {/* Product Header Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{form.TenHH || 'Tên hàng hóa mới'}</h3>
                    {mode === 'edit' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {form.MaHH}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {form.MaLoai || 'Chưa có loại'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {nccList.find(n => n.MaNCC === form.MaNCC)?.TenNCC || 'Chưa có NCC'}
                    </span>
                  </div>
                </div>
              </div>
              
              {mode === 'edit' && (
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  (form.SoLuongTon || 0) <= LOW_THRESHOLD
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {(form.SoLuongTon || 0) <= LOW_THRESHOLD ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Sắp hết
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Đủ hàng
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên hàng hóa *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={form.TenHH || ''}
                onChange={(e) => setForm({ ...form, TenHH: e.target.value })}
                disabled={mode === 'edit'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mã vạch / Quy cách
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={form.Barcode || ''}
                onChange={(e) => setForm({ ...form, Barcode: e.target.value })}
                disabled={mode === 'edit'}
                placeholder="Nhập mã vạch hoặc quy cách"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Loại hàng *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={form.MaLoai || ''}
                onChange={(e) => setForm({ ...form, MaLoai: e.target.value })}
                disabled={mode === 'edit'}
                required
              >
                <option value="">Chọn loại hàng</option>
                {loaiList.map((l) => (
                  <option key={l.MaLoai} value={l.MaLoai}>{l.TenLoai}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nhà cung cấp *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={form.MaNCC || ''}
                onChange={(e) => setForm({ ...form, MaNCC: e.target.value })}
                disabled={mode === 'edit'}
                required
              >
                <option value="">Chọn nhà cung cấp</option>
                {nccList.map((ncc) => (
                  <option key={ncc.MaNCC} value={ncc.MaNCC}>{ncc.TenNCC}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Đơn giá
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={form.DonGia || 0}
                  onChange={(e) => setForm({ ...form, DonGia: Number(e.target.value) })}
                  disabled={mode === 'edit'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tồn kho
              </label>
              <div className="relative">
                <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={form.SoLuongTon || 0}
                  onChange={(e) => setForm({ ...form, SoLuongTon: Number(e.target.value) })}
                  disabled={mode === 'edit'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Đơn vị tính *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={form.DVT}
                onChange={(e) => setForm({ ...form, DVT: e.target.value })}
                disabled={mode === 'edit'}
                required
              >
                <option value="Cái">Cái</option>
                <option value="Chiếc">Chiếc</option>
                <option value="Kg">Kg</option>
                <option value="Lít">Lít</option>
                <option value="Thùng">Thùng</option>
                <option value="Hộp">Hộp</option>
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-500">Mã hàng</div>
                <div className="font-medium text-gray-900">{form.MaHH || 'Sẽ tạo tự động'}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Giá trị kho</div>
                <div className="font-medium text-gray-900">
                  {((form.DonGia || 0) * (form.SoLuongTon || 0)).toLocaleString('vi-VN')} ₫
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Đơn vị tính</div>
                <div className="font-medium text-gray-900">{form.DVT}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Trạng thái</div>
                <div className="font-medium">
                  {(form.SoLuongTon || 0) <= LOW_THRESHOLD ? (
                    <span className="text-red-600">Sắp hết</span>
                  ) : (
                    <span className="text-green-600">Đủ hàng</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Đóng
            </Button>
            
            {mode === 'create' ? (
              <Button
                variant="primary"
                onClick={handleCreate}
              >
                Tạo hàng hóa
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleUpdate}
              >
                Cập nhật
              </Button>
            )}
          </div>
        </div>
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
  );
}
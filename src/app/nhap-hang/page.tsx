'use client';

import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { formatVietnamDate } from '@/lib/dateUtils';
import ErrorDisplay from '@/components/ErrorDisplay';
import { handleApiError, formatErrorForDisplay } from '@/lib/errorHandler';

import { 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  XCircle, 
  Edit3, 
  Printer, 
  Send, 
  Trash2,
  Search,
  Filter,
  Calendar,
  Building,
  User,
  DollarSign,
  Plus,
  Download,
  Eye,
  ArrowRight,
  Check,
  X,
  MoreVertical
} from 'lucide-react';

type Row = {
  SoPN: string;
  NgayNhap: string | null;
  MaNV: string | null;
  MaNCC: string | null;
  TongTien?: number;
};

type ChiTiet = {
  MaHH: string;
  TenHH: string | null;
  SLNhap: number;
  DGNhap: number;
  TongTien: string;
};

export default function NhapHangPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [nhaCCList, setNhaCCList] = useState<Array<{ MaNCC: string; TenNCC: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [selectedPN, setSelectedPN] = useState<string | null>(null);
  const [chiTiet, setChiTiet] = useState<ChiTiet[]>([]);
  const [form, setForm] = useState({ NgayNhap: '', MaNV: '', MaNCC: '' });
  const [products, setProducts] = useState<Array<{ MaHH: string; TenHH: string | null; DonGia: number | null }>>([]);
  const [lines, setLines] = useState<Array<{ MaHH: string; SLNhap: number; DGNhap: number }>>([{ MaHH: '', SLNhap: 1, DGNhap: 0 }]);
  const [q, setQ] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterNCC, setFilterNCC] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState<{ phieu: any; chitiet: any[] } | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [error, setError] = useState<ReturnType<typeof formatErrorForDisplay> | null>(null);

  useEffect(() => {
    loadData();
    loadNhaCC();
  }, [q, fromDate, toDate, filterNCC, page, limit]);

  async function loadData() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (filterNCC) params.set('mancc', filterNCC);
    params.set('page', String(page));
    params.set('limit', String(limit));
    try {
      const res = await fetch(`/api/phieu-nhap?${params.toString()}`, {
        credentials: 'include',
      }).then((r) => r.json());
      if (res.error) {
        const appError = handleApiError(res);
        setError(formatErrorForDisplay(appError));
        setLoading(false);
        return;
      }
      setRows(res.data || []);
      setTotal(res.total || 0);
      setLoading(false);
    } catch (err) {
      const appError = handleApiError(err);
      setError(formatErrorForDisplay(appError));
      setLoading(false);
    }
  }

  async function loadNhaCC() {
    const res = await fetch('/api/nha-cc?limit=1000&page=1', {
      credentials: 'include',
    }).then((r) => r.json());
    if (res.data) {
      setNhaCCList(res.data);
    }
  }

  async function loadChiTiet(sopn: string) {
    try {
      const res = await fetch(`/api/phieu-nhap/${sopn}`, {
        credentials: 'include',
      }).then((r) => r.json());
      if (res.error) {
        const appError = handleApiError(res);
        setError(formatErrorForDisplay(appError));
        return;
      }
      setChiTiet(res.chiTiet || []);
    } catch (err) {
      const appError = handleApiError(err);
      setError(formatErrorForDisplay(appError));
    }
  }

  useEffect(() => {
    if (!open && !detailOpen) return;
    (async () => {
      const res = await fetch('/api/hang-hoa?limit=1000&page=1', {
        credentials: 'include',
      }).then((r) => r.json());
      const list = (res.data || []).map((x: any) => ({ MaHH: x.MaHH, TenHH: x.TenHH, DonGia: x.DonGia || 0 }));
      setProducts(list);
    })();
  }, [open, detailOpen]);

  function setLine(index: number, patch: Partial<{ MaHH: string; SLNhap: number; DGNhap: number }>) {
    setLines((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], ...patch } as any;
      return next;
    });
  }

  function openCreateModal() {
    setEditing(null);
    setForm({ NgayNhap: new Date().toISOString().split('T')[0], MaNV: '', MaNCC: '' });
    setLines([{ MaHH: '', SLNhap: 1, DGNhap: 0 }]);
    setOpen(true);
  }

  function openEditModal(item: Row) {
    setEditing(item);
    setForm({
      NgayNhap: item.NgayNhap || new Date().toISOString().split('T')[0],
      MaNV: item.MaNV || '',
      MaNCC: item.MaNCC || '',
    });
    loadChiTiet(item.SoPN);
    setOpen(true);
  }

  function openDetailModal(sopn: string) {
    setSelectedPN(sopn);
    loadChiTiet(sopn);
    setDetailOpen(true);
  }

  function validateForm(): { valid: boolean; error: string | null } {
    const chitiet = lines.filter((l) => l.MaHH && l.SLNhap > 0);
    if (chitiet.length === 0) {
      return { valid: false, error: 'Vui lòng thêm ít nhất một dòng hàng hóa' };
    }

    for (const l of chitiet) {
      if (!l.MaHH) {
        return { valid: false, error: 'Mã hàng hóa là bắt buộc' };
      }
      if (!l.SLNhap || l.SLNhap <= 0) {
        return { valid: false, error: `Số lượng nhập phải lớn hơn 0 cho ${l.MaHH}` };
      }
      if (!l.DGNhap || l.DGNhap < 0) {
        return { valid: false, error: `Đơn giá nhập phải lớn hơn hoặc bằng 0 cho ${l.MaHH}` };
      }
    }

    return { valid: true, error: null };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const validation = validateForm();
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    const chitiet = lines
      .filter((l) => l.MaHH && l.SLNhap > 0)
      .map((l) => ({
        MaHH: l.MaHH,
        SLNhap: l.SLNhap,
        DGNhap: l.DGNhap || (products.find((x) => x.MaHH === l.MaHH)?.DonGia || 0),
      }));

    if (editing) {
      try {
        const res = await fetch(`/api/phieu-nhap/${editing.SoPN}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phieu: form, chitiet }),
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
          const appError = handleApiError(data);
          setError(formatErrorForDisplay(appError));
          return;
        }
        setOpen(false);
        loadData();
      } catch (err: any) {
        const appError = handleApiError(err);
        setError(formatErrorForDisplay(appError));
      }
    } else {
      setPendingSubmit({ phieu: form, chitiet });
      setOpenConfirmModal(true);
    }
  }

  async function confirmImport() {
    if (!pendingSubmit) return;

    try {
      const res = await fetch('/api/phieu-nhap/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingSubmit),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        const appError = handleApiError(data);
        setError(formatErrorForDisplay(appError));
        setOpenConfirmModal(false);
        return;
      }

      setSuccessData(data.data);
      setOpenConfirmModal(false);
      setOpen(false);
      setPendingSubmit(null);
      setOpenSuccessModal(true);
      loadData();
    } catch (err: any) {
      const appError = handleApiError(err);
      setError(formatErrorForDisplay(appError));
      setOpenConfirmModal(false);
    }
  }

  async function handleDelete(sopn: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa phiếu nhập này?')) return;
    setError(null);

    try {
      const res = await fetch(`/api/phieu-nhap/${sopn}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        const appError = handleApiError(data);
        setError(formatErrorForDisplay(appError));
        return;
      }
      loadData();
    } catch (err: any) {
      const appError = handleApiError(err);
      setError(formatErrorForDisplay(appError));
    }
  }

  function handlePrint(sopn: string) {
    window.open(`/phieu-nhap/print/${sopn}`, '_blank');
  }

  function handleSend(sopn: string) {
    alert(`Chức năng gửi thông tin chứng từ cho phiếu ${sopn} đã được kích hoạt.`);
  }

  const tongTien = chiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);

  const totalValue = rows.reduce((sum, item) => sum + (item.TongTien || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 text-slate-900">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Phiếu Nhập Hàng</h1>
              <p className="text-slate-500 mt-1">Quản lý nhập hàng từ nhà cung cấp</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={openCreateModal}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tạo phiếu nhập
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorDisplay
              error={error}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* Legal Compliance Note */}
        <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-900 flex gap-2">
          <span className="mt-0.5">
            <AlertTriangle className="w-4 h-4 text-indigo-500" />
          </span>
          <div>
            <p className="font-semibold">Lưu ý pháp lý khi lập phiếu nhập và quản lý tồn kho</p>
            <p className="mt-1">
              Phiếu nhập và các chứng từ liên quan đến việc mua hàng, nhập kho được hệ thống lưu trữ, khóa/xóa mềm để phục vụ
              nghĩa vụ kế toán và đối chiếu với nhà cung cấp theo Luật Kế toán 2015 (LU04) và Luật Thương mại 2005 (LU03). Việc
              cố ý ghi sai số lượng, giá trị hoặc xóa, sửa chứng từ có thể dẫn đến vi phạm quy định pháp luật hiện hành.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Tổng phiếu nhập</p>
                <p className="text-2xl font-bold text-slate-900">{total}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Tổng giá trị</p>
                <p className="text-2xl font-bold text-slate-900">{(totalValue / 1000000).toFixed(1)}M ₫</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Nhà cung cấp</p>
                <p className="text-2xl font-bold text-slate-900">{nhaCCList.length}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Phiếu tháng này</p>
                <p className="text-2xl font-bold text-slate-900">
                  {rows.filter(r => {
                    const today = new Date();
                    const month = today.getMonth() + 1;
                    const year = today.getFullYear();
                    const rowDate = r.NgayNhap ? new Date(r.NgayNhap) : null;
                    return rowDate && rowDate.getMonth() + 1 === month && rowDate.getFullYear() === year;
                  }).length}
                </p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Tìm kiếm theo số PN, mã NV, mã NCC..."
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  placeholder="Từ ngày"
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                  placeholder="Đến ngày"
                />
              </div>

              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={filterNCC}
                  onChange={(e) => { setFilterNCC(e.target.value); setPage(1); }}
                >
                  <option value="">Tất cả NCC</option>
                  {nhaCCList.map((ncc) => (
                    <option key={ncc.MaNCC} value={ncc.MaNCC}>
                      {ncc.MaNCC} - {ncc.TenNCC}
                    </option>
                  ))}
                </select>
              </div>

              <select
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Số PN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ngày nhập
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="inline-flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">Không tìm thấy phiếu nhập</p>
                          <p className="text-gray-500 text-sm mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => (
                    <tr 
                      key={item.SoPN} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openDetailModal(item.SoPN)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.SoPN}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {item.NgayNhap ? formatVietnamDate(item.NgayNhap) : '-'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{item.MaNV || '-'}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{item.MaNCC || '-'}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {(item.TongTien || 0).toLocaleString('vi-VN')} ₫
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(item.SoPN)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handlePrint(item.SoPN)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="In phiếu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(item.SoPN)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
              <span className="font-medium">{total}</span> phiếu nhập
            </div>
            
            <Pagination page={page} limit={limit} total={total} onChange={setPage} />
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setValidationError(null);
        }}
        title={editing ? 'Chỉnh sửa phiếu nhập' : 'Tạo phiếu nhập mới'}
        className="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {validationError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertTriangle className="w-5 h-5" />
                Lỗi dữ liệu nhập vào
              </div>
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngày nhập *
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.NgayNhap}
                onChange={(e) => setForm({ ...form, NgayNhap: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mã nhân viên
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="NV001"
                value={form.MaNV}
                onChange={(e) => setForm({ ...form, MaNV: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nhà cung cấp *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.MaNCC}
                onChange={(e) => setForm({ ...form, MaNCC: e.target.value })}
                required
              >
                <option value="">Chọn nhà cung cấp</option>
                {nhaCCList.map((ncc) => (
                  <option key={ncc.MaNCC} value={ncc.MaNCC}>
                    {ncc.MaNCC} - {ncc.TenNCC}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Lines */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Chi tiết hàng hóa</h3>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setLines((prev) => [...prev, { MaHH: '', SLNhap: 1, DGNhap: 0 }])}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm hàng
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">STT</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Hàng hóa *</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Số lượng *</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Đơn giá *</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Thành tiền</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => {
                    const product = products.find(p => p.MaHH === line.MaHH);
                    const total = (line.SLNhap || 0) * (line.DGNhap || 0);
                    
                    return (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <select
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={line.MaHH}
                            onChange={(e) => {
                              const selected = products.find(p => p.MaHH === e.target.value);
                              setLine(index, { 
                                MaHH: e.target.value, 
                                DGNhap: selected?.DonGia || 0 
                              });
                            }}
                          >
                            <option value="">Chọn hàng hóa</option>
                            {products.map((product) => (
                              <option key={product.MaHH} value={product.MaHH}>
                                {product.MaHH} - {product.TenHH}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            className="w-24 px-2 py-1.5 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ml-auto"
                            value={line.SLNhap}
                            onChange={(e) => setLine(index, { SLNhap: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            className="w-32 px-2 py-1.5 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ml-auto"
                            value={line.DGNhap}
                            onChange={(e) => setLine(index, { DGNhap: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {total.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setLines(lines.filter((_, i) => i !== index))}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Tổng cộng: {lines.filter(l => l.MaHH).length} sản phẩm
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {lines
                    .filter(l => l.MaHH)
                    .reduce((sum, line) => sum + (line.SLNhap * line.DGNhap), 0)
                    .toLocaleString('vi-VN')} ₫
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setValidationError(null);
              }}
            >
              Hủy
            </Button>
            
            <Button type="submit">
              {editing ? 'Cập nhật phiếu nhập' : 'Tạo phiếu nhập'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Chi tiết phiếu nhập"
        className="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl -mt-6 -mx-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Phiếu nhập #{selectedPN}</h2>
                <p className="text-blue-100/80 mt-1">Chi tiết hàng hóa đã nhập</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100/80 mb-1">Ngày nhập</div>
                <div className="text-lg font-semibold">
                  {rows.find(r => r.SoPN === selectedPN)?.NgayNhap 
                    ? formatVietnamDate(rows.find(r => r.SoPN === selectedPN)!.NgayNhap!)
                    : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Nhân viên</div>
                  <div className="font-medium text-gray-900">
                    {rows.find(r => r.SoPN === selectedPN)?.MaNV || '-'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Building className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Nhà cung cấp</div>
                  <div className="font-medium text-gray-900">
                    {rows.find(r => r.SoPN === selectedPN)?.MaNCC || '-'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tổng tiền</div>
                  <div className="text-xl font-bold text-gray-900">
                    {tongTien.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Chi tiết hàng hóa ({chiTiet.length} sản phẩm)</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mã hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tên hàng</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">SL nhập</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Đơn giá</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {chiTiet.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.MaHH}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.TenHH || '-'}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">{item.SLNhap}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {Number(item.DGNhap).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                        {Number(item.TongTien).toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-right font-bold text-gray-800">
                      TỔNG TIỀN
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-xl text-blue-600">
                      {tongTien.toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setDetailOpen(false)}
            >
              Đóng
            </Button>
            <Button
              onClick={() => handlePrint(selectedPN || '')}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              In phiếu
            </Button>
            {selectedPN && (
              <Button
                onClick={() => openEditModal(rows.find(r => r.SoPN === selectedPN)!)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="Xác nhận nhập hàng"
      >
        {pendingSubmit && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">Bạn có chắc chắn muốn nhập hàng?</div>
                  <p className="text-sm text-blue-700 mt-1">Hệ thống sẽ tự động tạo số phiếu và cập nhật tồn kho</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Ngày nhập</div>
                  <div className="font-medium">{pendingSubmit.phieu.NgayNhap || 'Hôm nay'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Nhà cung cấp</div>
                  <div className="font-medium">
                    {nhaCCList.find(n => n.MaNCC === pendingSubmit.phieu.MaNCC)?.TenNCC || pendingSubmit.phieu.MaNCC || '-'}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Chi tiết hàng hóa</div>
                <div className="space-y-2">
                  {pendingSubmit.chitiet.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        {item.MaHH} - {products.find(p => p.MaHH === item.MaHH)?.TenHH || ''}
                      </div>
                      <div className="font-medium">
                        {item.SLNhap} × {(item.DGNhap || 0).toLocaleString('vi-VN')} ₫ = {(item.SLNhap * (item.DGNhap || 0)).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="font-medium text-gray-700">Tổng cộng</div>
                  <div className="text-lg font-bold text-blue-600">
                    {pendingSubmit.chitiet
                      .reduce((sum, item) => sum + (item.SLNhap * (item.DGNhap || 0)), 0)
                      .toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setOpenConfirmModal(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={confirmImport}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Xác nhận nhập hàng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal
        open={openSuccessModal}
        onClose={() => setOpenSuccessModal(false)}
        title="Thành công"
      >
        {successData && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="text-lg font-semibold text-green-800 mb-2">Phiếu nhập đã được tạo thành công!</div>
              <p className="text-green-700">Hệ thống đã cập nhật tồn kho tự động</p>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Số phiếu nhập</div>
                  <div className="font-medium text-lg text-blue-600">{successData.SoPN}</div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày nhập</div>
                  <div className="font-medium">{successData.NgayNhap ? formatVietnamDate(successData.NgayNhap) : '-'}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenSuccessModal(false);
                  setSuccessData(null);
                }}
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  setOpenSuccessModal(false);
                  successData.SoPN && handlePrint(successData.SoPN);
                }}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In phiếu
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
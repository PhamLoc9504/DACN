'use client';

import { useEffect, useMemo, useState } from 'react';

import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { formatVietnamDate, formatVietnamDateTime } from '@/lib/dateUtils';

import ErrorDisplay from '@/components/ErrorDisplay';
import { handleApiError, formatErrorForDisplay } from '@/lib/errorHandler';
import { BarcodeScanner } from '@/components/BarcodeScanner';

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
  MoreVertical,
  Barcode,
  Tag,
  Calculator
} from 'lucide-react';

type Row = {
  SoPN: string;
  NgayNhap: string | null;
  MaNV: string | null;
  MaNCC: string | null;
  TongTien?: number;
  TenNCC?: string | null;
  TenNV?: string | null;
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
  const [nhanVienList, setNhanVienList] = useState<Array<{ MaNV: string; HoTen: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [editing, setEditing] = useState<Row | null>(null);
  const [selectedPN, setSelectedPN] = useState<string | null>(null);
  const [chiTiet, setChiTiet] = useState<ChiTiet[]>([]);
  const [form, setForm] = useState({ NgayNhap: '', MaNV: '', MaNCC: '' });
  const [products, setProducts] = useState<Array<{ MaHH: string; TenHH: string | null; DonGia: number | null; MaNCC?: string | null; NgaySanXuat?: string | null; NgayHetHan?: string | null }>>([]);
  const [lines, setLines] = useState<Array<{ MaHH: string; SLNhap: number; DGNhap: number }>>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanToast, setScanToast] = useState<{ ma: string; ten?: string | null } | null>(null);
  const [scannerKey, setScannerKey] = useState(0);

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

  function vietnamNowInput() {
    const parts = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  }

  function toInputValue(dateStr: string | null | undefined) {
    if (!dateStr) return vietnamNowInput();
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return vietnamNowInput();
      const parts = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(dt);
      const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
      return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
    } catch {
      return vietnamNowInput();
    }
  }

  const nccMap = useMemo(() => {
    const map: Record<string, string> = {};
    nhaCCList.forEach((n) => {
      if (n?.MaNCC) map[n.MaNCC] = n.TenNCC || n.MaNCC;
    });
    return map;
  }, [nhaCCList]);

  const nvMap = useMemo(() => {
    const map: Record<string, string> = {};
    nhanVienList.forEach((nv) => {
      if (nv?.MaNV) map[nv.MaNV] = nv.HoTen || nv.MaNV;
    });
    return map;
  }, [nhanVienList]);

  useEffect(() => {
    loadData();
    loadNhaCC();
    loadNhanVien();
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
      // map SoPN list with TenNCC/HoTen if API already provides
      const data: Row[] = (res.data || []).map((r: any) => ({
        ...r,
        TenNCC: r.TenNCC,
        TenNV: r.TenNV,
      }));
      setRows(data);

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

  async function loadNhanVien() {
    const res = await fetch('/api/nhan-vien?limit=1000&page=1', {
      credentials: 'include',
    }).then((r) => r.json());
    if (res.data) {
      setNhanVienList(res.data);
    }
  }

  async function loadChiTiet(sopn: string): Promise<ChiTiet[]> {
    try {
      const res = await fetch(`/api/phieu-nhap/${sopn}`, {
        credentials: 'include',
      }).then((r) => r.json());
      if (res.error) {
        const appError = handleApiError(res);
        setError(formatErrorForDisplay(appError));
        return [];
      }
      const list = (res.chiTiet || []) as ChiTiet[];
      setChiTiet(list);
      return list;
    } catch (err) {
      const appError = handleApiError(err);
      setError(formatErrorForDisplay(appError));
      return [];
    }
  }

  useEffect(() => {
    if (!open && !detailOpen) return;
    (async () => {
      const res = await fetch('/api/hang-hoa?limit=1000&page=1', {
        credentials: 'include',
      }).then((r) => r.json());
      const list = (res.data || []).map((x: any) => ({
        MaHH: x.MaHH,
        TenHH: x.TenHH,
        DonGia: x.DonGia || 0,
        MaNCC: x.MaNCC || null,
        NgaySanXuat: x.NgaySanXuat || x.ngaySanXuat || null,
        NgayHetHan: x.NgayHetHan || x.ngayHetHan || null,
      }));
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

  function ensureProductInList(product: { MaHH: string; TenHH?: string | null; DonGia?: number | null }) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.MaHH === product.MaHH);
      if (exists) return prev;
      return [...prev, { MaHH: product.MaHH, TenHH: product.TenHH || null, DonGia: product.DonGia ?? 0 }];
    });
  }

  function applyScannedProduct(product: { MaHH: string; TenHH?: string | null; DonGia?: number | null }) {
    ensureProductInList(product);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.MaHH === product.MaHH);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          SLNhap: (next[idx].SLNhap || 0) + 1,
          DGNhap: next[idx].DGNhap ?? product.DonGia ?? 0,
        };
        return next;
      }
      const emptyIdx = prev.findIndex((l) => !l.MaHH);
      if (emptyIdx >= 0) {
        const next = [...prev];
        next[emptyIdx] = {
          ...next[emptyIdx],
          MaHH: product.MaHH,
          SLNhap: next[emptyIdx].SLNhap || 1,
          DGNhap: next[emptyIdx].DGNhap ?? product.DonGia ?? 0,
        };
        return next;
      }
      return [...prev, { MaHH: product.MaHH, SLNhap: 1, DGNhap: product.DonGia ?? 0 }];
    });
  }

  async function handleBarcodeScanned(code: string) {
    setScanError(null);
    setScanToast(null);

    // 1) Thử khớp ngay với danh sách products đã tải sẵn (MaHH)
    const local = products.find(
      (p) => p.MaHH?.toLowerCase() === code.toLowerCase()
    );
    if (local) {
      applyScannedProduct(local);
      setScanToast({ ma: local.MaHH, ten: local.TenHH || '' });
      setTimeout(() => {
        setScanToast(null);
        setShowScanner(false);
      }, 2000);
      return;
    }

    // 2) Gọi API /scan theo barcode, fallback sang mahh nếu chưa có barcode trong DB
    const tryLookup = async (param: string, value: string) => {
      const res = await fetch(`/api/hang-hoa/scan?${param}=${encodeURIComponent(value)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data?.data) return data.data;
      return null;
    };

    try {
      const byBarcode = await tryLookup('barcode', code);
      const found = byBarcode ?? (await tryLookup('mahh', code));

      if (!found) {
        setScanError('Không tìm thấy hàng hóa cho mã này');
        return;
      }

      applyScannedProduct(found);
      setScanToast({ ma: found.MaHH, ten: found.TenHH || '' });
      setTimeout(() => {
        setScanToast(null);
        setShowScanner(false);
      }, 2000);
    } catch (e) {
      setScanError('Quét mã thất bại, vui lòng thử lại');
    }
  }

  function openCreateModal() {
    setEditing(null);
    setForm({
      NgayNhap: vietnamNowInput(),
      MaNV: '',
      MaNCC: '',
    });
    setLines([]);
    setOpen(true);
  }

  async function openEditModal(item: Row) {
    setEditing(item);
    setForm({
      NgayNhap: toInputValue(item.NgayNhap),
      MaNV: item.MaNV || '',
      MaNCC: item.MaNCC || '',
    });

    const list = await loadChiTiet(item.SoPN);
    setLines(
      (list || []).map((ct) => ({
        MaHH: ct.MaHH,
        SLNhap: Number(ct.SLNhap || 0),
        DGNhap: Number(ct.DGNhap || 0),
      }))
    );
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
                          {item.NgayNhap ? formatVietnamDateTime(item.NgayNhap) : '-'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {item.MaNV ? (item.TenNV || nvMap[item.MaNV] || item.MaNV) : '-'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {item.MaNCC ? (item.TenNCC || nccMap[item.MaNCC] || item.MaNCC) : '-'}
                          </span>
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
              <div className="flex items-center gap-3 text-red-800 font-medium mb-2">
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
                type="datetime-local"
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
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setLines((prev) => [...prev, { MaHH: '', SLNhap: 1, DGNhap: 0 }])}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm hàng
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setScanError(null);
                      setScannerKey((k) => k + 1); // reset scanner instance
                      setShowScanner(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Barcode className="w-4 h-4" />
                    Quét mã
                  </Button>
                </div>
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
                          {product && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.TenHH || product.MaHH}
                            </div>
                          )}
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
                    ? formatVietnamDateTime(rows.find(r => r.SoPN === selectedPN)!.NgayNhap!)
                    : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Nhân viên</div>
                <div className="font-semibold text-gray-900">
                  {(() => {
                    const ma = rows.find(r => r.SoPN === selectedPN)?.MaNV;
                    if (!ma) return '-';
                    return nvMap[ma] || ma;
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {rows.find(r => r.SoPN === selectedPN)?.MaNV || ''}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Building className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Nhà cung cấp</div>
                <div className="font-semibold text-gray-900">
                  {(() => {
                    const ma = rows.find(r => r.SoPN === selectedPN)?.MaNCC;
                    if (!ma) return '-';
                    return nccMap[ma] || ma;
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {rows.find(r => r.SoPN === selectedPN)?.MaNCC || ''}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
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

          {/* Product Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Package size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Chi tiết đơn hàng</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Tag size={14} /> {chiTiet.length} sản phẩm
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Tổng giá trị</span>
                <span className="text-xl font-bold text-indigo-600 font-mono">
                  {tongTien.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">STT</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Đơn giá</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">SL</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {chiTiet.map((item, index) => (
                    <tr 
                      key={index} 
                      className="group hover:bg-indigo-50/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-sm text-gray-400 font-medium group-hover:text-indigo-500">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                            {item.TenHH || 'Sản phẩm chưa đặt tên'}
                          </span>
                          <span className="text-xs text-gray-400 font-mono mt-0.5">
                            Mã: {item.MaHH}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right font-medium">
                        {Number(item.DGNhap).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-xs">
                          x{item.SLNhap}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        {Number(item.TongTien).toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="bg-gray-50 px-6 py-5 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-4 sm:gap-12">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Số lượng mặt hàng</p>
                  <p className="text-base font-medium text-gray-800">{chiTiet.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Tổng cộng</p>
                  <div className="flex items-center justify-end gap-2 text-2xl font-bold text-indigo-600">
                    <Calculator size={20} className="mb-1 opacity-50" />
                    {tongTien.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>
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
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
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

      {/* Scanner Modal */}
      <BarcodeScanner
        key={scannerKey}
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
}
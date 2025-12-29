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
  User,
  DollarSign,
  Plus,
  Download,
  Eye,
  ArrowRight,
  Check,
  X,
  Truck,
  Box,
  TrendingUp,
  Users
} from 'lucide-react';

type Row = {
	SoPX: string;
	NgayXuat: string | null;
	MaNV: string | null;
  TongTien?: number;
  TrangThai?: string;
};

type ChiTiet = {
	MaHH: string;
	TenHH: string | null;
	SLXuat: number;
	DonGia: number;
	TongTien: string;
};

export default function XuatHangPage() {
	const [rows, setRows] = useState<Row[]>([]);
	const [nhanVienList, setNhanVienList] = useState<Array<{ MaNV: string; HoTen: string | null }>>([]);
  const [customerOptions, setCustomerOptions] = useState<Array<{ MaKH: string; TenKH: string | null }>>([]);
  const [me, setMe] = useState<{ maNV: string } | null>(null);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [editing, setEditing] = useState<Row | null>(null);
	const [selectedPX, setSelectedPX] = useState<string | null>(null);
	const [chiTiet, setChiTiet] = useState<ChiTiet[]>([]);
  const [form, setForm] = useState({ NgayXuat: '', MaNV: '', MaKH: '' });
	const [products, setProducts] = useState<Array<{ MaHH: string; TenHH: string | null; DonGia: number | null; SoLuongTon: number | null }>>([]);
	const [lines, setLines] = useState<Array<{ MaHH: string; SLXuat: number; DonGia: number }>>([{ MaHH: '', SLXuat: 1, DonGia: 0 }]);
	const [q, setQ] = useState('');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [filterNV, setFilterNV] = useState('');
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);
	const [openConfirmModal, setOpenConfirmModal] = useState(false);
	const [openSuccessModal, setOpenSuccessModal] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [inventoryError, setInventoryError] = useState<any>(null);
	const [pendingSubmit, setPendingSubmit] = useState<{ phieu: any; chitiet: any[] } | null>(null);
	const [successData, setSuccessData] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [error, setError] = useState<ReturnType<typeof formatErrorForDisplay> | null>(null);

	useEffect(() => {
		loadData();
		loadNhanVien();
    loadCustomers();
	}, [q, fromDate, toDate, filterNV, page, limit]);

  // Lấy thông tin tài khoản hiện tại để tự gán MaNV khi tạo phiếu
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore && data?.maNV) {
          setMe({ maNV: data.maNV });
        }
      } catch {
        // bỏ qua lỗi lấy thông tin user
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function loadCustomers() {
    try {
      const res = await fetch('/api/khach-hang?limit=1000&page=1', {
        credentials: 'include',
      }).then((r) => r.json());
      if (res?.data) {
        const list = (res.data || []).map((kh: any) => ({
          MaKH: kh.MaKH,
          TenKH: kh.TenKH || null,
        }));
        setCustomerOptions(list);
      }
    } catch {
      // ignore load errors
    }
  }

	async function loadData() {
		setLoading(true);
		setError(null);
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		if (filterNV) params.set('manv', filterNV);
		params.set('page', String(page));
		params.set('limit', String(limit));
		try {
			const res = await fetch(`/api/phieu-xuat?${params.toString()}`, {
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

	async function loadNhanVien() {
		const res = await fetch('/api/nhan-vien', {
			credentials: 'include',
		}).then((r) => r.json());
		if (res.data) {
			setNhanVienList(res.data);
		}
	}

	async function loadChiTiet(sopx: string) {
		try {
			const res = await fetch(`/api/phieu-xuat/${sopx}`, {
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
			const list = (res.data || []).map((x: any) => ({
				MaHH: x.MaHH,
				TenHH: x.TenHH,
				DonGia: x.DonGia || 0,
				SoLuongTon: x.SoLuongTon || 0,
			}));
			setProducts(list);
		})();
	}, [open, detailOpen]);

	function setLine(index: number, patch: Partial<{ MaHH: string; SLXuat: number; DonGia: number }>) {
		setLines((prev) => {
			const next = prev.slice();
			next[index] = { ...next[index], ...patch } as any;
			return next;
		});
	}

	function openCreateModal() {
		setEditing(null);
    setForm({
      NgayXuat: new Date().toISOString().split('T')[0],
      MaNV: me?.maNV || '',
      MaKH: '',
    });
		setLines([{ MaHH: '', SLXuat: 1, DonGia: 0 }]);
		setOpen(true);
	}

	function openEditModal(item: Row) {
		setEditing(item);
		setForm({
      NgayXuat: item.NgayXuat || new Date().toISOString().split('T')[0],
			MaNV: item.MaNV || '',
      MaKH: '', // Không cho phép chỉnh sửa khách hàng khi edit
		});
		loadChiTiet(item.SoPX);
		setOpen(true);
	}

	function openDetailModal(sopx: string) {
		setSelectedPX(sopx);
		loadChiTiet(sopx);
		setDetailOpen(true);
	}

	function validateForm(): { valid: boolean; error: string | null } {
		const chitiet = lines.filter((l) => l.MaHH && l.SLXuat > 0);
		if (chitiet.length === 0) {
			return { valid: false, error: 'Vui lòng thêm ít nhất một dòng hàng hóa' };
		}

		for (const l of chitiet) {
			if (!l.MaHH) {
				return { valid: false, error: 'Mã hàng hóa là bắt buộc' };
			}
			if (!l.SLXuat || l.SLXuat <= 0) {
				return { valid: false, error: `Số lượng xuất phải lớn hơn 0 cho ${l.MaHH}` };
			}
			if (!l.DonGia || l.DonGia < 0) {
				return { valid: false, error: `Đơn giá phải lớn hơn hoặc bằng 0 cho ${l.MaHH}` };
			}
		}

		return { valid: true, error: null };
	}

	async function checkInventory(chitiet: any[]): Promise<{ sufficient: boolean; errors: any[] }> {
		const errors: any[] = [];
		for (const row of chitiet) {
			const product = products.find((p) => p.MaHH === row.MaHH);
			if (!product) {
				errors.push({ MaHH: row.MaHH, message: `Hàng hóa ${row.MaHH} không tồn tại` });
				continue;
			}
			const ton = product.SoLuongTon || 0;
			if (ton < row.SLXuat) {
				errors.push({
					MaHH: row.MaHH,
					TenHH: product.TenHH,
					SoLuongTon: ton,
					SLXuat: row.SLXuat,
				});
			}
		}
		return { sufficient: errors.length === 0, errors };
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setValidationError(null);
		setInventoryError(null);

		const validation = validateForm();
		if (!validation.valid) {
			setValidationError(validation.error);
			return;
		}

		const chitiet = lines
			.filter((l) => l.MaHH && l.SLXuat > 0)
			.map((l) => ({
				MaHH: l.MaHH,
				SLXuat: l.SLXuat,
				DonGia: l.DonGia || (products.find((x) => x.MaHH === l.MaHH)?.DonGia || 0),
			}));

		if (editing) {
			try {
				const res = await fetch(`/api/phieu-xuat/${editing.SoPX}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ phieu: form, chitiet }),
					credentials: 'include',
				});
				const data = await res.json();
				if (!res.ok) {
					setValidationError(data.error || 'Cập nhật thất bại');
					if (data.insufficientStock) {
						setInventoryError(data.inventoryErrors || []);
					}
					return;
				}
				setOpen(false);
				loadData();
			} catch (err: any) {
				setValidationError(err.message || 'Có lỗi xảy ra');
			}
		} else {
			const inventoryCheck = await checkInventory(chitiet);
			if (!inventoryCheck.sufficient) {
				setInventoryError(inventoryCheck.errors);
				return;
			}

			setPendingSubmit({ phieu: form, chitiet });
			setOpenConfirmModal(true);
		}
	}

	async function confirmExport() {
		if (!pendingSubmit) return;

		try {
			const res = await fetch('/api/phieu-xuat/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(pendingSubmit),
				credentials: 'include',
			});
			const data = await res.json();
			if (!res.ok) {
				setValidationError(data.error || 'Tạo phiếu xuất thất bại');
				if (data.insufficientStock) {
					setInventoryError(data.inventoryErrors || []);
				}
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
			setValidationError(err.message || 'Có lỗi xảy ra khi tạo phiếu xuất');
			setOpenConfirmModal(false);
		}
	}

	async function handleDelete(sopx: string) {
		if (!confirm('Bạn có chắc chắn muốn xóa phiếu xuất này?')) return;
		setError(null);

		try {
			const res = await fetch(`/api/phieu-xuat/${sopx}`, {
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

	function handlePrint(sopx: string) {
		window.open(`/phieu-xuat/print/${sopx}`, '_blank');
	}

	function handleSend(sopx: string) {
    alert(`Chức năng gửi thông tin chứng từ cho phiếu ${sopx} đã được kích hoạt.`);
	}

	const tongTien = chiTiet.reduce((sum, ct) => sum + parseFloat(ct.TongTien || '0'), 0);
  const totalValue = rows.reduce((sum, item) => sum + (item.TongTien || 0), 0);
  const totalItems = rows.reduce((sum, item) => sum + (chiTiet.length), 0);

	return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Phiếu Xuất Hàng</h1>
              <p className="text-gray-600 mt-1">Quản lý xuất hàng cho khách hàng và đối tác</p>
				</div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={openCreateModal}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tạo phiếu xuất
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
        <div className="mb-4 rounded-xl border border-[#fcd5ce] bg-[#fff5f2] px-4 py-3 text-xs text-[#7b4b3f] flex gap-2">
          <span className="mt-0.5">
            <AlertTriangle className="w-4 h-4 text-[#e07a5f]" />
          </span>
          <div>
            <p className="font-semibold">Lưu ý pháp lý khi lập phiếu xuất và hóa đơn</p>
            <p className="mt-1">
              Phiếu xuất và các chứng từ bán hàng được hệ thống lưu trữ, khóa/xóa mềm để phục vụ nghĩa vụ kế toán – thuế của doanh
              nghiệp theo Luật Kế toán 2015 (LU04), Luật Thuế GTGT (LU05) và Luật Thương mại 2005 (LU03). Việc cố ý sửa hoặc xóa
              chứng từ nhằm gian lận có thể vi phạm quy định pháp luật hiện hành.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tổng phiếu xuất</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">{(totalValue / 1000000).toFixed(1)}M ₫</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nhân viên</p>
                <p className="text-2xl font-bold text-gray-900">{nhanVienList.length}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Phiếu tháng này</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rows.filter(r => {
                    const today = new Date();
                    const month = today.getMonth() + 1;
                    const year = today.getFullYear();
                    const rowDate = r.NgayXuat ? new Date(r.NgayXuat) : null;
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Tìm kiếm theo số PX, mã NV..."
							value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
						/>
					</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
						<input
							type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  placeholder="Từ ngày"
						/>
					</div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
						<input
							type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                  placeholder="Đến ngày"
						/>
					</div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
						<select
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							value={filterNV}
                  onChange={(e) => { setFilterNV(e.target.value); setPage(1); }}
						>
                  <option value="">Tất cả NV</option>
							{nhanVienList.map((nv) => (
								<option key={nv.MaNV} value={nv.MaNV}>
									{nv.MaNV} - {nv.HoTen}
								</option>
							))}
                </select>
              </div>

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

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Số PX
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ngày xuất
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
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
                          <Truck className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">Không tìm thấy phiếu xuất</p>
                          <p className="text-gray-500 text-sm mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                        </div>
                      </div>
										</td>
								</tr>
                ) : (
                  rows.map((item) => (
								<tr 
                      key={item.SoPX} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openDetailModal(item.SoPX)}
								>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.SoPX}</div>
									</td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {item.NgayXuat ? formatVietnamDate(item.NgayXuat) : '-'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{item.MaNV || '-'}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {(item.TongTien || 0).toLocaleString('vi-VN')} ₫
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          item.TrangThai === 'Hoàn thành' 
                            ? 'bg-green-100 text-green-800'
                            : item.TrangThai === 'Đang xử lý'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.TrangThai || 'Đang xử lý'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(item.SoPX)}
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
                            onClick={() => handlePrint(item.SoPX)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="In phiếu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(item.SoPX)}
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
              <span className="font-medium">{total}</span> phiếu xuất
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
				setInventoryError(null);
        }}
        title={editing ? 'Chỉnh sửa phiếu xuất' : 'Tạo phiếu xuất mới'}
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

					{inventoryError && Array.isArray(inventoryError) && inventoryError.length > 0 && (
						<div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
							<div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                <AlertTriangle className="w-5 h-5" />
                Không đủ hàng trong kho
							</div>
              <div className="text-sm text-amber-700 space-y-2">
								{inventoryError.map((err: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>{err.TenHH ? `${err.TenHH} (${err.MaHH})` : err.MaHH}</span>
                    <span className="font-medium">
                      Tồn: {err.SoLuongTon || 0} &lt; Xuất: {err.SLXuat || 0}
                    </span>
                  </div>
								))}
							</div>
						</div>
					)}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngày xuất *
              </label>
							<input
								type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
								value={form.NgayXuat}
								onChange={(e) => setForm({ ...form, NgayXuat: e.target.value })}
                required
							/>
						</div>
            
						<div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nhân viên *
              </label>
							<select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
								value={form.MaNV}
								onChange={(e) => setForm({ ...form, MaNV: e.target.value })}
                required
							>
                <option value="">Chọn nhân viên</option>
								{nhanVienList.map((nv) => (
									<option key={nv.MaNV} value={nv.MaNV}>
										{nv.MaNV} - {nv.HoTen}
									</option>
								))}
							</select>
						</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Khách hàng (tự động tạo hóa đơn)
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={form.MaKH}
                onChange={(e) => setForm({ ...form, MaKH: e.target.value })}
              >
                <option value="">-- Không chọn --</option>
                {customerOptions.map((kh) => (
                  <option key={kh.MaKH} value={kh.MaKH}>
                    {kh.MaKH} - {kh.TenKH || 'Không tên'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Nếu chọn khách hàng, hệ thống sẽ tự động tạo hóa đơn sau khi tạo phiếu xuất
              </p>
					</div>
          </div>

          {/* Product Lines */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Chi tiết hàng hóa xuất</h3>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setLines((prev) => [...prev, { MaHH: '', SLXuat: 1, DonGia: 0 }])}
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
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Tồn kho</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Số lượng *</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Đơn giá *</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Thành tiền</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Thao tác</th>
								</tr>
							</thead>
							<tbody>
                  {lines.map((line, index) => {
                    const product = products.find(p => p.MaHH === line.MaHH);
                    const stock = product?.SoLuongTon || 0;
                    const total = (line.SLXuat || 0) * (line.DonGia || 0);
                    const insufficientStock = line.MaHH && (line.SLXuat || 0) > stock;
                    
									return (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
												<select
                            className={`w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                              insufficientStock ? 'border-red-300' : 'border-gray-300'
                            }`}
                            value={line.MaHH}
													onChange={(e) => {
                              const selected = products.find(p => p.MaHH === e.target.value);
                              setLine(index, { 
                                MaHH: e.target.value, 
                                DonGia: selected?.DonGia || 0 
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
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm ${insufficientStock ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {stock}
                          </span>
											</td>
                        <td className="px-4 py-3">
												<input
													type="number"
                            min="1"
                            max={stock}
                            className={`w-24 px-2 py-1.5 border rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ml-auto ${
                              insufficientStock ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            value={line.SLXuat}
                            onChange={(e) => setLine(index, { SLXuat: Number(e.target.value) })}
												/>
											</td>
                        <td className="px-4 py-3">
												<input
													type="number"
                            min="0"
                            step="1000"
                            className="w-32 px-2 py-1.5 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ml-auto"
                            value={line.DonGia}
                            onChange={(e) => setLine(index, { DonGia: Number(e.target.value) })}
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
                  Tổng tiền: {lines
                    .filter(l => l.MaHH)
                    .reduce((sum, l) => sum + (l.SLXuat * l.DonGia), 0)
                    .toLocaleString('vi-VN')} ₫
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
							setOpen(false);
							setValidationError(null);
							setInventoryError(null);
              }}
            >
              Hủy
						</Button>
            
            <Button
              type="submit"
              variant="primary"
              disabled={lines.filter(l => l.MaHH).length === 0}
            >
              {editing ? (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Cập nhật phiếu
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Xác nhận xuất hàng
                </>
              )}
            </Button>
					</div>
				</form>
			</Modal>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Chi tiết phiếu xuất ${selectedPX}`}
        className="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 mb-1">Số phiếu xuất</p>
                <p className="font-semibold text-blue-900">{selectedPX}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">Ngày xuất</p>
                <p className="font-semibold text-blue-900">
                  {chiTiet.length > 0 && rows.find(r => r.SoPX === selectedPX)?.NgayXuat 
                    ? formatVietnamDate(rows.find(r => r.SoPX === selectedPX)!.NgayXuat!)
                    : '-'}
                </p>
							</div>
              <div>
                <p className="text-sm text-blue-700 mb-1">Nhân viên</p>
                <p className="font-semibold text-blue-900">
                  {rows.find(r => r.SoPX === selectedPX)?.MaNV || '-'}
                </p>
						</div>
              <div>
                <p className="text-sm text-blue-700 mb-1">Tổng tiền</p>
                <p className="font-semibold text-blue-900">
                  {tongTien.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Danh sách hàng hóa xuất</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mã HH</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tên hàng hóa</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Số lượng</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Đơn giá</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Thành tiền</th>
										</tr>
									</thead>
                <tbody className="divide-y divide-gray-200">
                  {chiTiet.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Không có dữ liệu chi tiết
													</td>
												</tr>
                  ) : (
                    chiTiet.map((ct, index) => (
                      <tr key={ct.MaHH} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{ct.MaHH}</td>
                        <td className="px-4 py-3 text-gray-700">{ct.TenHH || '-'}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{ct.SLXuat}</td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {parseInt(ct.DonGia.toString()).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {parseFloat(ct.TongTien).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    ))
                  )}
									</tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-900">
                      Tổng cộng:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {tongTien.toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                </tfoot>
								</table>
							</div>
						</div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => selectedPX && handlePrint(selectedPX)}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              In phiếu
							</Button>
            <Button
              variant="primary"
              onClick={() => selectedPX && handleSend(selectedPX)}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Gửi chứng từ
							</Button>
						</div>
					</div>
			</Modal>

      {/* Confirmation Modal */}
      <Modal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="Xác nhận xuất hàng"
        className="max-w-2xl"
      >
					<div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
						</div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận tạo phiếu xuất hàng
            </h3>
            <p className="text-gray-600">
              Hệ thống sẽ trừ số lượng hàng hóa từ kho và tạo phiếu xuất mới. 
              Bạn có chắc chắn muốn thực hiện thao tác này?
            </p>
          </div>
          
          {pendingSubmit && (
						<div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
								<div className="flex justify-between">
                  <span className="text-gray-600">Ngày xuất:</span>
                  <span className="font-medium">{pendingSubmit.phieu.NgayXuat}</span>
								</div>
								<div className="flex justify-between">
                  <span className="text-gray-600">Nhân viên:</span>
                  <span className="font-medium">{pendingSubmit.phieu.MaNV}</span>
								</div>
                {pendingSubmit.phieu.MaKH && (
								<div className="flex justify-between">
                    <span className="text-gray-600">Khách hàng:</span>
                    <span className="font-medium text-blue-600">
                      {customerOptions.find(kh => kh.MaKH === pendingSubmit.phieu.MaKH)?.TenKH || pendingSubmit.phieu.MaKH}
                    </span>
								</div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Số mặt hàng:</span>
                  <span className="font-medium">{pendingSubmit.chitiet.length}</span>
							</div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng số lượng:</span>
                  <span className="font-medium">
                    {pendingSubmit.chitiet.reduce((sum, ct) => sum + ct.SLXuat, 0)}
                  </span>
						</div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-bold text-lg">
                    {pendingSubmit.chitiet
                      .reduce((sum, ct) => sum + (ct.SLXuat * ct.DonGia), 0)
                      .toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                {pendingSubmit.phieu.MaKH && (
                  <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Hệ thống sẽ tự động tạo hóa đơn cho khách hàng này sau khi tạo phiếu xuất
                      </span>
                    </div>
                  </div>
                )}
								</div>
							</div>
						)}

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setOpenConfirmModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={confirmExport}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Xác nhận xuất hàng
							</Button>
						</div>
					</div>
			</Modal>

      {/* Success Modal */}
      <Modal
        open={openSuccessModal}
        onClose={() => setOpenSuccessModal(false)}
        title="Xuất hàng thành công"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
							</div>
							</div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Phiếu xuất hàng đã được tạo thành công!
            </h3>
            <p className="text-gray-600">
              Số lượng hàng hóa đã được trừ kho và phiếu xuất đã được lưu vào hệ thống.
            </p>
					</div>

          {successData && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">Số phiếu:</span>
                  <span className="font-bold text-green-900">{successData.SoPX}</span>
							</div>
                <div className="flex justify-between">
                  <span className="text-green-700">Ngày tạo:</span>
                  <span className="font-medium text-green-900">
                    {formatVietnamDate(successData.NgayXuat)}
                  </span>
						</div>
                <div className="flex justify-between">
                  <span className="text-green-700">Tổng tiền:</span>
                  <span className="font-bold text-green-900">
                    {(successData.TongTien || 0).toLocaleString('vi-VN')} ₫
                  </span>
					</div>
                {successData.MaHD && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Hóa đơn đã tạo:</span>
                      <span className="font-bold text-green-900 text-lg">{successData.MaHD}</span>
							</div>
                    <p className="text-xs text-green-600 mt-1">
                      Hóa đơn đã được tự động tạo và liên kết với phiếu xuất này
                    </p>
							</div>
                )}
						</div>
						</div>
					)}

          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setOpenSuccessModal(false)}
            >
							Đóng
						</Button>
            {successData && (
              <Button
                variant="primary"
                onClick={() => successData?.SoPX && handlePrint(successData.SoPX)}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In phiếu ngay
						</Button>
            )}
					</div>
				</div>
			</Modal>
		</div>
	);
}
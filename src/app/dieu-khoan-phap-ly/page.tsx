"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Briefcase, Building, CalendarClock, CheckCircle2, ClipboardList, FileText, Link2, Plus, RefreshCcw, Search, ShieldCheck, Trash2, User, Edit3, ListChecks } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";

type ClauseRow = {
  MaDKPL: string;
  MaLuat: string;
  TenLuat: string | null;
  NgayKy: string | null;
  NgayHetHan: string | null;
  LoaiHopDong: string | null;
  TrangThai: string | null;
  MaKH: string | null;
  TenKH: string | null;
  MaNCC: string | null;
  TenNCC: string | null;
  GhiChu: string | null;
  YeuCauCount: number;
};

type LawOption = { MaLuat: string; TenLuat: string };
type PartyOption = { value: string; label: string };

const STATUS_OPTIONS = ["Nháp", "Hiệu lực", "Sắp hết hạn", "Hết hạn", "Chấm dứt"];

const CONTRACT_TYPES = [
  "Hợp đồng mua bán",
  "Hợp đồng dịch vụ",
  "Thỏa thuận bảo mật",
  "Hợp đồng cung ứng",
  "Khác",
];

const emptyForm = {
  MaLuat: "",
  NgayKy: "",
  NgayHetHan: "",
  LoaiHopDong: "",
  TrangThai: "Hiệu lực",
  MaKH: "",
  MaNCC: "",
  GhiChu: "",
};

export default function DieuKhoanPhapLyPage() {
  const [rows, setRows] = useState<ClauseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [maLuatFilter, setMaLuatFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [laws, setLaws] = useState<LawOption[]>([]);
  const [customers, setCustomers] = useState<PartyOption[]>([]);
  const [suppliers, setSuppliers] = useState<PartyOption[]>([]);

  const [form, setForm] = useState({ ...emptyForm });
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<ClauseRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadClauses();
  }, [q, status, maLuatFilter, page, limit]);

  async function loadReferenceData() {
    try {
      const [lawRes, khRes, nccRes] = await Promise.all([
        fetch("/api/luat-quy-dinh?limit=1000&page=1", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/khach-hang?limit=1000&page=1", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/nha-cc?limit=1000&page=1", { credentials: "include" }).then((r) => r.json()),
      ]);
      setLaws((lawRes.data || []).map((l: any) => ({ MaLuat: l.MaLuat || l.maLuat, TenLuat: l.TenLuat || l.tenLuat || l.TenLuat })));
      setCustomers((khRes.data || []).map((kh: any) => ({ value: kh.MaKH, label: `${kh.MaKH} - ${kh.TenKH || "Không tên"}` })));
      setSuppliers((nccRes.data || []).map((ncc: any) => ({ value: ncc.MaNCC, label: `${ncc.MaNCC} - ${ncc.TenNCC}` })));
    } catch (err) {
      console.error("Failed to load reference data", err);
    }
  }

  async function loadClauses() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (maLuatFilter) params.set("maLuat", maLuatFilter);

    try {
      const res = await fetch(`/api/dieu-khoan-phap-ly?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không tải được dữ liệu");
      } else {
        setRows(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditing(null);
    setForm({ ...emptyForm });
    setError(null);
    setOpenForm(true);
  }

  function openEditModal(row: ClauseRow) {
    setEditing(row);
    setForm({
      MaLuat: row.MaLuat || "",
      NgayKy: row.NgayKy?.slice(0, 10) || "",
      NgayHetHan: row.NgayHetHan?.slice(0, 10) || "",
      LoaiHopDong: row.LoaiHopDong || "",
      TrangThai: row.TrangThai || "",
      MaKH: row.MaKH || "",
      MaNCC: row.MaNCC || "",
      GhiChu: row.GhiChu || "",
    });
    setError(null);
    setOpenForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!form.MaLuat) {
      setError("Vui lòng chọn luật/quy định áp dụng");
      setSaving(false);
      return;
    }
    if (!form.TrangThai) {
      setError("Vui lòng chọn trạng thái");
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      MaKH: form.MaKH || null,
      MaNCC: form.MaNCC || null,
      NgayKy: form.NgayKy || null,
      NgayHetHan: form.NgayHetHan || null,
    };

    try {
      const url = editing ? `/api/dieu-khoan-phap-ly/${editing.MaDKPL}` : "/api/dieu-khoan-phap-ly";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể lưu điều khoản");
      } else {
        setOpenForm(false);
        setEditing(null);
        setForm({ ...emptyForm });
        loadClauses();
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: ClauseRow) {
    if (!confirm(`Xóa điều khoản pháp lý ${row.MaDKPL}?`)) return;
    try {
      const res = await fetch(`/api/dieu-khoan-phap-ly/${row.MaDKPL}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Xóa thất bại");
      } else {
        loadClauses();
      }
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra");
    }
  }

  async function openDetail(row: ClauseRow) {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/dieu-khoan-phap-ly/${row.MaDKPL}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setDetailData({ error: data.error || "Không tải được chi tiết" });
      } else {
        setDetailData({
          clause: row,
          rawClause: data.data,
          yeuCau: data.yeuCau || [],
        });
      }
    } catch (err: any) {
      setDetailData({ error: err.message || "Có lỗi xảy ra" });
    } finally {
      setDetailLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalClause = rows.length;
    const active = rows.filter((r) => r.TrangThai === "Hiệu lực").length;
    const expiring = rows.filter((r) => isExpiringSoon(r.NgayHetHan)).length;
    const linkedYeuCau = rows.reduce((sum, r) => sum + (r.YeuCauCount || 0), 0);
    return { totalClause, active, expiring, linkedYeuCau };
  }, [rows]);

  return (
    <div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#0f172a] flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
              Điều khoản pháp lý
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi các điều khoản, hợp đồng và ràng buộc pháp lý với khách hàng / nhà cung cấp
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo điều khoản mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Tổng điều khoản" value={stats.totalClause} gradient="from-blue-50 to-blue-100" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Đang hiệu lực" value={stats.active} gradient="from-green-50 to-green-100" />
          <StatCard icon={<CalendarClock className="w-5 h-5" />} label="Sắp hết hạn" value={stats.expiring} gradient="from-amber-50 to-amber-100" />
          <StatCard icon={<ListChecks className="w-5 h-5" />} label="Số yêu cầu liên quan" value={stats.linkedYeuCau} gradient="from-purple-50 to-purple-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-500 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full bg-[#fef3f2] border border-[#fdd5d6] rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-[#d0475c] outline-none transition placeholder:text-gray-400"
                placeholder="Mã điều khoản, loại hợp đồng, trạng thái..."
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Trạng thái</label>
            <select
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">Tất cả</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Luật áp dụng</label>
            <select
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2"
              value={maLuatFilter}
              onChange={(e) => {
                setPage(1);
                setMaLuatFilter(e.target.value);
              }}
            >
              <option value="">Tất cả</option>
              {laws.map((law) => (
                <option key={law.MaLuat} value={law.MaLuat}>
                  {law.MaLuat} - {law.TenLuat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
              <th className="py-3 px-4 font-medium">Mã điều khoản</th>
              <th className="py-3 px-4 font-medium">Luật / Quy định</th>
              <th className="py-3 px-4 font-medium">Đối tượng áp dụng</th>
              <th className="py-3 px-4 font-medium">Hiệu lực</th>
              <th className="py-3 px-4 font-medium">Trạng thái</th>
              <th className="py-3 px-4 font-medium text-center">Yêu cầu</th>
              <th className="py-3 px-4 font-medium text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f5ebe0]">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-4 w-24 bg-[#f8d7dc] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              rows.map((row) => (
                <tr
                  key={row.MaDKPL}
                  className="border-b border-[#f5ebe0] hover:bg-[#fff1f2]/80 transition cursor-pointer"
                  onClick={() => openDetail(row)}
                >
                  <td className="py-3 px-4 font-semibold text-gray-800">{row.MaDKPL}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{row.TenLuat || row.MaLuat}</div>
                    <div className="text-xs text-gray-500">{row.LoaiHopDong || "Chưa chọn loại hợp đồng"}</div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {row.TenKH ? (
                      <div className="flex items-center gap-2 text-indigo-600">
                        <User className="w-3.5 h-3.5" />
                        {row.TenKH} ({row.MaKH})
                      </div>
                    ) : row.TenNCC ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Building className="w-3.5 h-3.5" />
                        {row.TenNCC} ({row.MaNCC})
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Chưa gắn đối tượng</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-700">Từ: {formatDate(row.NgayKy)}</div>
                    <div className="text-xs text-gray-500">Đến: {formatDate(row.NgayHetHan)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(row.TrangThai || "")}`}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {row.TrangThai || "Không xác định"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-[#d0475c] font-semibold">{row.YeuCauCount || 0}</td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        onClick={() => openEditModal(row)}
                      >
                        <Edit3 className="w-3 h-3 inline mr-1" />
                        Sửa
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  Chưa có điều khoản nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

  <div className="flex justify-between items-center gap-4">
        <div className="text-sm text-gray-500">
          Hiển thị
          <select
            className="mx-2 bg-white border border-gray-200 rounded px-2 py-1"
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(parseInt(e.target.value));
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          bản ghi / trang
        </div>
        <Pagination page={page} limit={limit} total={total} onChange={setPage} />
      </div>

      <Modal
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setError(null);
        }}
        title={editing ? "Cập nhật điều khoản" : "Tạo điều khoản pháp lý"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 mb-1">Luật / Quy định *</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.MaLuat}
              onChange={(e) => setForm({ ...form, MaLuat: e.target.value })}
            >
              <option value="">-- Chọn luật --</option>
              {laws.map((law) => (
                <option key={law.MaLuat} value={law.MaLuat}>
                  {law.MaLuat} - {law.TenLuat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Ngày ký</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={form.NgayKy}
                onChange={(e) => setForm({ ...form, NgayKy: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Ngày hết hạn</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={form.NgayHetHan}
                onChange={(e) => setForm({ ...form, NgayHetHan: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Loại hợp đồng</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.LoaiHopDong}
                onChange={(e) => setForm({ ...form, LoaiHopDong: e.target.value })}
              >
                <option value="">-- Chọn loại --</option>
                {CONTRACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Trạng thái *</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.TrangThai}
                onChange={(e) => setForm({ ...form, TrangThai: e.target.value })}
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Áp dụng cho khách hàng</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.MaKH}
                onChange={(e) => setForm({ ...form, MaKH: e.target.value, MaNCC: "" })}
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((kh) => (
                  <option key={kh.value} value={kh.value}>
                    {kh.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Để trống nếu điều khoản dành cho nhà cung cấp.</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Áp dụng cho nhà cung cấp</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.MaNCC}
                onChange={(e) => setForm({ ...form, MaNCC: e.target.value, MaKH: "" })}
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((ncc) => (
                  <option key={ncc.value} value={ncc.value}>
                    {ncc.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Để trống nếu điều khoản dành cho khách hàng.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Ghi chú</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              value={form.GhiChu || ""}
              onChange={(e) => setForm({ ...form, GhiChu: e.target.value })}
              placeholder="Ghi chú bổ sung về phạm vi áp dụng, điều kiện đặc biệt..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpenForm(false);
                setError(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : editing ? (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Cập nhật
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo mới
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết điều khoản">
        {detailLoading && (
          <div className="py-10 text-center text-gray-500">
            <RefreshCcw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            Đang tải chi tiết...
          </div>
        )}
        {!detailLoading && detailData?.error && (
          <div className="py-6 text-center text-red-600 text-sm">{detailData.error}</div>
        )}
        {!detailLoading && detailData?.clause && (
          <div className="space-y-4 text-sm">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Mã điều khoản</p>
                <p className="text-2xl font-semibold">{detailData.clause.MaDKPL}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Trạng thái</p>
                <p className="text-sm font-semibold">{detailData.clause.TrangThai}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow label="Luật áp dụng" value={`${detailData.clause.MaLuat} - ${detailData.clause.TenLuat || ""}`} icon={<ShieldCheck className="w-4 h-4 text-blue-500" />} />
              <InfoRow label="Loại hợp đồng" value={detailData.clause.LoaiHopDong || "Chưa xác định"} icon={<Briefcase className="w-4 h-4 text-amber-500" />} />
              <InfoRow label="Ngày ký" value={formatDate(detailData.clause.NgayKy)} icon={<CalendarClock className="w-4 h-4 text-emerald-500" />} />
              <InfoRow label="Ngày hết hạn" value={formatDate(detailData.clause.NgayHetHan)} icon={<CalendarClock className="w-4 h-4 text-rose-500" />} />
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Đối tượng áp dụng</p>
              {detailData.clause.TenKH ? (
                <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                  <User className="w-4 h-4" />
                  {detailData.clause.TenKH} ({detailData.clause.MaKH})
                </div>
              ) : detailData.clause.TenNCC ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <Building className="w-4 h-4" />
                  {detailData.clause.TenNCC} ({detailData.clause.MaNCC})
                </div>
              ) : (
                <div className="text-gray-400">Chưa gắn đối tượng cụ thể</div>
              )}
            </div>

            {detailData.clause.GhiChu && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-amber-800 text-sm">
                {detailData.clause.GhiChu}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#d0475c]" />
                  Yêu cầu pháp lý liên quan
                </p>
                <span className="text-xs text-gray-500">{detailData.yeuCau.length} yêu cầu</span>
              </div>
              {detailData.yeuCau.length === 0 ? (
                <p className="text-gray-400 text-xs">Chưa có yêu cầu nào gắn với điều khoản này</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {detailData.yeuCau.map((yc: any) => (
                    <div key={yc.MaYC} className="border border-gray-200 rounded-xl px-3 py-2">
                      <p className="text-sm font-semibold text-gray-800">{yc.MaYC} - {yc.TenYC}</p>
                      <p className="text-xs text-gray-500">{yc.MoTaYC || "Không có mô tả"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: number; gradient: string }) {
  return (
    <div className={`rounded-2xl p-4 border shadow-sm bg-gradient-to-br ${gradient} border-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-700">{icon}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-3">
      <div className="text-gray-500">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800">{value || "-"}</p>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function isExpiringSoon(dateStr: string | null) {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
}

function statusBadge(value: string) {
  switch (value) {
    case "Hiệu lực":
      return "bg-green-100 text-green-700";
    case "Sắp hết hạn":
      return "bg-amber-100 text-amber-700";
    case "Hết hạn":
      return "bg-red-100 text-red-700";
    case "Nháp":
      return "bg-gray-100 text-gray-600";
    case "Chấm dứt":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}


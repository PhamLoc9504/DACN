"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckSquare, ClipboardList, FileText, Link2, PenLine, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";

type RequestRow = {
  MaYC: string;
  TenYC: string;
  MoTaYC: string | null;
  MaDKPL: string;
  TenLuat: string | null;
};

type ClauseOption = {
  MaDKPL: string;
  Summary: string;
};

const emptyForm = {
  TenYC: "",
  MoTaYC: "",
  MaDKPL: "",
};

export default function YeuCauPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [maDKPLFilter, setMaDKPLFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [clauses, setClauses] = useState<ClauseOption[]>([]);

  const [form, setForm] = useState({ ...emptyForm });
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<RequestRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClausesOptions();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [q, maDKPLFilter, page, limit]);

  async function loadClausesOptions() {
    try {
      const res = await fetch("/api/dieu-khoan-phap-ly?limit=1000&page=1", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setClauses(
          (data.data || []).map((c: any) => ({
            MaDKPL: c.MaDKPL,
            Summary: `${c.MaDKPL} • ${c.TenLuat || c.MaLuat}`,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadRequests() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (q) params.set("q", q);
    if (maDKPLFilter) params.set("maDKPL", maDKPLFilter);

    try {
      const res = await fetch(`/api/yeu-cau?${params.toString()}`, {
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
      setError(err.message || "Có lỗi xảy ra");
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

  function openEditModal(row: RequestRow) {
    setEditing(row);
    setForm({
      TenYC: row.TenYC,
      MoTaYC: row.MoTaYC || "",
      MaDKPL: row.MaDKPL,
    });
    setError(null);
    setOpenForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!form.TenYC.trim()) {
      setError("Vui lòng nhập tên yêu cầu");
      setSaving(false);
      return;
    }
    if (!form.MaDKPL) {
      setError("Vui lòng chọn điều khoản pháp lý");
      setSaving(false);
      return;
    }

    try {
      const url = editing ? `/api/yeu-cau/${editing.MaYC}` : "/api/yeu-cau";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể lưu yêu cầu");
      } else {
        setOpenForm(false);
        setEditing(null);
        setForm({ ...emptyForm });
        loadRequests();
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: RequestRow) {
    if (!confirm(`Xóa yêu cầu ${row.MaYC}?`)) return;
    try {
      const res = await fetch(`/api/yeu-cau/${row.MaYC}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Xóa thất bại");
      } else {
        loadRequests();
      }
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra");
    }
  }

  const stats = useMemo(() => {
    const totalYC = rows.length;
    const uniqueClause = new Set(rows.map((r) => r.MaDKPL)).size;
    const avgPerClause = uniqueClause ? (rows.length / uniqueClause).toFixed(1) : "0";
    return { totalYC, uniqueClause, avgPerClause };
  }, [rows]);

  return (
    <div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1d4ed8] flex items-center gap-2">
              <CheckSquare className="w-6 h-6" />
              Yêu cầu tuân thủ
            </h1>
            <p className="text-sm text-gray-500 mt-1">Theo dõi các yêu cầu pháp lý phát sinh từ điều khoản/ hợp đồng</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo yêu cầu
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatChip icon={<ClipboardList className="w-4 h-4" />} label="Tổng yêu cầu" value={stats.totalYC} />
          <StatChip icon={<Link2 className="w-4 h-4" />} label="Điều khoản liên quan" value={stats.uniqueClause} />
          <StatChip icon={<PenLine className="w-4 h-4" />} label="TB yêu cầu / điều khoản" value={stats.avgPerClause} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-500 mb-1 block">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full bg-[#eff6ff] border border-[#dbeafe] rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-[#2563eb] outline-none transition placeholder:text-gray-400"
                placeholder="Mã yêu cầu, tên yêu cầu..."
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Điều khoản liên quan</label>
            <select
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2"
              value={maDKPLFilter}
              onChange={(e) => {
                setPage(1);
                setMaDKPLFilter(e.target.value);
              }}
            >
              <option value="">Tất cả</option>
              {clauses.map((c) => (
                <option key={c.MaDKPL} value={c.MaDKPL}>
                  {c.Summary}
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
              <th className="py-3 px-4 font-medium">Mã yêu cầu</th>
              <th className="py-3 px-4 font-medium">Tên yêu cầu</th>
              <th className="py-3 px-4 font-medium">Điều khoản</th>
              <th className="py-3 px-4 font-medium">Ghi chú</th>
              <th className="py-3 px-4 font-medium text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f5ebe0]">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-4 w-24 bg-[#e5e7eb] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              rows.map((row) => (
                <tr key={row.MaYC} className="border-b border-[#f5ebe0] hover:bg-[#f1f5f9] transition">
                  <td className="py-3 px-4 font-semibold text-gray-800">{row.MaYC}</td>
                  <td className="py-3 px-4">
                    <p className="text-gray-900 font-medium">{row.TenYC}</p>
                    <p className="text-xs text-gray-500">{row.MoTaYC || "Không có mô tả"}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-indigo-700">
                    <div className="font-semibold">{row.MaDKPL}</div>
                    <div className="text-xs text-gray-500">{row.TenLuat || "Luật không xác định"}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{row.MoTaYC?.slice(0, 80) || "-"}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        onClick={() => openEditModal(row)}
                      >
                        <FileText className="w-3 h-3 inline mr-1" />
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
                <td colSpan={5} className="py-10 text-center text-gray-500">
                  Chưa có yêu cầu nào
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
        title={editing ? "Cập nhật yêu cầu" : "Tạo yêu cầu mới"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500 mb-1">Tên yêu cầu *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.TenYC}
              onChange={(e) => setForm({ ...form, TenYC: e.target.value })}
              placeholder="Ví dụ: Yêu cầu cập nhật hợp đồng hàng năm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Điều khoản pháp lý *</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.MaDKPL}
              onChange={(e) => setForm({ ...form, MaDKPL: e.target.value })}
            >
              <option value="">-- Chọn điều khoản --</option>
              {clauses.map((c) => (
                <option key={c.MaDKPL} value={c.MaDKPL}>
                  {c.Summary}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Mô tả</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[120px]"
              value={form.MoTaYC}
              onChange={(e) => setForm({ ...form, MoTaYC: e.target.value })}
              placeholder="Mô tả chi tiết hành động, trách nhiệm, thời hạn..."
            />
          </div>

          <div className="flex justify-end gap-2">
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
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-2xl px-4 py-3 bg-white">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">{icon}</div>
    </div>
  );
}


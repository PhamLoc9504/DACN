"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Edit3, Plus, Trash2, Search, ExternalLink } from "lucide-react";
import  Button  from "@/components/Button" ;
import  Modal  from "@/components/Modal";
import  Pagination  from "@/components/Pagination";

interface LuatRow {
  MaLuat: string;
  TenLuat: string;
  NgayCapNhat: string | null;
  MoTaLuat: string | null;
  LinkNguon: string | null;
}

export default function LuatQuyDinhPage() {
  const [rows, setRows] = useState<LuatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<LuatRow | null>(null);
  const [editing, setEditing] = useState<LuatRow | null>(null);
  const [form, setForm] = useState<{ TenLuat: string; MoTaLuat: string; LinkNguon: string }>({
    TenLuat: "",
    MoTaLuat: "",
    LinkNguon: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [q, page, limit]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/luat-quy-dinh?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setValidationError(data.error || "Không tải được dữ liệu");
        setLoading(false);
        return;
      }
      setRows(data.data || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setValidationError(e.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditing(null);
    setForm({ TenLuat: "", MoTaLuat: "", LinkNguon: "" });
    setValidationError(null);
    setOpen(true);
  }

  function openEditModal(row: LuatRow) {
    setEditing(row);
    setForm({
      TenLuat: row.TenLuat || "",
      MoTaLuat: row.MoTaLuat || "",
      LinkNguon: row.LinkNguon || "",
    });
    setValidationError(null);
    setOpen(true);
  }

  function validateForm(): { valid: boolean; error: string | null } {
    if (!form.TenLuat.trim()) return { valid: false, error: "Tên luật/quy định là bắt buộc" };
    return { valid: true, error: null };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const { valid, error } = validateForm();
    if (!valid) {
      setValidationError(error);
      return;
    }

    try {
      if (editing) {
        const res = await fetch(`/api/luat-quy-dinh/${editing.MaLuat}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setValidationError(data.error || "Cập nhật thất bại");
          return;
        }
      } else {
        const res = await fetch("/api/luat-quy-dinh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setValidationError(data.error || "Tạo mới thất bại");
          return;
        }
      }
      setOpen(false);
      await loadData();
    } catch (err: any) {
      setValidationError(err.message || "Có lỗi xảy ra khi lưu");
    }
  }

  async function handleDelete(maLuat: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa luật/quy định ${maLuat}?`)) return;
    try {
      const res = await fetch(`/api/luat-quy-dinh/${maLuat}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Xóa thất bại");
        return;
      }
      await loadData();
    } catch (e: any) {
      alert(e.message || "Có lỗi xảy ra khi xóa");
    }
  }

  function formatDate(value: string | null): string {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("vi-VN");
  }

  return (
    <div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
      {/* Header & filter */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-[#2563eb]">📚 Quản lý Luật / Quy định</h1>
            <p className="text-sm text-gray-500 mt-1">Thiết lập các văn bản pháp lý áp dụng cho khách hàng và nhà cung cấp</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm luật / quy định
          </Button>
        </div>
        <div className="flex items-center gap-3 max-w-xl">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full bg-[#eff6ff] border border-[#dbeafe] rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-[#2563eb] outline-none transition placeholder:text-gray-400"
              placeholder="Tìm theo tên luật / quy định"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left bg-[#eff6ff] text-[#2563eb] border-b border-[#dbeafe]">
              <th className="py-3 px-4 font-medium">Mã luật</th>
              <th className="py-3 px-4 font-medium">Tên luật / Quy định</th>
              <th className="py-3 px-4 font-medium">Ngày cập nhật</th>
              <th className="py-3 px-4 font-medium">Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f3f4f6] animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-4 w-24 bg-[#e5e7eb] rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              rows.map((r) => (
                <tr
                  key={r.MaLuat}
                  className="border-b border-[#f3f4f6] hover:bg-[#eff6ff]/60 transition cursor-pointer"
                  onClick={() => {
                    setSelected(r);
                    setDetailOpen(true);
                  }}
                >
                  <td className="py-3 px-4 font-semibold text-gray-800">{r.MaLuat}</td>
                  <td className="py-3 px-4 text-gray-800">{r.TenLuat}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(r.NgayCapNhat)}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-md truncate" title={r.MoTaLuat || undefined}>
                    {r.MoTaLuat || "-"}
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-500 bg-white">
                  Chưa có luật / quy định nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center pt-4">
        <Pagination page={page} limit={limit} total={total} onChange={setPage} />
      </div>

      {/* Modal create/edit */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setValidationError(null);
        }}
        title={editing ? "Sửa luật / quy định" : "Thêm luật / quy định"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <CheckCircle className="w-5 h-5" />
                Lỗi dữ liệu
              </div>
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          )}

          {editing && (
            <div>
              <label className="block text-sm mb-1 text-gray-500">Mã luật</label>
              <input
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                value={editing.MaLuat}
                disabled
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-1 text-gray-500">Tên luật / Quy định</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.TenLuat}
              onChange={(e) => setForm({ ...form, TenLuat: e.target.value })}
              placeholder="Ví dụ: Luật An ninh mạng 2018"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-500">Mô tả chi tiết</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              value={form.MoTaLuat}
              onChange={(e) => setForm({ ...form, MoTaLuat: e.target.value })}
              placeholder="Tóm tắt nội dung luật/quy định, phạm vi áp dụng, yêu cầu chính..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
            {validationError && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setValidationError(null)}
              >
                Sửa lại
              </Button>
            )}
            <Button type="submit">{editing ? "💾 Lưu thay đổi" : "➕ Tạo mới"}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal xem chi tiết */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Chi tiết luật / quy định"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Mã luật:</span>
              <span className="font-semibold">{selected.MaLuat}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Tên luật / Quy định:</span>
              <p className="font-semibold text-gray-800">{selected.TenLuat}</p>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Mô tả chi tiết:</span>
              <p className="text-gray-800 whitespace-pre-line">{selected.MoTaLuat || '-'}</p>
            </div>
            {selected.LinkNguon && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nguồn:</span>
                <a
                  href={selected.LinkNguon}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4 mr-1" /> Mở văn bản
                </a>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDetailOpen(false);
                  openEditModal(selected);
                }}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Sửa
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDetailOpen(false);
                  handleDelete(selected.MaLuat);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

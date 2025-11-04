'use client';

import { useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

type Row = {
  SoPN: string;
  NgayNhap: string | null;
  MaNV: string | null;
  MaNCC: string | null;
};

export default function NhapHangPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ SoPN: '', NgayNhap: '', MaNV: '', MaNCC: '' });
  const [products, setProducts] = useState<Array<{ MaHH: string; TenHH: string | null; DonGia: number | null }>>([]);
  const [lines, setLines] = useState<Array<{ MaHH: string; SLNhap: number }>>([{ MaHH: '', SLNhap: 1 }]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await fetch(`/api/phieu-nhap?${params.toString()}`).then((r) => r.json());
      setRows(res.data || []);
      setTotal(res.total || 0);
      setLoading(false);
    }
    load();
  }, [q, page, limit]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await fetch('/api/hang-hoa?limit=1000&page=1').then((r) => r.json());
      const list = (res.data || []).map((x: any) => ({ MaHH: x.MaHH, TenHH: x.TenHH, DonGia: x.DonGia || 0 }));
      setProducts(list);
    })();
  }, [open]);

  function setLine(index: number, patch: Partial<{ MaHH: string; SLNhap: number }>) {
    setLines((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], ...patch } as any;
      return next;
    });
  }

  const filtered = rows.filter((r) =>
    q
      ? (r.SoPN || '').toLowerCase().includes(q.toLowerCase()) ||
        (r.MaNV || '').toLowerCase().includes(q.toLowerCase()) ||
        (r.MaNCC || '').toLowerCase().includes(q.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
      {/* --- Bộ lọc & tìm kiếm --- */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-semibold text-[#d47b8a]">📥 Quản lý phiếu nhập hàng</h1>
          <Button onClick={() => setOpen(true)}>+ Tạo phiếu nhập</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 text-gray-500">Tìm kiếm</label>
            <input
              className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#d47b8a] outline-none transition placeholder:text-gray-400"
              placeholder="Số PN / Mã NV / Mã NCC"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-500">Hiển thị</label>
            <select
              className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
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
          </div>
        </div>
      </div>

      {/* --- Bảng dữ liệu --- */}
      <div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
              <th className="py-3 px-4 font-medium">Số PN</th>
              <th className="py-3 px-4 font-medium">Ngày nhập</th>
              <th className="py-3 px-4 font-medium">Mã NV</th>
              <th className="py-3 px-4 font-medium">Mã NCC</th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f5ebe0] animate-pulse">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-4 w-20 bg-[#f9dfe3] rounded" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              filtered.map((r) => (
                <tr
                  key={r.SoPN}
                  className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition"
                >
                  <td className="py-3 px-4 font-medium text-gray-700">{r.SoPN}</td>
                  <td className="py-3 px-4 text-gray-600">{r.NgayNhap}</td>
                  <td className="py-3 px-4 text-[#d47b8a] font-semibold">{r.MaNV}</td>
                  <td className="py-3 px-4 text-gray-700">{r.MaNCC}</td>
                </tr>
              ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-500 bg-white">
                  <div className="mx-auto h-10 w-10 rounded-full bg-[#fce7ec] mb-3" />
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Phân trang --- */}
      <div className="flex justify-center pt-4">
        <Pagination page={page} limit={limit} total={total} onChange={setPage} />
      </div>

      {/* --- Modal tạo phiếu nhập --- */}
      <Modal open={open} onClose={() => setOpen(false)} title="Tạo phiếu nhập">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const chitiet = lines
              .filter((l) => l.MaHH && l.SLNhap > 0)
              .map((l) => {
                const p = products.find((x) => x.MaHH === l.MaHH);
                const unit = p?.DonGia || 0;
                return { MaHH: l.MaHH, SLNhap: l.SLNhap, DGNhap: unit };
              });
            if (chitiet.length === 0) {
              alert('Thêm ít nhất 1 dòng hàng hóa.');
              return;
            }
            const res = await fetch('/api/phieu-nhap/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phieu: form, chitiet }),
            });
            const body = await res.json();
            if (!res.ok) {
              alert(body.error || 'Tạo phiếu nhập thất bại');
              return;
            }
            setOpen(false);
            location.reload();
          }}
        >
          <div className="grid grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Số PN" value={form.SoPN} onChange={(e) => setForm({ ...form, SoPN: e.target.value })} required />
            <input className="border rounded px-3 py-2" type="date" value={form.NgayNhap} onChange={(e) => setForm({ ...form, NgayNhap: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Mã NV" value={form.MaNV} onChange={(e) => setForm({ ...form, MaNV: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Mã NCC" value={form.MaNCC} onChange={(e) => setForm({ ...form, MaNCC: e.target.value })} />
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Chi tiết nhập hàng</div>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="p-2 text-left">Hàng hóa</th>
                  <th className="p-2 text-right">SL nhập</th>
                  <th className="p-2 text-right">Đơn giá</th>
                  <th className="p-2 text-right">Thành tiền</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const p = products.find((x) => x.MaHH === l.MaHH);
                  const unit = p?.DonGia || 0;
                  const thanhTien = unit * (l.SLNhap || 0);
                  return (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        <select className="w-full border rounded px-2 py-1" value={l.MaHH} onChange={(e) => setLine(i, { MaHH: e.target.value })}>
                          <option value="">Chọn hàng</option>
                          {products.map((h) => (
                            <option key={h.MaHH} value={h.MaHH}>
                              {h.MaHH} - {h.TenHH}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <input type="number" min={1} className="w-24 border rounded px-2 py-1 text-right" value={l.SLNhap} onChange={(e) => setLine(i, { SLNhap: Number(e.target.value) })} />
                      </td>
                      <td className="p-2 text-right text-slate-700">{unit.toLocaleString('vi-VN')}</td>
                      <td className="p-2 text-right font-medium text-slate-800">{thanhTien.toLocaleString('vi-VN')}</td>
                      <td className="p-2 text-right">
                        <Button type="button" variant="secondary" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}>Xóa</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pt-2">
              <Button type="button" variant="secondary" onClick={() => setLines((prev) => [...prev, { MaHH: '', SLNhap: 1 }])}>+ Thêm dòng</Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit">Tạo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

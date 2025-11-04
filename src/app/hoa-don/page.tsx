'use client';

import { useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { supabase, type Tables } from '@/lib/supabaseClient';

const TRANGTHAI = ['', 'Chưa thanh toán', 'Đã thanh toán', 'Đang xử lý'];

type HoaDonForm = {
    MaHD?: string;
    NgayLap: string;
    MaKH: string;
    MaNCC?: string | null;
    TongTien: number;
    TrangThai: string;
    SoPX?: string | null;
    SoPN?: string | null;
    MaNV?: string | null;
};

export default function HoaDonPage() {
    const [rows, setRows] = useState<Tables['HoaDon'][]>([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<HoaDonForm | null>(null);
    const [me, setMe] = useState<{ maNV: string } | null>(null);
    const [pnOptions, setPnOptions] = useState<{ SoPN: string }[]>([]);
    const [pxOptions, setPxOptions] = useState<{ SoPX: string }[]>([]);
    const [voucherType, setVoucherType] = useState<'PN' | 'PX' | ''>('');

    useEffect(() => {
        async function load() {
            setLoading(true);
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            params.set('page', String(page));
            params.set('limit', String(limit));
            const res = await fetch(`/api/hoa-don?${params.toString()}`).then((r) => r.json());
            setRows(res.data || []);
            setTotal(res.total || 0);
            setLoading(false);
        }
        load();
    }, [status, page, limit]);

    // Load session (for MaNV) and voucher options without invoice
    useEffect(() => {
        async function loadAux() {
            try {
                const [meRes, pnRes, pxRes, hdRes] = await Promise.all([
                    fetch('/api/me').then((r) => r.ok ? r.json() : null),
                    fetch('/api/phieu-nhap').then((r) => r.json()),
                    fetch('/api/phieu-xuat').then((r) => r.json()),
                    fetch('/api/hoa-don?page=1&limit=10000').then((r) => r.json()),
                ]);
                if (meRes && meRes.maNV) setMe({ maNV: meRes.maNV });
                const invoices: Tables['HoaDon'][] = (hdRes?.data || []) as Tables['HoaDon'][];
                const usedPN = new Set((invoices || []).map((x) => x.SoPN).filter(Boolean) as string[]);
                const usedPX = new Set((invoices || []).map((x) => x.SoPX).filter(Boolean) as string[]);
                const allPN: { SoPN: string }[] = (pnRes?.data || []).map((x: any) => ({ SoPN: x.SoPN })).filter((x: any) => x.SoPN);
                const allPX: { SoPX: string }[] = (pxRes?.data || []).map((x: any) => ({ SoPX: x.SoPX })).filter((x: any) => x.SoPX);
                setPnOptions(allPN.filter((x) => !usedPN.has(x.SoPN)));
                setPxOptions(allPX.filter((x) => !usedPX.has(x.SoPX)));
            } catch {
                // ignore
            }
        }
        loadAux();
    }, []);

    const filtered = useMemo(() => (status ? rows.filter((r) => r.TrangThai === status) : rows), [rows, status]);

    async function updateStatus(maHd: string, newStatus: string) {
        await supabase.from('HoaDon').update({ TrangThai: newStatus }).eq('MaHD', maHd);
        setRows((prev) => prev.map((r) => (r.MaHD === maHd ? { ...r, TrangThai: newStatus } : r)));
    }

    function openCreate() {
        setEditing({ NgayLap: new Date().toISOString().slice(0, 10), MaKH: '', MaNCC: '', TongTien: 0, TrangThai: 'Chưa thanh toán', MaNV: me?.maNV || '' });
        setVoucherType('');
        setOpenForm(true);
    }

    function openEdit(row: Tables['HoaDon']) {
        setEditing({
            MaHD: row.MaHD,
            NgayLap: String(row.NgayLap),
            MaKH: row.MaKH || '',
            TongTien: Number(row.TongTien || 0),
            TrangThai: row.TrangThai || 'Chưa thanh toán',
            SoPX: row.SoPX || null,
            SoPN: row.SoPN || null,
            MaNV: row.MaNV || null,
        });
        setOpenForm(true);
    }

    async function saveForm() {
        if (!editing) return;
        if (!voucherType) {
            alert('Vui lòng chọn loại phiếu (Phiếu nhập hoặc Phiếu xuất).');
            return;
        }
        if (voucherType === 'PN' && !editing.SoPN) {
            alert('Vui lòng chọn Số phiếu nhập.');
            return;
        }
        if (voucherType === 'PX' && !editing.SoPX) {
            alert('Vui lòng chọn Số phiếu xuất.');
            return;
        }
        // Ensure mutually exclusive voucher fields
        const payload: any = { ...editing };
        if (voucherType === 'PN') payload.SoPX = null;
        if (voucherType === 'PX') payload.SoPN = null;
        // Map correct customer/supplier field: PX uses MaKH, PN ignores MaKH (server computes by voucher)
        if (voucherType === 'PN') {
            payload.MaKH = '';
            delete payload.MaNCC; // API không nhận MaNCC, để giữ phía client
        }
        const method = editing.MaHD ? 'PUT' : 'POST';
        const res = await fetch('/api/hoa-don', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((r) => r.json());
        if (res.error) return alert(res.error);
        // refresh list
        setOpenForm(false);
        setEditing(null);
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (status) params.set('status', status);
        const list = await fetch(`/api/hoa-don?${params.toString()}`).then((r) => r.json());
        setRows(list.data || []);
        setTotal(list.total || 0);
    }

    async function remove(maHd: string) {
        if (!confirm('Xóa hóa đơn này?')) return;
        const res = await fetch(`/api/hoa-don?id=${encodeURIComponent(maHd)}`, { method: 'DELETE' }).then((r) => r.json());
        if (res.error) return alert(res.error);
        setRows((prev) => prev.filter((r) => r.MaHD !== maHd));
    }

    function print(maHd: string) {
        window.open(`/hoa-don/print/${encodeURIComponent(maHd)}`, '_blank');
    }

    async function exportCSV() {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '10000');
        if (status) params.set('status', status);
        const res = await fetch(`/api/hoa-don?${params.toString()}`).then((r) => r.json());
        const data: Tables['HoaDon'][] = res.data || [];
        const headers = ['MaHD','NgayLap','MaKH','TongTien','TrangThai','SoPX','SoPN','MaNV'];
        const lines = [headers.join(',')].concat(
            data.map((r) => [r.MaHD, r.NgayLap, r.MaKH, r.TongTien, r.TrangThai, r.SoPX || '', r.SoPN || '', r.MaNV || '']
                .map((v) => (v === null || v === undefined ? '' : String(v).replace(/"/g, '""')))
                .map((v) => /[,"]/.test(v) ? '"' + v + '"' : v)
                .join(','))
        );
        const content = '\ufeff' + lines.join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hoa_don_' + new Date().toISOString().slice(0,10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportPDF() {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        window.open(`/hoa-don/print-all?${params.toString()}`, '_blank');
    }

    return (
        <div className="space-y-6 bg-[#f9f5f1] min-h-screen p-6 text-gray-800">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f5ebe0]">
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-2xl font-semibold text-[#d47b8a]">🧾 Quản lý hóa đơn</h1>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={exportCSV}>Xuất CSV</Button>
                        <Button variant="secondary" onClick={exportPDF}>Xuất PDF</Button>
                        <Button variant="pink" onClick={openCreate}>+ Thêm hóa đơn</Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-gray-500">Trạng thái</label>
                        <select
                            className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
                            value={status}
                            onChange={(e) => {
                                setPage(1);
                                setStatus(e.target.value);
                            }}
                        >
                            {TRANGTHAI.map((t) => (
                                <option key={t} value={t}>
                                    {t || 'Tất cả'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-gray-500">Hiển thị</label>
                        <select
                            className="bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
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

            <div className="rounded-2xl bg-white border border-[#f5ebe0] shadow-sm overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left bg-[#f9f5f1] text-[#b07c83] border-b border-[#f5ebe0]">
                            <th className="py-3 px-4 font-medium">Mã HD</th>
                            <th className="py-3 px-4 font-medium">Ngày lập</th>
                            <th className="py-3 px-4 font-medium">Mã KH</th>
                            <th className="py-3 px-4 font-medium">Tổng tiền</th>
                            <th className="py-3 px-4 font-medium">Trạng thái</th>
                            <th className="py-3 px-4" />
                        </tr>
                    </thead>

                    <tbody>
                        {loading &&
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-[#f5ebe0] animate-pulse">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="py-3 px-4">
                                            <div className="h-4 w-20 bg-[#f9dfe3] rounded" />
                                        </td>
                                    ))}
                                </tr>
                            ))}

                        {!loading &&
                            filtered.map((r) => (
                                <tr
                                    key={r.MaHD}
                                    className="border-b border-[#f5ebe0] hover:bg-[#fce7ec]/40 transition"
                                >
                                    <td className="py-3 px-4 font-medium">{r.MaHD}</td>
                                    <td className="py-3 px-4">{r.NgayLap}</td>
                                    <td className="py-3 px-4">{r.MaKH}</td>
                                    <td className="py-3 px-4 text-[#d47b8a] font-semibold">
                                        {r.TongTien?.toLocaleString('vi-VN')} ₫
                                    </td>
                                    <td
                                        className={`py-3 px-4 font-medium ${
                                            r.TrangThai === 'Đã thanh toán'
                                                ? 'text-green-600'
                                                : r.TrangThai === 'Chưa thanh toán'
                                                ? 'text-red-500'
                                                : 'text-yellow-600'
                                        }`}
                                    >
                                        {r.TrangThai}
                                    </td>
                                    <td className="py-3 px-4 flex gap-2 items-center">
                                        <select
                                            className="bg-[#fce7ec] border border-[#f9dfe3] rounded-lg px-2 py-1 text-gray-800 focus:ring-2 focus:ring-[#d47b8a] outline-none transition"
                                            value={r.TrangThai}
                                            onChange={(e) => updateStatus(r.MaHD, e.target.value)}
                                        >
                                            {TRANGTHAI.filter(Boolean).map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                        <Button variant="secondary" onClick={() => openEdit(r)}>Sửa</Button>
                                        <Button variant="danger" onClick={() => remove(r.MaHD)}>Xóa</Button>
                                        <Button onClick={() => print(r.MaHD)}>In</Button>
                                    </td>
                                </tr>
                            ))}

                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-10 text-center text-gray-500 bg-white">
                                    <div className="mx-auto h-10 w-10 rounded-full bg-[#fce7ec] mb-3" />
                                    Không có dữ liệu
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center pt-4">
                <Pagination page={page} limit={limit} total={total} onChange={setPage} />
            </div>

            <Modal open={openForm} onClose={() => setOpenForm(false)} title={editing?.MaHD ? 'Cập nhật hóa đơn' : 'Thêm hóa đơn'}>
                {editing && (
                    <div className="space-y-3">
                        {/* Mã hóa đơn được tự động tạo trên server (HDxx) */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-500">Ngày lập</label>
                            <input type="date" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.NgayLap} onChange={(e) => setEditing({ ...editing, NgayLap: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                {voucherType === 'PN' ? (
                                    <>
                                        <label className="block text-sm mb-1 text-gray-500">Mã NCC</label>
                                        <input className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.MaNCC || ''} onChange={(e) => setEditing({ ...editing, MaNCC: e.target.value })} />
                                    </>
                                ) : (
                                    <>
                                        <label className="block text-sm mb-1 text-gray-500">Mã KH</label>
                                        <input className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.MaKH} onChange={(e) => setEditing({ ...editing, MaKH: e.target.value })} />
                                    </>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Tổng tiền</label>
                                <input type="number" className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.TongTien} readOnly />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Trạng thái</label>
                                <select className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.TrangThai} onChange={(e) => setEditing({ ...editing, TrangThai: e.target.value })}>
                                    {TRANGTHAI.filter(Boolean).map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Mã NV</label>
                                <input className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.MaNV || me?.maNV || ''} readOnly />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-gray-500">Chọn loại phiếu</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="voucherType" checked={voucherType === 'PN'} onChange={() => { setVoucherType('PN'); setEditing({ ...editing, SoPN: '', SoPX: null, TongTien: 0 }); }} />
                                    <span>Phiếu nhập chưa lập hóa đơn</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="voucherType" checked={voucherType === 'PX'} onChange={() => { setVoucherType('PX'); setEditing({ ...editing, SoPX: '', SoPN: null, TongTien: 0 }); }} />
                                    <span>Phiếu xuất chưa lập hóa đơn</span>
                                </label>
                            </div>
                        </div>

                        {voucherType === 'PN' && (
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Số PN</label>
                                <select className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.SoPN || ''} onChange={async (e) => {
                                    const val = e.target.value;
                                    setEditing((prev) => ({ ...(prev as any), SoPN: val, SoPX: null }));
                                    if (val) {
                                        try {
                                            const res = await fetch(`/api/phieu-nhap/total?sopn=${encodeURIComponent(val)}`).then((r) => r.json());
                                            const total = Number(res.total || 0);
                                            setEditing((prev) => ({ ...(prev as any), TongTien: total }));
                                        } catch {}
                                    } else {
                                        setEditing((prev) => ({ ...(prev as any), TongTien: 0 }));
                                    }
                                }}>
                                    <option value="">-- Chọn phiếu nhập --</option>
                                    {pnOptions.map((opt) => (
                                        <option key={opt.SoPN} value={opt.SoPN}>{opt.SoPN}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {voucherType === 'PX' && (
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">Số PX</label>
                                <select className="w-full bg-[#fce7ec] border border-[#f9dfe3] rounded-xl px-3 py-2" value={editing.SoPX || ''} onChange={async (e) => {
                                    const val = e.target.value;
                                    setEditing((prev) => ({ ...(prev as any), SoPX: val, SoPN: null }));
                                    if (val) {
                                        try {
                                            const res = await fetch(`/api/phieu-xuat/total?sopx=${encodeURIComponent(val)}`).then((r) => r.json());
                                            const total = Number(res.total || 0);
                                            setEditing((prev) => ({ ...(prev as any), TongTien: total }));
                                        } catch {}
                                    } else {
                                        setEditing((prev) => ({ ...(prev as any), TongTien: 0 }));
                                    }
                                }}>
                                    <option value="">-- Chọn phiếu xuất --</option>
                                    {pxOptions.map((opt) => (
                                        <option key={opt.SoPX} value={opt.SoPX}>{opt.SoPX}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="secondary" onClick={() => setOpenForm(false)}>Hủy</Button>
                            <Button onClick={saveForm}>{editing.MaHD ? 'Lưu' : 'Thêm'}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

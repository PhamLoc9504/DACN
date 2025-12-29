'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatVietnamDate } from '@/lib/dateUtils';
import { FileText, Printer, Building2, User, ShieldCheck, ShieldAlert } from 'lucide-react';
import { UserRole, hasAnyRole, getRoleDisplayName } from '@/lib/roles';
import QRCode from 'react-qr-code';
import FaceSignModal from '@/components/FaceSignModal';
import ErrorDisplay from '@/components/ErrorDisplay';
import { handleApiError, formatErrorForDisplay } from '@/lib/errorHandler';

// --- GIỮ NGUYÊN TYPE DEFINITIONS ---
type HoaDon = {
    MaHD: string;
    NgayLap: string | null;
    MaKH: string | null;
    TongTien: number | null;
    TrangThai: string;
    SoPX: string | null;
    SoPN: string | null;
    MaNV: string | null;
};

type ChiTiet = {
    MaHH: string;
    TenHH: string | null;
    SoLuong: number | null;
    DonGia: number | null;
    TongTien: string;
};

type SignatureInfo = {
    signed: boolean;
    valid: boolean;
    status?: string | null;
    signedBy?: string | null;
    signedByName?: string | null;
    signedByTitle?: string | null;
    signedByDisplay?: string | null;
    signedAt?: string | null;
    hash?: string | null;
    signature?: string | null;
};

export default function EInvoicePage() {
    // --- GIỮ NGUYÊN LOGIC (HOOKS, STATE, HANDLERS) ---
    const params = useParams();
    const mahd = params.id as string;
    const [hoaDon, setHoaDon] = useState<HoaDon | null>(null);
    const [chiTiet, setChiTiet] = useState<ChiTiet[]>([]);
    const [loading, setLoading] = useState(true);
    const [qrValue, setQrValue] = useState<string>('');
    const [signInfo, setSignInfo] = useState<SignatureInfo | null>(null);
    const [signLoading, setSignLoading] = useState(false);
    const [signError, setSignError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [error, setError] = useState<ReturnType<typeof formatErrorForDisplay> | null>(null);
    const [supplierName, setSupplierName] = useState<string>('');

    useEffect(() => {
        async function load() {
            try {
                setError(null);
                const [hdRes, ctRes] = await Promise.all([
                    fetch(`/api/hoa-don?id=${mahd}`, { credentials: 'include' }).then((r) => r.json()),
                    fetch(`/api/hoa-don/${mahd}/chi-tiet`, { credentials: 'include' })
                        .then((r) => (r.ok ? r.json() : { data: [], error: null }))
                        .catch((err) => ({ data: [], error: err.message })),
                ]);

                if (hdRes.error) {
                    const appError = handleApiError(hdRes);
                    setError(formatErrorForDisplay(appError));
                    setLoading(false);
                    return;
                }
                if (!hdRes.data) {
                    const appError = handleApiError({ error: 'Không tìm thấy hóa đơn', statusCode: 404 });
                    setError(formatErrorForDisplay(appError));
                    setLoading(false);
                    return;
                }
                setHoaDon(hdRes.data);

                if (ctRes.error) {
                    console.error('Lỗi khi tải chi tiết:', ctRes.error);
                    setChiTiet([]);
                } else {
                    setChiTiet(ctRes.data || []);
                }
            } catch (err: any) {
                console.error('Lỗi khi tải dữ liệu:', err);
                const appError = handleApiError(err);
                setError(formatErrorForDisplay(appError));
            } finally {
                setLoading(false);
            }
        }
        if (mahd) load();
    }, [mahd]);

    useEffect(() => {
        if (!hoaDon) return;
        if (typeof window === 'undefined') return;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const url = `${baseUrl}/hoa-don/e-invoice/${encodeURIComponent(hoaDon.MaHD)}`;
        setQrValue(url);
    }, [hoaDon]);

    useEffect(() => {
        async function loadSupplierName() {
            if (!hoaDon?.SoPN) {
                setSupplierName('');
                return;
            }
            try {
                const pnRes = await fetch(`/api/phieu-nhap/${encodeURIComponent(hoaDon.SoPN)}`, { credentials: 'include' });
                const pnData = await pnRes.json().catch(() => ({}));
                const maNcc = pnData?.phieu?.MaNCC as string | undefined;
                if (!maNcc) {
                    setSupplierName('');
                    return;
                }

                const nccRes = await fetch(`/api/nha-cc/${encodeURIComponent(maNcc)}`, { credentials: 'include' });
                const nccData = await nccRes.json().catch(() => ({}));
                setSupplierName((nccData?.data?.TenNCC as string | undefined) || '');
            } catch (e) {
                console.error(e);
                setSupplierName('');
            }
        }

        void loadSupplierName();
    }, [hoaDon]);

    useEffect(() => {
        async function loadMe() {
            try {
                const res = await fetch('/api/me', { credentials: 'include' });
                if (!res.ok) return;
                const data = await res.json();
                setUserRole(data.vaiTro || null);
            } catch (e) {
                console.error(e);
            }
        }
        loadMe();
    }, []);

    useEffect(() => {
        async function loadSignature() {
            if (!mahd) return;
            try {
                const res = await fetch(`/api/hoa-don/e-invoice/sign?id=${encodeURIComponent(mahd)}`, { credentials: 'include' });
                if (!res.ok) {
                    setSignInfo(null);
                    return;
                }
                const data = await res.json();
                if (!data.signed) {
                    setSignInfo({ signed: false, valid: false, status: data.reason || 'NOT_SIGNED' });
                } else {
                    setSignInfo({
                        signed: true,
                        valid: Boolean(data.valid),
                        status: data.status,
                        signedBy: data.signedBy,
                        signedByName: data.signedByName,
                        signedByTitle: data.signedByTitle,
                        signedByDisplay: data.signedByDisplay,
                        signedAt: data.signedAt,
                        hash: data.hash,
                        signature: data.signature,
                    });
                }
            } catch (e) {
                console.error(e);
                setSignInfo(null);
            }
        }
        loadSignature();
    }, [mahd]);

    const tongTien = hoaDon?.TongTien || 0;

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Đang tải dữ liệu hóa đơn...</div>;
    if (!hoaDon) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 font-medium">Không tìm thấy thông tin hóa đơn.</div>;

    const canSignByStatus = hoaDon.TrangThai === 'Đã thanh toán';
    const canSignByRole = hasAnyRole(userRole, [UserRole.ADMIN, UserRole.ACCOUNTANT]);
    const canSign = canSignByStatus && canSignByRole;
    const signingOrganizationName = 'CÔNG TY TNHH KHO HÀNG';

    const isInbound = Boolean(hoaDon.SoPN);
    const documentTitle = isInbound ? 'Phiếu Nhập Kho' : 'Hóa Đơn Điện Tử';
    const documentSubtitle = isInbound ? 'Biên bản giao nhận / xác nhận nhập kho' : 'Bản thể hiện của hóa đơn điện tử';
    const actionPrintLabel = isInbound ? 'In phiếu nhập' : 'In hóa đơn';
    const sellerTitle = isInbound ? 'Nhà cung cấp (Seller)' : 'Bên bán (Seller)';
    const buyerTitle = isInbound ? 'Bên nhận hàng (Buyer)' : 'Bên mua (Buyer)';
    const signatureLabel = isInbound
        ? `Xác nhận nhập kho (${getRoleDisplayName(userRole)})`
        : 'Chữ ký người bán';

    async function handleSign() {
        if (!hoaDon) return;
        setSignLoading(true);
        setSignError(null);
        try {
            const res = await fetch('/api/hoa-don/e-invoice/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: hoaDon.MaHD }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || `Lỗi ký số (${res.status})`);
            setSignInfo({
                signed: true,
                valid: Boolean(data.valid),
                status: data.status,
                signedBy: data.signedBy,
                signedByName: data.signedByName,
                signedByTitle: data.signedByTitle,
                signedByDisplay: data.signedByDisplay,
                signedAt: data.signedAt,
                hash: data.hash,
                signature: data.signature,
            });
        } catch (e: any) {
            console.error(e);
            setSignError(e.message || 'Ký số thất bại');
        } finally {
            setSignLoading(false);
        }
    }

    // --- GIAO DIỆN MỚI ---
    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4 print:bg-white print:p-0 print:m-0 font-sans text-slate-900">

            {/* Action Bar (Hidden on Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    Quản lý hóa đơn
                </h1>
                <button
                    onClick={() => window.print()}
                    className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                >
                    <Printer className="w-4 h-4" />
                    {actionPrintLabel}
                </button>
            </div>

            {/* Lỗi tải dữ liệu (nếu có) */}
            {error && (
                <div className="max-w-4xl mx-auto mb-6 print:hidden">
                    <ErrorDisplay
                        error={error}
                        onDismiss={() => setError(null)}
                    />
                </div>
            )}

            {/* Main Invoice Paper */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm overflow-hidden print:shadow-none print:max-w-none print:w-full">

                {/* Decorative Top Border */}
                <div className="h-2 bg-gradient-to-r from-indigo-600 to-blue-500 w-full"></div>

                <div className="p-8 md:p-12 print:p-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-8 mb-8 gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight uppercase">{documentTitle}</span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">{documentSubtitle}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Mã hóa đơn</div>
                            <div className="text-lg font-mono font-bold text-slate-900">#{hoaDon.MaHD}</div>
                            <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${hoaDon.TrangThai === 'Đã thanh toán' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                hoaDon.TrangThai === 'Chưa thanh toán' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                {hoaDon.TrangThai}
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid md:grid-cols-2 gap-10 mb-10">
                        {/* Seller */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> {sellerTitle}
                            </h3>
                            <div>
                                {isInbound ? (
                                    <>
                                        <div className="text-lg font-bold text-slate-900 mb-1">{supplierName || 'Nhà cung cấp lẻ'}</div>
                                        <div className="text-sm text-slate-600 space-y-1">
                                            <p className="italic">(Thông tin nhà cung cấp lấy từ Phiếu nhập)</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-lg font-bold text-slate-900 mb-1">CÔNG TY TNHH KHO HÀNG</div>
                                        <div className="text-sm text-slate-600 space-y-1">
                                            <p>123 Đường ABC, Quận XYZ, TP.HCM</p>
                                            <p><span className="font-medium text-slate-900">MST:</span> 0123456789</p>
                                            <p><span className="font-medium text-slate-900">SĐT:</span> 0123456789</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Buyer */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <User className="w-3 h-3" /> {buyerTitle}
                            </h3>
                            <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                <div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
                                    <span className="text-slate-500">{isInbound ? 'Đơn vị:' : 'Khách hàng:'}</span>
                                    <span className="font-mono font-medium text-slate-900">
                                        {isInbound ? signingOrganizationName : (hoaDon.MaKH ? hoaDon.MaKH : 'Khách lẻ (Vãng lai)')}
                                    </span>

                                    <span className="text-slate-500">Ngày lập:</span>
                                    <span className="font-medium text-slate-900">{hoaDon.NgayLap ? formatVietnamDate(hoaDon.NgayLap) : '-'}</span>

                                    <span className="text-slate-500">Nhân viên:</span>
                                    <span className="font-medium text-slate-900">{hoaDon.MaNV || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-10">
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">STT</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Mã hàng</th>
                                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên hàng hóa, dịch vụ</th>
                                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">SL</th>
                                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Đơn giá</th>
                                        <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {chiTiet.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">Chưa có dữ liệu hàng hóa</td>
                                        </tr>
                                    ) : (
                                        chiTiet.map((ct, i) => {
                                            const tongTienValue = typeof ct.TongTien === 'string' ? parseFloat(ct.TongTien) || 0 : (ct.TongTien || 0);
                                            return (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 px-4 text-sm text-slate-500 text-center">{i + 1}</td>
                                                    <td className="py-3 px-4 text-sm font-mono text-slate-600">{ct.MaHH || '-'}</td>
                                                    <td className="py-3 px-4 text-sm text-slate-900 font-medium">{ct.TenHH || '-'}</td>
                                                    <td className="py-3 px-4 text-sm text-slate-600 text-right">{ct.SoLuong || 0}</td>
                                                    <td className="py-3 px-4 text-sm text-slate-600 text-right font-mono">{Number(ct.DonGia || 0).toLocaleString('vi-VN')}</td>
                                                    <td className="py-3 px-4 text-sm text-slate-900 text-right font-mono font-semibold">{tongTienValue.toLocaleString('vi-VN')}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Total Section */}
                        <div className="flex justify-end mt-4">
                            <div className="w-full md:w-1/2 lg:w-1/3 bg-slate-50 p-6 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-500 font-medium">Tổng tiền thanh toán:</span>
                                </div>
                                <div className="flex justify-end items-baseline gap-1">
                                    <span className="text-3xl font-bold text-indigo-700">{tongTien.toLocaleString('vi-VN')}</span>
                                    <span className="text-sm font-semibold text-slate-400">VND</span>
                                </div>
                                <div className="text-right text-xs text-slate-400 mt-1 italic">
                                    (Đã bao gồm thuế GTGT nếu có)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: Signature & QR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 border-t border-slate-100 pt-10 px-12 pb-12">
                    {/* Left: QR Code */}
                    <div>
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                                <QRCode value={qrValue || hoaDon.MaHD} size={100} bgColor="#ffffff" fgColor="#1e293b" />
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-xs font-mono text-slate-400 break-all max-w-[200px]">{hoaDon.MaHD}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{isInbound ? 'Quét để tra cứu phiếu nhập' : 'Quét để tra cứu hóa đơn gốc'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Digital Signature */}
                    <div className="flex flex-col items-center md:items-end">
                        <div className="text-sm font-bold text-slate-900 uppercase mb-4">{signatureLabel}</div>

                        {/* Signature Stamp Area */}
                        <div className="relative w-full max-w-[280px] min-h-[160px] flex flex-col items-center justify-center">
                            {signInfo?.signed && signInfo.valid ? (
                                <div className="relative p-6 border-4 border-emerald-600 rounded-lg text-emerald-700 text-center transform rotate-[-2deg] opacity-90 mix-blend-multiply bg-emerald-50/50">
                                    <div className="absolute top-0 left-0 w-full h-full border border-emerald-600/30 m-1 rounded pointer-events-none"></div>
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <ShieldCheck className="w-5 h-5" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Signature Valid</span>
                                    </div>
                                    <div className="text-[10px] font-mono mb-2 border-b border-emerald-600/50 pb-1">DIGITALLY SIGNED</div>
                                    <div className="font-bold text-sm uppercase leading-tight mb-1">{signingOrganizationName}</div>
                                    <div className="text-[10px]">Ngày ký: {signInfo.signedAt ? new Date(signInfo.signedAt).toLocaleDateString('vi-VN') : ''}</div>
                                    <div className="text-[9px] text-emerald-800/70 mt-1 font-mono">
                                        Người ký: {signInfo.signedByDisplay || signInfo.signedByName || signInfo.signedBy || ''}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50">
                                    <p className="text-xs text-slate-400 font-medium mb-3">Chưa có chữ ký số</p>

                                    {/* Action Button for Signing - Hidden on Print */}
                                    <div className="print:hidden">
                                        {!canSignByRole ? (
                                            <span className="text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded">Cần quyền Quản lý/Kế toán</span>
                                        ) : !canSignByStatus ? (
                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">Cần thanh toán trước</span>
                                        ) : (
                                            <button
                                                onClick={() => setShowFaceModal(true)}
                                                disabled={signLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                                            >
                                                {signLoading ? (
                                                    <span className="animate-pulse">Đang xử lý...</span>
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="w-3 h-3" /> Ký số ngay
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {signError && (
                                <div className="mt-3 text-xs text-red-600 flex items-center gap-1 bg-red-50 px-3 py-2 rounded border border-red-100">
                                    <ShieldAlert className="w-3 h-3" /> {signError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* System Footer */}
                <div className="mt-12 text-center border-t border-slate-100 pt-6 pb-8">
                    <p className="text-[10px] text-slate-400">
                        {isInbound ? 'Phiếu nhập kho này được hệ thống lưu vết để phục vụ đối soát nội bộ.' : 'Hóa đơn điện tử này có giá trị pháp lý theo quy định của pháp luật.'}
                        Được khởi tạo tự động lúc {new Date().toLocaleString('vi-VN')}
                    </p>
                </div>
            </div>

            <FaceSignModal
                open={showFaceModal}
                onClose={() => setShowFaceModal(false)}
                onSuccess={async () => {
                    await handleSign();
                }}
            />
            {/* Print Styles Override */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
}
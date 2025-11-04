import Button from '@/components/Button';
import { getServerSupabase } from '@/lib/supabaseClient';

async function getInvoice(id: string) {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('hoadon').select('*').eq('mahd', id).limit(1).maybeSingle();
    if (error || !data) return null;
    return {
        MaHD: data.mahd,
        NgayLap: data.ngaylap,
        MaKH: data.makh,
        TongTien: data.tongtien,
        TrangThai: data.trangthai,
        SoPX: data.sopx,
        SoPN: data.sopn,
        MaNV: data.manv,
    } as const;
}

function PrintActions() {
    'use client';
    return (
        <div className="print:hidden mb-4">
            <Button onClick={() => window.print()}>In hóa đơn</Button>
        </div>
    );
}

export default async function PrintInvoicePage({ params }: { params: { id: string } }) {
    const data = await getInvoice(params.id);
    if (!data) return <div className="p-6">Không tìm thấy hóa đơn</div>;
    return (
        <div className="p-6 bg-white text-[#333]">
            <PrintActions />
            <div className="max-w-2xl mx-auto border rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="text-xl font-semibold">HÓA ĐƠN BÁN HÀNG</div>
                        <div className="text-sm text-gray-500">Mã HD: {data.MaHD}</div>
                    </div>
                    <div className="text-right text-sm">
                        <div>Ngày lập: {data.NgayLap}</div>
                        <div>Trạng thái: {data.TrangThai}</div>
                    </div>
                </div>

                <div className="mb-6 text-sm">
                    <div>Khách hàng: {data.MaKH}</div>
                    <div>Nhân viên: {data.MaNV || '-'}</div>
                    <div>Số PX: {data.SoPX || '-'}</div>
                    <div>Số PN: {data.SoPN || '-'}</div>
                </div>

                <div className="text-right text-lg font-semibold">
                    Tổng tiền: {Number(data.TongTien || 0).toLocaleString('vi-VN')} ₫
                </div>

                <div className="mt-10 text-sm text-gray-500">
                    Cảm ơn quý khách đã mua hàng.
                </div>
            </div>
        </div>
    );
}



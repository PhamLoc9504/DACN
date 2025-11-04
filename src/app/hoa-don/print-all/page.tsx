import Button from '@/components/Button';

async function getData(status?: string) {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '10000');
    if (status) params.set('status', status);
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/hoa-don?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return { data: [] } as any;
    return res.json();
}

function PrintActions() {
    'use client';
    return (
        <div className="print:hidden mb-4">
            <Button onClick={() => window.print()}>In ra PDF</Button>
        </div>
    );
}

export default async function PrintAllPage({ searchParams }: { searchParams: { status?: string } }) {
    const status = searchParams?.status;
    const { data } = await getData(status);
    return (
        <div className="p-6 bg-white text-[#333]">
            <PrintActions />
            <div className="max-w-5xl mx-auto">
                <div className="text-xl font-semibold mb-4">Danh sách hóa đơn {status ? `(Trạng thái: ${status})` : ''}</div>
                <table className="w-full text-sm border">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left p-2 border">Mã HD</th>
                            <th className="text-left p-2 border">Ngày lập</th>
                            <th className="text-left p-2 border">Mã KH</th>
                            <th className="text-right p-2 border">Tổng tiền</th>
                            <th className="text-left p-2 border">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((r: any) => (
                            <tr key={r.MaHD}>
                                <td className="p-2 border">{r.MaHD}</td>
                                <td className="p-2 border">{r.NgayLap}</td>
                                <td className="p-2 border">{r.MaKH}</td>
                                <td className="p-2 border text-right">{Number(r.TongTien || 0).toLocaleString('vi-VN')} ₫</td>
                                <td className="p-2 border">{r.TrangThai}</td>
                            </tr>
                        ))}
                        {(!data || data.length === 0) && (
                            <tr>
                                <td className="p-4 text-center" colSpan={5}>Không có dữ liệu</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}



import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const supabase = getServerSupabase();

    // Tổng số khách hàng
    const { count: totalCustomers, error: customerError } = await supabase
      .from('KhachHang')
      .select('MaKH', { count: 'exact', head: true });
    if (customerError) throw customerError;

    // Số khách có tài khoản
    const { count: customersWithAccount, error: accountError } = await supabase
      .from('TaiKhoanKhachHang')
      .select('MaKH', { count: 'exact', head: true });
    if (accountError) throw accountError;

    // Tổng số hóa đơn và tổng doanh thu
    const { data: invoices, error: invoiceError } = await supabase
      .from('HoaDon')
      .select('TongTien');
    if (invoiceError) throw invoiceError;

    const totalInvoices = invoices?.length || 0;
    const totalRevenue = (invoices || []).reduce((sum, row: any) => {
      const v = Number(row.TongTien ?? 0);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);

    return NextResponse.json({
      totalCustomers: totalCustomers ?? 0,
      customersWithAccount: customersWithAccount ?? 0,
      totalInvoices,
      totalRevenue,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

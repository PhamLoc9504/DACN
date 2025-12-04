import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any) {
	return {
		MaVC: row.mavc,
		MaHD: row.mahd,
		NgayGiao: row.ngaygiao,
		DiaChiNhan: row.diachinhan,
		TrangThai: row.trangthai,
	};
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const mahd = searchParams.get('mahd')?.trim();
		const q = searchParams.get('q')?.trim();
		const status = searchParams.get('status')?.trim();
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		
		const supabase = getServerSupabase();
		
		// Build query
		let query = supabase
			.from('dovi_vanchuyen')
			.select('*', { count: 'exact' })
			.order('ngaygiao', { ascending: false });
		
		if (mahd) {
			query = query.eq('mahd', mahd);
		}
		
		if (q) {
			query = query.or(`mavc.ilike.%${q}%,mahd.ilike.%${q}%,diachinhan.ilike.%${q}%`);
		}
		
		if (status) {
			query = query.eq('trangthai', status);
		}
		
		// Pagination
		const from = (page - 1) * limit;
		const to = from + limit - 1;
		query = query.range(from, to);
		
		const { data, error, count } = await query;
		if (error) throw error;
		
		// Lấy thông tin hóa đơn và khách hàng cho từng vận chuyển
		const enrichedData = await Promise.all(
			(data || []).map(async (vc: any) => {
				const result: any = toCamel(vc);
				let customerAddress = vc.diachinhan; // Mặc định dùng địa chỉ nhận từ bảng vận chuyển
				
				if (vc.mahd) {
					// Lấy thông tin hóa đơn
					const { data: hd } = await supabase
						.from('hoadon')
						.select('*')
						.eq('mahd', vc.mahd)
						.single();
					
					if (hd) {
						result.HoaDon = {
							MaHD: hd.mahd,
							NgayLap: hd.ngaylap,
							MaKH: hd.makh,
							TongTien: hd.tongtien,
							TrangThai: hd.trangthai,
							HinhThucGiao: hd.hinhthucgiao,
							PhuongThucTT: hd.phuongthuctt,
						};
						
						// Lấy thông tin khách hàng
						if (hd.makh) {
							const { data: kh } = await supabase
								.from('khachhang')
								.select('*')
								.eq('makh', hd.makh)
								.single();
							
							if (kh) {
								result.KhachHang = {
									MaKH: kh.makh,
									TenKH: kh.tenkh,
									SDT: kh.sdt,
									// Không trả về địa chỉ trong thông tin khách hàng nữa
								};
								
								// Ưu tiên dùng địa chỉ từ khách hàng làm địa chỉ nhận
								if (kh.diachi) {
									customerAddress = kh.diachi;
								}
							}
						}
					}
				}
				
				// Cập nhật địa chỉ nhận từ thông tin khách hàng
				result.DiaChiNhan = customerAddress;
				
				return result;
			})
		);
		
		return NextResponse.json({ 
			data: enrichedData,
			total: count || 0
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { MaHD, NgayGiao, TrangThai = 'Chờ xử lý' } = body;
		
		if (!MaHD) {
			return NextResponse.json({ error: 'Missing MaHD' }, { status: 400 });
		}
		
		const supabase = getServerSupabase();
		
		// 1. Lấy thông tin hóa đơn
		const { data: hoadon, error: hdError } = await supabase
			.from('hoadon')
			.select('*')
			.eq('mahd', MaHD)
			.single();
		
		if (hdError) throw hdError;
		if (!hoadon) {
			return NextResponse.json({ error: 'Hóa đơn không tồn tại' }, { status: 404 });
		}
		
		// 2. Lấy địa chỉ từ khách hàng (nếu có)
		let diaChiNhan = '';
		if (hoadon.makh) {
			const { data: khachhang } = await supabase
				.from('khachhang')
				.select('diachi')
				.eq('makh', hoadon.makh)
				.single();
			
			if (khachhang?.diachi) {
				diaChiNhan = khachhang.diachi;
			}
		}
		
		// 3. Tạo mã vận chuyển tự động
		const { data: lastVC } = await supabase
			.from('dovi_vanchuyen')
			.select('mavc')
			.order('mavc', { ascending: false })
			.limit(1)
			.single();
		
		let nextMaVC = 'VC001';
		if (lastVC?.mavc) {
			const match = lastVC.mavc.match(/VC(\d+)/);
			if (match) {
				const num = parseInt(match[1]) + 1;
				nextMaVC = 'VC' + num.toString().padStart(3, '0');
			}
		}
		
		// 4. Tạo bản ghi vận chuyển
		const { data, error } = await supabase
			.from('dovi_vanchuyen')
			.insert({
				mavc: nextMaVC,
				mahd: MaHD,
				ngaygiao: NgayGiao || new Date().toISOString().split('T')[0],
				diachinhan: diaChiNhan,
				trangthai: TrangThai,
			})
			.select()
			.single();
		
		if (error) throw error;
		
		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function PUT(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const mavc = searchParams.get('mavc');
		if (!mavc) {
			return NextResponse.json({ error: 'Missing MaVC' }, { status: 400 });
		}
		
		const body = await req.json();
		const { TrangThai, DiaChiNhan } = body;
		
		if (!TrangThai && !DiaChiNhan) {
			return NextResponse.json({ error: 'Missing update data' }, { status: 400 });
		}
		
		const supabase = getServerSupabase();
		
		// Xây dựng object update
		const updateData: any = {};
		if (TrangThai) updateData.trangthai = TrangThai;
		if (DiaChiNhan) updateData.diachinhan = DiaChiNhan;
		
		// Cập nhật vận chuyển
		const { data, error } = await supabase
			.from('dovi_vanchuyen')
			.update(updateData)
			.eq('mavc', mavc)
			.select()
			.single();
		
		if (error) throw error;
		
		// Nếu trạng thái là "Đã giao" và là COD, cập nhật hóa đơn thành "Đã thanh toán"
		if (TrangThai === 'Đã giao' && data?.mahd) {
			const { data: hdData } = await supabase
				.from('hoadon')
				.select('phuongthuctt, trangthai')
				.eq('mahd', data.mahd)
				.single();
			
			// Nếu là COD và chưa thanh toán, cập nhật thành đã thanh toán
			if (hdData?.phuongthuctt === 'COD' && hdData?.trangthai === 'Chưa thanh toán') {
				await supabase
					.from('hoadon')
					.update({ trangthai: 'Đã thanh toán' })
					.eq('mahd', data.mahd);
			}
		}
		
		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}
import { getServerSupabase } from './supabaseClient';
import { getSessionFromCookies } from './session';
import { headers } from 'next/headers';

export type AuditAction = 
  | 'DANG_NHAP' 
  | 'DANG_XUAT' 
  | 'TAO' 
  | 'SUA' 
  | 'XOA' 
  | 'XEM' 
  | 'XUAT_BAO_CAO'
  | 'CAP_NHAT_TRANG_THAI'
  | 'XUAT_CSV'
  | 'XUAT_PDF';

export type AuditTable =
	| 'hoadon'
	| 'phieunhap'
	| 'phieuxuat'
	| 'hanghoa'
	| 'khachhang'
	| 'nhacc'
	| 'nhanvien'
	| 'taikhoan'
	| 'backuplog';

interface AuditLogParams {
  action: AuditAction;
  table?: AuditTable;
  recordId?: string;
  detail?: string | Record<string, any>;
  status?: 'THANH_CONG' | 'THAT_BAI' | 'LOI';
  error?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Ghi log hoạt động của nhân viên
 * Tuân thủ Luật An ninh mạng 2018 - Yêu cầu ghi log truy cập hệ thống
 */
export async function logActivity(params: AuditLogParams): Promise<void> {
  try {
    const session = await getSessionFromCookies();
    if (!session) return; // Không log nếu không có session

    const supabase = getServerSupabase();
    
    // Lấy thông tin IP và User-Agent từ headers
    const headersList = await headers();
    const ipAddress = params.ipAddress || 
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      headersList.get('x-real-ip') || 
      'unknown';
    const userAgent = params.userAgent || headersList.get('user-agent') || 'unknown';

    // Lấy MaNV từ tài khoản
    const { data: tkData } = await supabase
      .from('taikhoan')
      .select('manv')
      .eq('matk', session.maTk)
      .limit(1)
      .maybeSingle();

    const detailStr = typeof params.detail === 'string' 
      ? params.detail 
      : JSON.stringify(params.detail || {});

    await supabase.from('audit_log').insert({
      matk: session.maTk,
      manv: tkData?.manv || null,
      loai_hanh_dong: params.action,
      bang: params.table || null,
      id_record: params.recordId || null,
      chi_tiet: detailStr,
      ip_address: ipAddress,
      user_agent: userAgent,
      trang_thai: params.status || 'THANH_CONG',
      loi: params.error || null,
    });
  } catch (error) {
    // Không throw error để không làm gián đoạn flow chính
    // Có thể log vào console hoặc external service
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Helper để log thao tác CRUD
 */
export async function logCRUD(
  action: 'TAO' | 'SUA' | 'XOA',
  table: AuditTable,
  recordId: string,
  oldValue?: any,
  newValue?: any
): Promise<void> {
  const detail: Record<string, any> = {};
  if (oldValue) detail.old_value = oldValue;
  if (newValue) detail.new_value = newValue;
  
  await logActivity({
    action,
    table,
    recordId,
    detail: Object.keys(detail).length > 0 ? detail : undefined,
  });
}

/**
 * Helper để log đăng nhập/đăng xuất
 */
export async function logAuth(
  action: 'DANG_NHAP' | 'DANG_XUAT',
  success: boolean,
  username?: string,
  error?: string
): Promise<void> {
  await logActivity({
    action,
    status: success ? 'THANH_CONG' : 'THAT_BAI',
    detail: username ? { username } : undefined,
    error,
  });
}


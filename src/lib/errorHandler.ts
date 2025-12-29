/**
 * Error handling utilities
 * Cung cấp các hàm xử lý lỗi thống nhất cho toàn bộ ứng dụng
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Tạo error object chuẩn từ các loại lỗi khác nhau
 */
export function createError(
  message: string,
  code?: string,
  statusCode: number = 500,
  details?: unknown
): AppError {
  return {
    message,
    code,
    statusCode,
    details,
  };
}

/**
 * Xử lý lỗi từ API response
 */
export function handleApiError(error: unknown): AppError {
  if (error instanceof Error) {
    // Lỗi từ network hoặc JavaScript
    if (error.message.includes('fetch')) {
      return createError(
        'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
        'NETWORK_ERROR',
        0
      );
    }
    return createError(error.message, 'UNKNOWN_ERROR', 500);
  }

  if (typeof error === 'object' && error !== null && 'error' in error) {
    const apiError = error as { error: string; code?: string; statusCode?: number };
    return createError(
      apiError.error,
      apiError.code,
      apiError.statusCode || 500
    );
  }

  return createError(
    'Đã xảy ra lỗi không xác định',
    'UNKNOWN_ERROR',
    500
  );
}

/**
 * Lấy thông báo lỗi thân thiện với người dùng
 */
export function getUserFriendlyMessage(error: AppError | string): string {
  if (typeof error === 'string') {
    return error;
  }

  // Map các mã lỗi phổ biến thành thông báo thân thiện
  const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Không thể kết nối đến server. Vui lòng thử lại sau.',
    UNAUTHORIZED: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
    NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu.',
    VALIDATION_ERROR: 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.',
    DUPLICATE_ERROR: 'Dữ liệu đã tồn tại trong hệ thống.',
    INSUFFICIENT_STOCK: 'Số lượng hàng trong kho không đủ.',
    DATABASE_ERROR: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.',
  };

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  return error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

/**
 * Log error để debugging (chỉ trong development)
 */
export function logError(error: AppError | Error, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]`, error);
  }

  // Trong production, có thể gửi đến error tracking service
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(error, context);
  // }
}

/**
 * Kiểm tra xem error có phải là lỗi có thể retry không
 */
export function isRetryableError(error: AppError): boolean {
  const retryableCodes = ['NETWORK_ERROR', 'DATABASE_ERROR'];
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  if (error.statusCode && retryableStatusCodes.includes(error.statusCode)) {
    return true;
  }

  return false;
}

/**
 * Format error để hiển thị trong UI
 */
export interface ErrorDisplay {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  canRetry: boolean;
}

export function formatErrorForDisplay(error: AppError | string): ErrorDisplay {
  const appError = typeof error === 'string' 
    ? createError(error) 
    : error;

  const message = getUserFriendlyMessage(appError);
  const canRetry = isRetryableError(appError);

  let title = 'Đã xảy ra lỗi';
  let severity: 'error' | 'warning' | 'info' = 'error';

  if (appError.statusCode === 400) {
    title = 'Dữ liệu không hợp lệ';
    severity = 'warning';
  } else if (appError.statusCode === 401 || appError.statusCode === 403) {
    title = 'Không có quyền truy cập';
    severity = 'warning';
  } else if (appError.statusCode === 404) {
    title = 'Không tìm thấy';
    severity = 'info';
  } else if (appError.statusCode === 429) {
    title = 'Quá nhiều yêu cầu';
    severity = 'warning';
  }

  return {
    title,
    message,
    severity,
    canRetry,
  };
}


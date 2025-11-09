/**
 * Utility functions for date formatting in Vietnam timezone (UTC+7)
 */

/**
 * Format thời gian theo múi giờ Việt Nam (UTC+7)
 * Format: HH:mm:ss dd/MM/yyyy
 */
export function formatVietnamTime(dateString: string | null | undefined): string {
	if (!dateString) return 'Chưa có';
	try {
		// Supabase lưu timestamp ở UTC, trả về dạng ISO string
		// Cần parse như UTC và chuyển sang Vietnam timezone (UTC+7)
		
		// Đảm bảo string được parse như UTC
		let dateStr = dateString.trim();
		if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
			// Không có timezone indicator, thêm 'Z' để parse như UTC
			dateStr = dateStr + 'Z';
		}
		
		// Parse như UTC (getTime() sẽ trả về UTC timestamp)
		const date = new Date(dateStr);
		
		// Kiểm tra nếu date không hợp lệ
		if (isNaN(date.getTime())) return 'Invalid Date';
		
		// Lấy UTC timestamp (milliseconds since epoch)
		// date.getTime() luôn trả về UTC timestamp, không phụ thuộc vào timezone của browser
		const utcTimestamp = date.getTime();
		
		// Chuyển đổi sang múi giờ Việt Nam (UTC+7)
		// Cộng thêm 7 giờ (7 * 60 * 60 * 1000 milliseconds)
		const vietnamTimestamp = utcTimestamp + (7 * 60 * 60 * 1000);
		const vietnamDate = new Date(vietnamTimestamp);
		
		// Format: HH:mm:ss dd/MM/yyyy
		// Sử dụng UTC methods vì đã cộng offset vào timestamp
		const hours = String(vietnamDate.getUTCHours()).padStart(2, '0');
		const minutes = String(vietnamDate.getUTCMinutes()).padStart(2, '0');
		const seconds = String(vietnamDate.getUTCSeconds()).padStart(2, '0');
		const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
		const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
		const year = vietnamDate.getUTCFullYear();
		
		return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
	} catch (err) {
		return 'Invalid Date';
	}
}

/**
 * Format ngày theo múi giờ Việt Nam (UTC+7)
 * Format: dd/MM/yyyy
 */
export function formatVietnamDate(dateString: string | null | undefined): string {
	if (!dateString) return 'Chưa có';
	try {
		let dateStr = dateString.trim();
		if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
			dateStr = dateStr + 'Z';
		}
		
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return 'Invalid Date';
		
		const utcTimestamp = date.getTime();
		const vietnamTimestamp = utcTimestamp + (7 * 60 * 60 * 1000);
		const vietnamDate = new Date(vietnamTimestamp);
		
		const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
		const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
		const year = vietnamDate.getUTCFullYear();
		
		return `${day}/${month}/${year}`;
	} catch (err) {
		return 'Invalid Date';
	}
}

/**
 * Format ngày và giờ theo múi giờ Việt Nam (UTC+7)
 * Format: HH:mm dd/MM/yyyy
 */
export function formatVietnamDateTime(dateString: string | null | undefined): string {
	if (!dateString) return 'Chưa có';
	try {
		let dateStr = dateString.trim();
		if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
			dateStr = dateStr + 'Z';
		}
		
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return 'Invalid Date';
		
		const utcTimestamp = date.getTime();
		const vietnamTimestamp = utcTimestamp + (7 * 60 * 60 * 1000);
		const vietnamDate = new Date(vietnamTimestamp);
		
		const hours = String(vietnamDate.getUTCHours()).padStart(2, '0');
		const minutes = String(vietnamDate.getUTCMinutes()).padStart(2, '0');
		const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
		const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
		const year = vietnamDate.getUTCFullYear();
		
		return `${hours}:${minutes} ${day}/${month}/${year}`;
	} catch (err) {
		return 'Invalid Date';
	}
}

/**
 * Lấy ngày theo múi giờ Việt Nam (UTC+7) dạng YYYY-MM-DD
 * Dùng cho thống kê/grouping
 */
export function getVietnamDate(dateString: string | null | undefined): string {
	if (!dateString) return '';
	try {
		let dateStr = dateString.trim();
		if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
			dateStr = dateStr + 'Z';
		}
		
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '';
		
		const utcTimestamp = date.getTime();
		const vietnamTimestamp = utcTimestamp + (7 * 60 * 60 * 1000);
		const vietnamDate = new Date(vietnamTimestamp);
		
		const year = vietnamDate.getUTCFullYear();
		const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
		const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
		
		return `${year}-${month}-${day}`;
	} catch (err) {
		return '';
	}
}

/**
 * Lấy giờ theo múi giờ Việt Nam (UTC+7)
 * Dùng cho thống kê/grouping
 */
export function getVietnamHour(dateString: string | null | undefined): number {
	if (!dateString) return 0;
	try {
		let dateStr = dateString.trim();
		if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
			dateStr = dateStr + 'Z';
		}
		
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return 0;
		
		const utcTimestamp = date.getTime();
		const vietnamTimestamp = utcTimestamp + (7 * 60 * 60 * 1000);
		const vietnamDate = new Date(vietnamTimestamp);
		
		return vietnamDate.getUTCHours();
	} catch (err) {
		return 0;
	}
}


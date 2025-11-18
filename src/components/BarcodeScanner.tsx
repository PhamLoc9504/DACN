'use client';

import type React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from './Button';

// Kiểm tra trình duyệt hỗ trợ camera (html5-qrcode sẽ tự xử lý phần còn lại)
export const isBarcodeScannerSupported = () => {
  if (typeof window === 'undefined') return false;
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

// Component Dialog đơn giản
const Dialog = ({ 
  open, 
  onClose, 
  children 
}: { 
  open: boolean; 
  onClose: () => void; 
  children: React.ReactNode 
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Quét mã vạch</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
};

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const containerId = 'barcode-scanner-container';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hàm dọn dẹp tài nguyên
  const cleanup = useCallback(() => {
    const stop = async () => {
      const instance = html5QrCodeRef.current;

      // Nếu chưa từng khởi tạo scanner thì không cần làm gì
      if (!instance) {
        isScanningRef.current = false;
        return;
      }

      try {
        // Chỉ gọi stop nếu đang quét
        if (isScanningRef.current) {
          await instance.stop();
        }

        // clear container nếu có
        await instance.clear();
      } catch (err) {
        // Chỉ log cảnh báo, không coi như lỗi nghiêm trọng
        console.warn('Lỗi khi dừng html5-qrcode (có thể scanner đã dừng):', err);
      } finally {
        isScanningRef.current = false;
        // Không gán null để có thể tái sử dụng instance nếu cần
        // html5QrCodeRef.current = null;
      }
    };

    void stop();
  }, []);

  // Khởi tạo camera
  const startCamera = useCallback(async () => {
    try {
      // Nếu đang quét hoặc đang khởi động, không gọi lại
      if (isScanningRef.current) {
        return;
      }

      setError(null);
      
      if (!isBarcodeScannerSupported()) {
        // Trình duyệt không hỗ trợ camera
        setError('Trình duyệt của bạn không hỗ trợ camera cho quét mã vạch.');
        return;
      }

      // Khởi tạo html5-qrcode với container ID
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(containerId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      } as any;

      isScanningRef.current = true;

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          // Khi quét thành công
          setScannedBarcode((prev) => {
            if (decodedText && decodedText !== prev) {
              onScan(decodedText);
              return decodedText;
            }
            return prev;
          });
        },
        () => {
          // callback lỗi quét từng frame - bỏ qua, để nó tự thử lại
        }
      );
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err?.message || String(err);

      // Lỗi trạng thái transition nội bộ của html5-qrcode -> bỏ qua, không coi là lỗi người dùng
      if (message.includes('already under transition')) {
        console.warn('html5-qrcode đang trong trạng thái transition, bỏ qua:', message);
        return;
      }

      console.error('Lỗi khi khởi động html5-qrcode:', err);
      setError('Không thể khởi động chức năng quét mã. Vui lòng kiểm tra quyền truy cập camera.');
    }
  }, [onScan]);

  // Xử lý khi mở/đóng
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [open, startCamera, cleanup]);

  // Xử lý đóng
  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // Xử lý thử lại
  const handleRetry = useCallback(() => {
    setScannedBarcode(null);
    startCamera();
  }, [startCamera]);

  // Quét từ file ảnh trên máy tính
  const handlePickImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setError(null);

        // Đảm bảo có instance
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(containerId);
        }

        const instance = html5QrCodeRef.current;

        // Nếu đang quét camera thì dừng lại trước
        if (isScanningRef.current) {
          try {
            await instance.stop();
          } catch (e) {
            console.warn('Không thể dừng camera trước khi quét file, bỏ qua:', e);
          }
          isScanningRef.current = false;
        }

        // Quét từ file (hiển thị ảnh trong container)
        const result: any = await instance.scanFile(file, true);
        const decodedText = result?.decodedText ?? result?.text ?? '';

        if (decodedText) {
          setScannedBarcode(decodedText);
          onScan(decodedText);
        } else {
          setError('Không đọc được mã từ hình ảnh. Vui lòng thử hình khác hoặc rõ nét hơn.');
        }
      } catch (err: any) {
        const message = typeof err === 'string' ? err : err?.message || '';

        // Trường hợp phổ biến: ảnh không có mã hoặc mã quá mờ -> NotFoundException
        if (message.includes('No MultiFormat Readers were able to detect the code') || err?.name === 'NotFoundException') {
          console.warn('Không tìm thấy mã trong hình (ảnh có thể không chứa mã hoặc quá mờ).');
          setError('Không đọc được mã trong hình. Hãy thử chọn hình khác rõ hơn, phóng to vùng mã vạch/QR.');
        } else {
          console.error('Lỗi khi quét mã từ file ảnh:', err);
          setError('Không thể đọc mã từ file ảnh. Vui lòng thử lại.');
        }
      } finally {
        // Reset input để lần sau có thể chọn lại cùng một file nếu cần
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [onScan],
  );

  // Ẩn component nếu trình duyệt không hỗ trợ
  if (!isBarcodeScannerSupported()) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="p-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          {/* Container cho html5-qrcode sẽ render video vào đây */}
          <div
            id={containerId}
            className="w-full h-full"
          />
          <div className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none" />
          
          {scannedBarcode && (
            <div className="absolute bottom-4 left-0 right-0 bg-green-500/90 text-white p-2 text-center">
              Đã quét mã: {scannedBarcode}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded mt-2">
            {error}
          </div>
        )}

        {/* Input ẩn để chọn file ảnh */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          <Button variant="secondary" onClick={handleClose}>
            Đóng
          </Button>
          <Button 
            variant="primary"
            onClick={handleRetry} 
            disabled={!scannedBarcode}
          >
            Quét lại bằng camera
          </Button>
          <Button 
            variant="primary"
            onClick={handlePickImage}
          >
            Chọn ảnh từ máy
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
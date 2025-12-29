'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from '@/components/Modal';

type QRScannerModalProps = {
	open: boolean;
	onClose: () => void;
	onScanSuccess: (decodedText: string) => void;
};

export default function QRScannerModal({ open, onClose, onScanSuccess }: QRScannerModalProps) {
	const [error, setError] = useState<string | null>(null);
	const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
	const isScanningRef = useRef(false);
	const containerId = 'qr-scanner-container';

	const cleanup = useCallback(() => {
		const stop = async () => {
			const instance = html5QrCodeRef.current;
			if (!instance) {
				isScanningRef.current = false;
				return;
			}

			try {
				if (isScanningRef.current) {
					await instance.stop();
				}
				await instance.clear();
			} catch {
			} finally {
				isScanningRef.current = false;
			}
		};

		void stop();
	}, []);

	const startCamera = useCallback(async () => {
		try {
			if (typeof window === 'undefined') return;
			if (isScanningRef.current) return;

			setError(null);

			if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
				setError('Trình duyệt của bạn không hỗ trợ camera.');
				return;
			}

			if (!html5QrCodeRef.current) {
				html5QrCodeRef.current = new Html5Qrcode(containerId);
			}

			isScanningRef.current = true;

			await html5QrCodeRef.current.start(
				{ facingMode: 'environment' },
				{ fps: 10, qrbox: { width: 250, height: 250 } } as any,
				(decodedText: string) => {
					if (!decodedText) return;
					onScanSuccess(decodedText);
					onClose();
				},
				() => {
					return;
				},
			);
		} catch (err: any) {
			const message = typeof err === 'string' ? err : err?.message || String(err);
			if (message.includes('already under transition')) {
				return;
			}
			setError('Không thể mở camera để quét mã. Vui lòng kiểm tra quyền truy cập camera.');
			isScanningRef.current = false;
		}
	}, [onClose, onScanSuccess]);

	useEffect(() => {
		if (open) {
			void startCamera();
		} else {
			cleanup();
		}

		return () => {
			cleanup();
		};
	}, [open, startCamera, cleanup]);

	return (
		<Modal
			open={open}
			onClose={() => {
				cleanup();
				onClose();
			}}
			title="Quét mã để tìm sản phẩm"
			className="max-w-2xl"
			hideFooter
		>
			<div className="space-y-3">
				<div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
					<div id={containerId} className="w-full h-full" />
					<div className="absolute inset-0 border-4 border-sky-400/50 rounded-lg pointer-events-none" />
				</div>

				{error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

				<div className="flex justify-end">
					<button
						onClick={() => {
							cleanup();
							onClose();
						}}
						className="px-3 py-2 rounded-md border bg-white text-slate-700 hover:bg-slate-50"
					>
						Đóng
					</button>
				</div>
			</div>
		</Modal>
	);
}

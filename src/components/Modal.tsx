'use client';

import { cn } from '@/lib/utils';

type ModalProps = {
	open: boolean;
	title?: string;
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
	hideFooter?: boolean;
};

export default function Modal({ open, title, onClose, children, className, hideFooter }: ModalProps) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/30" onClick={onClose} />
			<div className={cn('relative w-full max-w-lg rounded-2xl border bg-white shadow-xl', className)}>
				<div className="px-5 py-3 border-b rounded-t-2xl bg-gradient-to-r from-sky-50 to-blue-50">
					<div className="font-semibold text-slate-800">{title}</div>
				</div>
				<div className="p-5">{children}</div>
				{!hideFooter && (
					<div className="px-5 py-3 border-t bg-slate-50/70 rounded-b-2xl flex justify-end gap-2">
						<button onClick={onClose} className="px-3 py-2 rounded-md border bg-white text-slate-700 hover:bg-slate-50">Đóng</button>
					</div>
				)}
			</div>
		</div>
	);
}



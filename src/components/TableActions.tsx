'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'edit' | 'info' | 'warning' | 'danger';

export type TableActionItem = {
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
	tone?: Tone;
};

const toneStyles: Record<Tone, string> = {
	default: 'text-slate-600 hover:text-slate-900 hover:bg-white/80',
	edit: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/70',
	info: 'text-violet-600 hover:text-violet-700 hover:bg-violet-50/70',
	warning: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50/70',
	danger: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/70',
};

export default function TableActions({ actions }: { actions: TableActionItem[] }) {
	if (!actions.length) return null;

	return (
		<div className="inline-flex items-center gap-1 rounded-full border border-[#f3dce4] bg-[#fef8fa] px-2 py-1 text-[13px] text-[#9f6f81] shadow-sm">
			{actions.map((action, idx) => (
				<Fragment key={action.label}>
					{idx > 0 && <span className="h-4 w-px bg-[#f0d2dc]" aria-hidden="true" />}
					<button
						type="button"
						onClick={action.onClick}
						className={cn(
							'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors',
							toneStyles[action.tone || 'default']
						)}
						title={action.label}
						aria-label={action.label}
					>
						<span className="h-3.5 w-3.5">{action.icon}</span>
						<span className="hidden sm:inline text-[12px] font-medium">{action.label}</span>
					</button>
				</Fragment>
			))}
		</div>
	);
}


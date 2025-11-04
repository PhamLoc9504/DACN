'use client';

type Props = {
	page: number;
	limit: number;
	total: number;
	onChange: (page: number) => void;
};

export default function Pagination({ page, limit, total, onChange }: Props) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const canPrev = page > 1;
	const canNext = page < totalPages;

	function go(n: number) {
		if (n < 1 || n > totalPages) return;
		onChange(n);
	}

	const pages = getPageNumbers(page, totalPages);

	return (
		<div className="flex items-center justify-between gap-3 py-3">
			<div className="text-sm text-slate-600">
				Hiển thị {(page - 1) * limit + 1}-{Math.min(page * limit, total)} trên {total}
			</div>
			<div className="flex items-center gap-1">
				<button className="px-2 py-1 rounded border bg-white disabled:opacity-50" onClick={() => go(page - 1)} disabled={!canPrev}>
					Trước
				</button>
				{pages.map((p, i) => (
					<button
						key={i}
						className={
							'px-3 py-1 rounded border ' + (p === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50')
						}
						onClick={() => typeof p === 'number' && go(p)}
						disabled={typeof p !== 'number'}
					>
						{typeof p === 'number' ? p : '...'}
					</button>
				))}
				<button className="px-2 py-1 rounded border bg-white disabled:opacity-50" onClick={() => go(page + 1)} disabled={!canNext}>
					Sau
				</button>
			</div>
		</div>
	);
}

function getPageNumbers(current: number, total: number): (number | string)[] {
	const delta = 1;
	const range: number[] = [];
	for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) range.push(i);
	if (range[0] > 2) range.unshift(1, -1 as any);
	else if (range[0] === 2) range.unshift(1);
	if (range[range.length - 1] < total - 1) range.push(-1 as any, total);
	else if (range[range.length - 1] === total - 1) range.push(total);
	return range.map((x) => (x === -1 ? '...' : x));
}



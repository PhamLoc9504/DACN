'use client';

import { cn } from '@/lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'primary' | 'secondary' | 'danger' | 'pink';
};

export default function Button({ variant = 'primary', className, ...rest }: Props) {
	const variants = {
		primary: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90',
		secondary: 'bg-white border text-slate-700 hover:bg-slate-50',
		danger: 'bg-rose-500 text-white hover:bg-rose-600',
		pink: 'bg-[#f8c8dc] text-[#7a3e4b] hover:bg-[#f4b8cf]', // 🌸 tone pastel hồng phấn nhẹ
	};

	return (
		<button
			className={cn(
				'px-3 py-2 rounded-md shadow-sm transition font-medium focus:outline-none',
				variants[variant],
				className
			)}
			{...rest}
		/>
	);
}

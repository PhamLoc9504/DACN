'use client';

import type React from 'react';
import Barcode from 'react-barcode';

type ProductLabelProps = {
	productName: string;
	productCode: string;
};

const BarcodeComponent = Barcode as unknown as React.ComponentType<{
	value: string;
	height?: number;
	width?: number;
	margin?: number;
	displayValue?: boolean;
	background?: string;
	lineColor?: string;
}>;

export default function ProductLabel({ productName, productCode }: ProductLabelProps) {
	return (
		<div id="product-label-print" className="bg-white">
			<style jsx global>{`
				@media print {
					body * {
						visibility: hidden !important;
					}
					#product-label-print,
					#product-label-print * {
						visibility: visible !important;
					}
					#product-label-print {
						position: fixed;
						left: 0;
						top: 0;
						width: 300px;
						height: 200px;
						margin: 0;
						padding: 0;
					}
					@page {
						size: 300px 200px;
						margin: 0;
					}
				}
			`}</style>

			<div className="w-[300px] h-[200px] border border-slate-900 rounded-md bg-white px-3 py-2 flex flex-col justify-between">
				<div className="text-center">
					<div className="font-bold text-lg leading-tight line-clamp-2">{productName}</div>
				</div>

				<div className="flex-1 flex items-center justify-center">
					<div className="flex flex-col items-center">
						<div className="bg-white px-1 py-1">
							<BarcodeComponent
								value={productCode}
								height={70}
								width={2}
								margin={0}
								displayValue={false}
								background="#ffffff"
								lineColor="#000000"
							/>
						</div>
						<div className="mt-2 font-mono text-sm tracking-wide">{productCode}</div>
					</div>
				</div>

				<div className="text-[10px] text-slate-500 text-center">WMS</div>
			</div>
		</div>
	);
}

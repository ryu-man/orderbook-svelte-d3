import { readonly, writable } from 'svelte/store';
import type { Change, Snapshot, Spread, Update } from './types';
import { nice } from 'd3';

export function binnable(domain: [number, number]) {
	const asks$ = writable([]);
	const bids$ = writable([]);

	return {
		asks$: readonly(asks$),
		bids$: readonly(bids$)
	};
}

export type Bin = Array<any> & { x0: number; x1: number };

export function bins<T>(domain: [number, number], step = 10) {
	let value = (d: any) => d;

	const fn = (data: [number, number][]) => {
		const start = Math.floor(domain[0] / step) * step;
		const end = Math.ceil(domain[1] / step) * step;

		const bins: Bin[] = [];

		let x0 = start;

		while (x0 < end) {
			const x1 = x0 + step;

			bins.push(bin(x0, Math.min(x1, end)));

			x0 = x1;
		}

		let i = 0;
		while (i < data.length) {
			const d = data[i];
			const v = value(d);

			if (within(v, domain)) {
				const x0 = Math.floor(v / step) * step;
				const b = find(bins, x0);

				if (b) {
					// add value to the existant bin
					b.push(d);
				} else {
					// add new bin
					const b = bin(x0, x0 + step, d);
					bins.push(b);
				}
			}
			i++;
		}

		return bins;
	};

	fn.value = (cb: (d: T) => number) => {
		value = cb;
		return fn;
	};

	function bin(x0: number, x1: number, value: any[] = []) {
		const bin: any[] = value;
		bin.x0 = x0;
		bin.x1 = x1;

		return bin as Bin;
	}

	function find(bins: Bin[], x0: number) {
		let i = 0;
		while (i < bins.length) {
			if (bins[i].x0 === x0) {
				return bins[i];
			}
			i++;
		}

		return null;
	}

	function within(n: number, range: [number, number]) {
		const min = Math.min(range[0], range[1]);
		const max = Math.max(range[0], range[1]);

		return n >= min && n <= max;
	}

	return fn;
}


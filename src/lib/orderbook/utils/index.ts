import type { Bin } from 'd3';
import type { Change, Spread } from '../types';

export * from './bin';

export function sync(array: Spread[], change: Change) {
	const [type, price, volume] = change;
	if (type === 'buy') {
		// bid update
		if (volume) {
			// add bid
			const existant = array.find((d) => d[0] === price);
			if (existant) {
				existant[1] = volume;
				return [...array];
			}
			return [...array, [price, volume]];
		} else {
			// delete bid
			return array.filter((d) => d[0] !== price);
		}
	} else {
		// ask update
		if (volume) {
			// add ask
			const existant = array.find((d) => d[0] === price);
			if (existant) {
				existant[1] = volume;
				return [...array];
			}
			return [...array, [price, volume]];
		} else {
			// delete ask
			return array.filter((d) => d[0] !== price);
		}
	}
}

export function first<T>(array: T[]): T {
	return array[0];
}
export function last<T>(array: T[]): T {
	return array[array.length - 1];
}

export function sizeOf(bin: Bin<[number, number], number>) {
	let size = 0;
	for (let i = 0; i < bin.length; i++) {
		const element = bin[i];
		size += element[1];
	}
	return size;
}
export function totalOf(bins: Bin<[number, number], number>[]) {
	let total = 0;
	for (let i = 0; i < bins.length; i++) {
		const element = bins[i];
		total += sizeOf(element);
	}

	return total;
}
export function maxOf(bin: Bin<[number, number], number>) {
	return Math.max(...bin.map((d) => d[1]));
}

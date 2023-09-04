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

export function maxOf(bin: Bin<[number, number], number>) {
	return Math.max(...bin.map((d) => d[1]));
}

export function format(value: number) {
	const exponent = Math.floor(Math.log10(value || 1));

	if (exponent < 3) {
		return value.toFixed(1);
	}

	let l = 'k';
	let divideBy = 3;

	if (exponent >= 6) {
		l = 'm';
		divideBy = 6;
	}

	if (exponent >= 9) {
		l = 'g';
		divideBy = 9;
	}

	const f = Math.floor(value * Math.pow(10, -(divideBy-1))) * Math.pow(10, -1);

	return `${f.toFixed(1)}${l}`;
}

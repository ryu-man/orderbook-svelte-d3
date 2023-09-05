import { nice } from './math';

export * from './math';

export function sizeOf<T extends Array<[number, number]>>(bin: T) {
	let size = 0;
	for (let i = 0; i < bin.length; i++) {
		const element = bin[i];
		size += element[1];
	}
	return size;
}

export function totalOf<T extends Array<[number, number]>>(bins: T[]) {
	let total = 0;
	for (let i = 0; i < bins.length; i++) {
		const element = bins[i];
		total += sizeOf(element);
	}

	return total;
}

export function createAsksDomain(
	marketPrice: number,
	grouping: number,
	length: number
): [number, number] {
	return [nice(marketPrice, grouping), nice(marketPrice, grouping) + grouping * length];
}

export function createBidssDomain(
	marketPrice: number,
	grouping: number,
	length: number
): [number, number] {
	return [nice(marketPrice, -grouping) - grouping * length, nice(marketPrice, -grouping)];
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

	const f = Math.floor(value * Math.pow(10, -(divideBy - 1))) * Math.pow(10, -1);

	return `${f.toFixed(1)}${l}`;
}

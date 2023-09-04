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

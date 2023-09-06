import type { Spread } from '../types';
import { ceil, floor, round } from '$lib/utils';

export function sync(array: Spread[], update: [number, number]): Spread[] {
	const [price, quantity] = [+update[0], +update[1]];

	// ask/bid update
	if (quantity > 0) {
		// add ask/bid
		const existant = array.find((d) => d[0] === price);
		if (existant) {
			existant[1] = quantity;
			return array;
		} else {
			return [...array, [price, quantity]];
		}
	} else {
		return array.filter((d) => d[0] !== price);
	}
}

export function syncAll(array: Spread[], updates: [number, number][]): Spread[] {
	let copy = [...array];
	for (const update of updates) {
		copy = sync(copy, update);
	}

	return copy;
}

export function parseChanges(changes: [string, string][]): [number, number][] {
	const res: [number, number][] = [];
	for (const change of changes) {
		res.push([+change[0], +change[1]]);
	}

	return res;
}

export function marketPrice(asks: number, bids: number) {
	return (asks + bids) / 2;
}

export function domain(marketPrice: number, grouping: number, length: number): [number, number] {
	const max = Math.min(30000, marketPrice + grouping * length);
	const min = Math.max(0.00001, marketPrice - grouping * length);

	return [ceil(max), floor(min)];
}

export function ascendant<T>(array: T[], accessor = (d: T) => +d): T[] {
	const new_array = [...array];
	return new_array.sort((a, b) => accessor(a) - accessor(b));
}

export function descendant<T>(array: T[], accessor = (d: T) => +d): T[] {
	const new_array = [...array];
	return new_array.sort((a, b) => accessor(b) - accessor(a));
}

export function within(price: number, range: [max: number, min: number]) {
	return price < range[0] && price > range[1];
}

export function getMaxGroupingValue(value: number) {
	if (value === 0) {
		return 0;
	}
	const exponent = Math.floor(Math.log10(Math.abs(value))) - 1;
	const powerOf10 = Math.pow(10, exponent);

	return powerOf10;
}

export function getDefaultGroupingValue(value: number) {
	const gvalue = getMaxGroupingValue(value);

	return gvalue / 100;
}

export function thresholds(domain: [number, number], grouping: number) {
	const res: number[] = [];

	if (grouping === 0) {
		return [];
	}

	const end = ceil(Math.max(...domain));
	let start = floor(Math.min(...domain));

	if (start === 0 && end === 0) {
		return res;
	}

	while (start < end) {
		res.push(start);
		start += grouping;
	}

	return res;
}

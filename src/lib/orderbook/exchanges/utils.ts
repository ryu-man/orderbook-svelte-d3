import type { Spread } from '../types';

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
		return array.filter((d) => d[0] !== update[0]);
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
	return Math.round((asks + bids) / 2);
}

export function domain(marketPrice: number, grouping: number, length: number): [number, number] {
	return [Math.round(marketPrice + grouping * length), Math.round(marketPrice - grouping * length)];
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

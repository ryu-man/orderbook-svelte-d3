import type { Change, Spread } from './types';

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

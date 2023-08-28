export type Bin<T> = Array<T> & { x0: number; x1: number };
export type Bins<T> = {
	(data: T[]): Bin<T>[];

	value(cb: (d: T) => number): Bins<T>;
	value(): (d: T) => number;

	domain(d: [number, number]): Bins<T>;
	domain(): [number, number];

	update(bins: Bin<T>[], updates: T[]): Bin<T>[];
	update(bins: Bin<T>[], updates: T[], remover: (d: T) => boolean): Bin<T>[];
};
export function bins<T>(domain: [number, number], s = 10): Bins<T> {
	let value: (d: T) => number = (d) => d as number;
	let step = s;
	let dm = domain;

	const fn = (data: T[]) => {
		const start = Math.floor(dm[0] / step) * step;
		const end = Math.ceil(dm[1] / step) * step;

		const bins: Bin<T>[] = [];

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

			if (within(v, dm)) {
				const x0 = Math.floor(v / step) * step;
				const b = find(bins, x0);

				if (b) {
					// add value to the existant bin
					b.push(d);
				} else {
					// add new bin
					const b = bin(x0, x0 + step, [d]);
					bins.push(b);
				}
			}
			i++;
		}

		return bins;
	};

	fn.update = (bins: Bin<T>[], updates: T[], remove = (d: T) => false) => {
		if (updates.length === 0) {
			return bins;
		}

		let i = 0;
		while (i < updates.length) {
			const d = updates[i];
			const val = value(d);

			if (within(val, dm)) {
				const x0 = Math.floor(val / step) * step;
				const shouldremove = remove(d);

				const binIndex = bins.findIndex((d) => d.x0 === x0);
				const b = bins[binIndex];

				if (b) {
					// bin exist
					// Search for existant item
					const itemIndex = b.findIndex((i) => value(i) === val);
					if (itemIndex >= 0) {
						// item exist
						if (shouldremove) {
							// let's delete the item
							b.splice(itemIndex, 1);
							bins[binIndex] = bin(b.x0, b.x1, b);
						} else {
							// let's replace the item
							b[itemIndex] = d;
						}
					} else {
						// push into the bin
						b.push(d);
					}
				} else if (!shouldremove) {
					// create new bin
					bins.push(bin(x0, x0 + step, [d]));
					// make sure the bins are sorted
					bins.sort((a, b) => a.x0 - b.x0);
				}
			}
			i++;
		}

		return bins;
	};

	fn.value = (...args: ((d: T) => number)[]) => {
		if (args.length) {
			value = args[0];
			return fn;
		}

		return value;
	};

	fn.step = (...args: number[]) => {
		if (args.length) {
			step = args[0];
			return fn;
		}

		return step;
	};

	fn.domain = (...args: any[]) => {
		if (args.length) {
			dm = args[0] as [number, number];
			return fn;
		}

		return dm;
	};

	return fn as Bins<T>;
}

function bin<T>(x0: number, x1: number, values: T[] = []) {
	const bin: any[] = [...values];
	bin.x0 = x0;
	bin.x1 = x1;

	return bin as Bin<T>;
}

function find<T>(bins: Bin<T>[], x0: number) {
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

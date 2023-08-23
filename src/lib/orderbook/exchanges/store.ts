import { derived as dr, type Readable, type Stores, type StoresValues } from 'svelte/store';

export function derived<S extends Stores, T>(
	stores: S,
	fn: (values: StoresValues<S>) => T,
	initial_value?: T
): Readable<T> & { readonly value: T | undefined } {
	let value = initial_value;

	const store = dr(stores, fn, initial_value);
	return {
		subscribe: dr(store, (v) => {
			value = v;
			return v;
		}).subscribe,

		get value() {
			return value;
		}
	};
}

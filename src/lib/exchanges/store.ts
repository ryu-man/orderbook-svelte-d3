import {
	derived as dr,
	writable as wr,
	type Readable,
	type Stores,
	type StoresValues,
	type StartStopNotifier,
	type Writable,
	type Updater,
	type Unsubscriber
} from 'svelte/store';

export function derived<S extends Stores, T>(
	stores: S,
	fn: (
		values: StoresValues<S>,
		set: (value: T) => void,
		update: (fn: Updater<T>) => void
	) => void | Unsubscriber,
	initial_value?: T
): Readable<T> & { readonly value: T | undefined };

export function derived<S extends Stores, T>(
	stores: S,
	fn: (values: StoresValues<S>) => T,
	initial_value?: T
): Readable<T> & { readonly value: T | undefined };

export function derived<S extends Stores, T>(
	stores: S,
	fn: (values: StoresValues<S>, ...args: any[]) => T,
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

export function writable<T>(
	value: T,
	start?: StartStopNotifier<T> | undefined
): Writable<T> & { readonly value: T };

export function writable<T>(
	value?: T,
	start?: StartStopNotifier<T> | undefined
): Writable<T> & { readonly value: T | undefined } {
	const store = wr<T>(value, start);
	let val = value;

	return {
		subscribe: dr(store, (v) => {
			return v;
		}).subscribe,
		set: (value: T): void => {
			val = value;
			store.set(value);
		},
		update: (updater: Updater<T>) => {
			val = updater(val);
			store.update(updater);
		},
		get value() {
			return val;
		}
	};
}

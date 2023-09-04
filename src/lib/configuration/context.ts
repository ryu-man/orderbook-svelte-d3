import type { OrderbookTheme } from '$lib/types';
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const CONTEXT_KEY = 'orderbook_context_key';

export type ConfigurationContext = {
	marketDomain$: Writable<[number, number]>;
	grouping$: Writable<number>;
	groupingValues$: Writable<number[]>;
	theme$: Writable<OrderbookTheme>;
};

export const defaultTheme: OrderbookTheme = {
	askBin: [
		['rgb(204 46 209 / .1)', 0],
		['rgb(255 6 148 / .6)', 1]
	],
	askArea: [
		['rgb(204 46 209 / .2)', 0],
		['rgb(255 6 148 / .06)', 1]
	],
	bidBin: [
		['rgb(68 123 99 / .1)', 0],
		['rgb(28 180 232 / .6)', 1]
	],
	bidArea: [
		['rgb(68 123 99 / .2)', 0],
		['rgb(28 180 232 / .06)', 1]
	],
	marketPrice: {
		line: 'rgb(255 255 255 / 1)',
		text: 'rgb(255 255 255 / 1)'
	},
	boundaries: {
		line: 'rgb(255 255 255 / 1)',
		text: 'rgb(255 255 255 / 1)'
	},
	priceTicks: {
		primary: 'rgb(255 255 255 / 0.9)',
		secondary: 'rgb(255 255 255 / 0.4)'
	}
};

export function getConfigurationContext(): ConfigurationContext {
	return getContext(CONTEXT_KEY);
}

export function setConfigurationContext(): ConfigurationContext {
	return setContext(CONTEXT_KEY, {
		marketDomain$: writable([0, 0]),
		grouping$: writable(0),
		groupingValues$: writable([]),
		theme$: writable(defaultTheme)
	});
}

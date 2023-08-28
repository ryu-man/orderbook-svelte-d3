import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const CONTEXT_KEY = 'orderbook_context_key';

export type OrderbookTheme = {
	asks$: Writable<{
		binFill: [[string, number], [string, number]];
		areaFill: [[string, number], [string, number]];
	}>;
	bids$: Writable<{
		binFill: [[string, number], [string, number]];
		areaFill: [[string, number], [string, number]];
	}>;
};

export type ConfigurationContext = {
	marketDomain$: Writable<[number, number]>;
	grouping$: Writable<number>;
	groupingValues$: Writable<number[]>;
	theme: OrderbookTheme;
};

export function getConfigurationContext(): ConfigurationContext {
	return getContext(CONTEXT_KEY);
}

export function setConfigurationContext(): ConfigurationContext {
	return setContext(CONTEXT_KEY, {
		marketDomain$: writable([0, 0]),
		grouping$: writable(0),
		groupingValues$: writable([]),
		theme: {
			asks$: writable({
				binFill: [
					['rgb(204 46 209 / .1)', 0],
					['rgb(255 6 148 / .6)', 1]
				],
				areaFill: [
					['rgb(204 46 209 / .2)', 0],
					['rgb(255 6 148 / .06)', 1]
				]
			}),
			bids$: writable({
				binFill: [
					['rgb(68 123 99 / .1)', 0],
					['rgb(28 180 232 / .6)', 1]
				],
				areaFill: [
					['rgb(68 123 99 / .2)', 0],
					['rgb(28 180 232 / .06)', 1]
				]
			})
		}
	});
}

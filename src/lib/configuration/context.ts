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
	grouping$: Writable<number>;
	theme: OrderbookTheme;
};

export function getConfigurationContext(): ConfigurationContext {
	return getContext(CONTEXT_KEY);
}

export function setConfigurationContext(): ConfigurationContext {
	return setContext(CONTEXT_KEY, {
		grouping$: writable(10),
		theme: {
			asks$: writable({
				binFill: [
					['rgb(204 46 209 / .1)', 0],
					['rgb(195 159 66 / .6)', 1]
				],
				areaFill: [
					['rgb(204 46 209 / .2)', 0],
					['rgb(195 159 66 / .06)', 1]
				]
			}),
			bids$: writable({
				binFill: [
					['rgb(68 123 99 / .1)', 0],
					['rgb(30 62 174 / .6)', 1]
				],
				areaFill: [
					['rgb(68 123 99 / .2)', 0],
					['rgb(30 62 174 / .06)', 1]
				]
			})
		}
	});
}

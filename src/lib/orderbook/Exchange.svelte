<script lang="ts">
	import { derived, readable } from 'svelte/store';
	import { documentVisibilityStore } from 'svelte-legos';
	import Orderbook from './Orderbook.svelte';
	import { onMount } from 'svelte';
	import type { Exchange } from '../exchanges';
	import type { Spread } from '../types';
	import { getConfigurationContext } from '../configuration';
	import { ceil, floor, expOf } from '$lib/utils';

	const visibility$ = documentVisibilityStore();
	const { grouping$, theme$ } = getConfigurationContext();

	export let exchange: Exchange;

	export let width = 0;
	export let height = 0;
	export let x = 0;
	export let y = 0;
	export let grouping = 10;

	let asks: Spread[] = [];
	let bids: Spread[] = [];
	let thresholds: number[] = [];
	let marketPrice: number = 0;

	const ms = 1000;

	const thresholds$ = derived([exchange.domain$, grouping$], ([domain, grouping]) => {
		const res: number[] = [];

		// console.log(exchange.name, domain);

		if (grouping === 0) {
			return [];
		}

		if (domain[0] === 0 || domain[1] === 0) {
			return [];
		}

		const exponent = expOf(grouping) + 1;

		const end = ceil(Math.max(...domain), -exponent);
		let start = floor(Math.min(...domain), -exponent);

		if (start === 0 && end === 0) {
			return res;
		}

		while (start < end) {
			res.push(start);
			start += grouping;
		}

		return res;
	});

	const _asks$ = readable(asks, (set) => {
		const id = setInterval(() => set(asks), ms);

		return () => {
			clearInterval(id);
		};
	});
	const _bids$ = readable(bids, (set) => {
		const id = setInterval(() => set(bids), ms);

		return () => {
			clearInterval(id);
		};
	});
	const _thresholds$ = readable(thresholds, (set) => {
		const id = setInterval(() => set(thresholds), ms);

		return () => {
			clearInterval(id);
		};
	});
	const _marketPrice$ = readable(marketPrice, (set) => {
		const id = setInterval(() => set(marketPrice), ms);

		return () => {
			clearInterval(id);
		};
	});

	const asks$ = exchange.asks$;
	const bids$ = exchange.bids$;
	const marketPrice$ = exchange.marketPrice$;

	onMount(() => {
		exchange.connect();

		const unsubscribe = visibility$.subscribe((value) => {
			if (value === 'visible') {
				// Check if websocket is closed
				if (exchange.status() === 'on' && exchange.isClosed()) {
					// Then reconnect the websocket
					exchange.reconnect();
				}
			}
		});

		return () => {
			unsubscribe();
			exchange.disconnect();
		};
	});

	$: exchange.grouping$.set($grouping$);
	$: thresholds = $thresholds$;
	$: asks = $asks$;
	$: bids = $bids$;
	$: marketPrice = $marketPrice$;
</script>

<Orderbook
	{width}
	{height}
	{x}
	{y}
	name={exchange.fullname}
	focus={exchange.focus()}
	asks$={_asks$}
	bids$={_bids$}
	thresholds$={_thresholds$}
	marketPrice$={_marketPrice$}
	grouping={$grouping$}
	theme={$theme$}
/>

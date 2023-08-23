<script lang="ts">
	import { readable } from 'svelte/store';
	import { documentVisibilityStore } from 'svelte-legos';
	import Orderbook from './Orderbook.svelte';
	import { onMount } from 'svelte';
	import type { Exchange } from './exchanges/exchange';
	import type { Spread } from './types';
	import { getConfigurationContext } from '../configuration';

	const visibility$ = documentVisibilityStore();
	const { grouping$, theme } = getConfigurationContext();

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

	const askTheme$ = theme.asks$;
	const bidTheme$ = theme.bids$;

	$: exchange.grouping$.set($grouping$);

	const asks$ = readable(asks, (set) => {
		const id = setInterval(() => set(asks), ms);

		return () => {
			clearInterval(id);
		};
	});
	const bids$ = readable(bids, (set) => {
		const id = setInterval(() => set(bids), ms);

		return () => {
			clearInterval(id);
		};
	});
	const thresholds$ = readable(thresholds, (set) => {
		const id = setInterval(() => set(thresholds), ms);

		return () => {
			clearInterval(id);
		};
	});
	const marketPrice$ = readable(marketPrice, (set) => {
		const id = setInterval(() => set(marketPrice), ms);

		return () => {
			clearInterval(id);
		};
	});

	onMount(() => {
		exchange.connect();

		const unsubscribe = visibility$.subscribe((value) => {
			if (value === 'visible') {
				// Check if websocket is closed
				if (exchange.isClosed()) {
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

	onMount(() =>
		exchange.asks$.subscribe((val) => {
			asks = val;
		})
	);

	onMount(() =>
		exchange.bids$.subscribe((val) => {
			bids = val;
		})
	);
	onMount(() =>
		exchange.thresholds$.subscribe((val) => {
			thresholds = val;
		})
	);
	onMount(() =>
		exchange.marketPrice$.subscribe((val) => {
			marketPrice = val;
		})
	);
</script>

<Orderbook
	{width}
	{height}
	{x}
	{y}
	name={exchange.fullname}
	{asks$}
	{bids$}
	{thresholds$}
	{marketPrice$}
	askTheme={$askTheme$}
	bidTheme={$bidTheme$}
	grouping={$grouping$}
/>

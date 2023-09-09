<script lang="ts">
	import type { Exchange } from '$lib/orderbook/exchanges';
	import type { Spread } from '$lib/orderbook/types';
	import { onMount } from 'svelte';
	import { readable } from 'svelte/store';

	export let exchange: Exchange;
	export let grouping = 0;

	let asks: Spread[] = [];
	let bids: Spread[] = [];
	let marketPrice = 0;

	const ms = 1000;

	const asks$ = exchange.asks$;
	const bids$ = exchange.bids$;
	const marketPrice$ = exchange.marketPrice$;

	const delayedAsks$ = readable(asks, (set) => {
		set(asks);
		const id = setInterval(() => {
			set(asks);
		}, ms);

		return () => {
			clearInterval(id);
		};
	});
	const delayedBids$ = readable(bids, (set) => {
		set(bids);
		const id = setInterval(() => {
			set(bids);
		}, ms);

		return () => {
			clearInterval(id);
		};
	});

	const delayedMarketPrice$ = readable(marketPrice, (set) => {
		set(marketPrice);
		const id = setInterval(() => {
			set(marketPrice);
		}, ms);

		return () => {
			clearInterval(id);
		};
	});

	onMount(() => {
		exchange.connect();

		return () => {
			exchange.disconnect();
		};
	});

	onMount(() => {
		if (grouping === 0) {
			const unsubscribe = marketPrice$.subscribe((val) => {
				if (val === 0) {
					// Market price has not been set yet, skip calculation
					return;
				}

				if (grouping === 0) {
					// calculate proper grouping value
					const exponent = Math.floor(Math.log10(val || 1));

					grouping = Math.pow(10, exponent - 3);

					console.log(grouping);
				} else {
					// grouping has been defined, let's unsubscribe
					unsubscribe();
				}
			});

			return unsubscribe;
		}
	});

	$: exchange.grouping$.set(grouping);
	$: asks = $asks$;
	$: bids = $bids$;
	$: marketPrice = $marketPrice$;
</script>

{#if grouping}
	<slot asks={$delayedAsks$} bids={$delayedBids$} marketPrice={$delayedMarketPrice$} />
{/if}

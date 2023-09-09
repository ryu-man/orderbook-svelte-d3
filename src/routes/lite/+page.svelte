<script lang="ts">
	import { CoinbaseExchange, type Spread } from '$lib';
	import { LiteBook } from '$lib/litebook';
	import { onMount } from 'svelte';
	import { readable } from 'svelte/store';

	const exchange = new CoinbaseExchange({ from: 'BTC', to: 'USD' });

	let asks: Spread[] = [];
	let bids: Spread[] = [];
	let marketPrice = 0;

	const ms = 1000 * 2;

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
		}, 400);

		return () => {
			clearInterval(id);
		};
	});

	onMount(() => {
		exchange.grouping$.set(1);
		exchange.connect();

		return () => {
			exchange.disconnect();
		};
	});

	$: asks = $asks$;
	$: bids = $bids$;
	$: marketPrice = $marketPrice$;
</script>

<div class="page w-full h-full">
	<LiteBook
		width="20vw"
		asks={$delayedAsks$}
		bids={$delayedBids$}
		marketPrice={$delayedMarketPrice$}
		from={exchange.from()}
		to={exchange.to()}
	/>
</div>

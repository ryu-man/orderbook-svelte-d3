<script lang="ts">
	import { bin, scaleLinear, sort, type HistogramGeneratorNumber, max, type Bin } from 'd3';
	import { colord } from 'colord';
	import type { Spread } from '$lib/types';
	import { sizeOf, totalOf } from '$lib/utils';
	import { getConfigurationContext } from '$lib/configuration';
	import { createAsksDomain, createBidssDomain } from '$lib/utils';
	import Group from './Group.svelte';

	const configurationContext = getConfigurationContext();
	const theme$ = configurationContext.theme$;

	export let width = '100%';
	export let height = '100%';

	export let asks: Spread[] = [];
	export let bids: Spread[] = [];
	export let marketPrice = 0;

	export let grouping = 0;
	export let length = 20;
	export let type: 'staircase' | 'ungrouped' = 'staircase';

	export let from = '';
	export let to = '';

	const priceAccessor = (d: [number, number]) => d[0];
	const qteAccessor = (d: [number, number]) => d[1];

	const asksBinGen = bin<[number, number], number>().value(priceAccessor);
	const bidsBinGen = bin<[number, number], number>().value(priceAccessor);

	$: asksdomain = createAsksDomain(marketPrice, grouping, length);
	$: bidsdomain = createBidssDomain(marketPrice, grouping, length);

	// [nice(marketPrice, -grouping) - grouping * 20, nice(marketPrice, -grouping)] as [
	// 	number,
	// 	number
	// ];

	$: asksThresholds = thresholds(asksdomain, grouping);
	$: bidsThresholds = thresholds(bidsdomain, grouping);

	$: _asks = bins(asks, grouping)(asksBinGen.thresholds(asksThresholds));
	$: _bids = sort(
		bins(bids, grouping)(bidsBinGen.thresholds(bidsThresholds)),
		(a, b) => (b.x0 || b[0]) - (a.x0 || a[0])
	);

	// $: getTotal = getTotalOfFunc(grouping, type);

	$: asksDomain = getDomain(_asks, type, grouping);
	$: bidsDomain = getDomain(_bids, type, grouping);

	$: totalAsksScale = scaleLinear(asksDomain, [0, 100]);
	$: totalBidsScale = scaleLinear(bidsDomain, [0, 100]);

	/******************************************************************************************/

	$: askBackgroundColor = colord($theme$.askBin[1][0]).alpha(0.7).toHex();
	$: askTextColor = colord($theme$.askBin[1][0]).alpha(1).lighten(0.3).toHex();

	$: bidBackgroundColor = colord($theme$.bidBin[1][0]).alpha(0.7).toHex();
	$: bidTextColor = colord($theme$.bidBin[1][0]).alpha(1).lighten(0.3).toHex();

	/******************************************************************************************/

	function thresholds(domain: [number, number], grouping: number = 0) {
		const array: number[] = [];

		let start = domain[0];
		while (start < domain[1]) {
			array.push(start);
			start += grouping;
		}

		return array;
	}

	function bins(data: Spread[], grouping = 0) {
		if (grouping === 0) {
			return () => data.slice(0, length);
		}

		return (histogram: HistogramGeneratorNumber<[number, number], number>) => {
			return histogram(data).slice(0, length);
		};
	}

	function getDomain(
		data: Spread[] | Bin<[number, number], number>[],
		type: 'staircase' | 'ungrouped',
		grouping: number
	) {
		const trimedData = data.slice(0, -1);
		if (type === 'ungrouped') {
			if (grouping === 0) {
				return [0, sizeOf(trimedData)];
			}
			const mx = max(trimedData, (d) => sizeOf(d));
			return [0, mx];
		}

		return [0, totalOf(trimedData)];
	}
</script>

<div class="orderbook-lite-container" style:width style:height>
	<div class="orderbook-lite w-full h-full flex flex-col">
		{#if asks.length && bids.length}
			<Group
				class="asks-bins"
				scale={totalAsksScale}
				data={_asks}
				backgroundColor={askBackgroundColor}
				textColor={askTextColor}
				{grouping}
				{type}
				reverse
			/>

			<div class="market-price">
				<span>{marketPrice.toFixed(2)}</span>
				<span>{to}</span>
			</div>

			<Group
				class="bids-bins"
				scale={totalBidsScale}
				data={_bids}
				backgroundColor={bidBackgroundColor}
				textColor={bidTextColor}
				{grouping}
				{type}
			/>
		{/if}
	</div>
</div>

<style lang="postcss">
	.orderbook-lite-container {
		@apply w-full h-full border-l flex-1;
	}

	.group {
		@apply flex flex-col gap-[1px] text-sm flex-1;
		font-size: clamp(8px, 1.4vh, 4vh);
	}
	.group.asks {
		@apply flex-col-reverse;
	}

	.bin {
		@apply flex-1;
	}

	.market-price {
		@apply text-xl font-semibold flex justify-center gap-2 text-white py-2;
	}
</style>

<script lang="ts">
	import { scaleLinear, min, max, bin, reverse, type Bin, sort } from 'd3';
	import { Text, Group, Path, getCanvasContext } from '../canvas';

	import type { Spread } from './types';
	import { sizeOf, totalOf } from './utils';
	import MarketPrice from './MarketPrice.svelte';
	import { derived, writable, type Readable } from 'svelte/store';
	import AksBins from './AksBins.svelte';
	import BidsBins from './BidsBins.svelte';
	import PriceRanges from './PriceRanges.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getOrderbookContext } from './context';

	const { height$, container$ } = getCanvasContext();
	const { padding$ } = getOrderbookContext();

	export let name = '';
	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = $height$;

	export let thresholds: number[] = [];

	const priceAccessor = (d: [number, number]) => d[0];
	const qteAccessor = (d: [number, number]) => d[1];

	export let asks$: Readable<Spread[]> = writable([]);
	export let bids$: Readable<Spread[]> = writable([]);

	const filterdAsks$ = writable<Spread[]>([]);
	const filterdBids$ = writable<Spread[]>([]);

	// const bidsPriceMin$ = derived(filterdBids$, (array: Spread[]) => min(array, (d) => d[0]) || 0);
	const bidsPriceMax$ = derived(filterdBids$, (array: Spread[]) => max(array, (d) => d[0]) || 0);

	const asksPriceMin$ = derived(filterdAsks$, (array: Spread[]) => min(array, (d) => d[0]) || 0);
	const asksPriceMax$ = derived(filterdAsks$, (array: Spread[]) => max(array, (d) => d[0]) || 0);

	/***********************************************************************************************************/

	const marketPrice$ = derived(
		[asksPriceMin$, bidsPriceMax$],
		([asksmin, bidsmax]) => (asksmin + bidsmax) / 2
	);

	$: priceRangeDomain = [min(thresholds) || 0, max(thresholds) || 0];

	// ascending order
	$: filterdAsks$.set(
		sort(
			$asks$.filter((d) => d[0] >= priceRangeDomain[0] && d[0] <= priceRangeDomain[1]),
			(a, b) => a[0] - b[0]
		)
	);

	// descending order
	$: filterdBids$.set(
		sort(
			$bids$.filter((d) => d[0] >= priceRangeDomain[0] && d[0] <= priceRangeDomain[1]),
			(a, b) => b[0] - a[0]
		)
	);

	$: priceRangeScale = scaleLinear(reverse(priceRangeDomain), [0, height]);

	$: [yr0, yr1] = priceRangeScale.range();

	$: step = (yr1 - yr0) / thresholds.length;

	/***********************************************************************************************************/

	$: spreadBin = bin<[number, number], number>().value(priceAccessor).thresholds(thresholds);

	$: bidsBins = sort(spreadBin($filterdBids$), (a, b) => (b.x0 || 0) - (a.x0 || 0));

	$: asksBins = spreadBin($filterdAsks$);

	/***********************************************************************************************************/

	const asksDepthLevel = 20;
	const bidsDepthLevel = 20;

	$: asksDepthPriceRange = asksBins.at(asksDepthLevel)?.x0;
	$: asksDepthSize = Math.max(...asksBins.slice(0, asksDepthLevel + 1).map(sizeOf));

	$: bidsDepthPriceRange = bidsBins.at(bidsDepthLevel)?.x0;
	$: bidsDepthSize = Math.max(...bidsBins.slice(0, bidsDepthLevel + 1).map(sizeOf));

	$: asksSizeScale = scaleLinear([0, asksDepthSize], [0, width]);
	$: bidsSizeScale = scaleLinear([0, bidsDepthSize], [0, width]);

	/***********************************************************************************************************/

	const totalAccumulator = (bins: Bin<[number, number], number>[], depth = 0): [number, number][] =>
		bins.map((bin, i) => {
			return [bin.x0 || 0, totalOf(bins.slice(0, i + 1))];
		});

	$: bidsDepthTotal = totalOf(bidsBins.slice(0, bidsDepthLevel + 1));

	$: bidsTotal = totalAccumulator(bidsBins, bidsDepthSize);

	$: asksDepthTotal = totalOf(asksBins.slice(0, asksDepthLevel + 1));

	$: asksTotal = totalAccumulator(asksBins, asksDepthSize);

	$: asksTotalScale = scaleLinear([0, asksDepthTotal], [0, width]);
	$: bidsTotalScale = scaleLinear([0, bidsDepthTotal], [0, width]);

	/***********************************************************************************************************/

	$: marketPriceScaled = priceRangeScale($marketPrice$);

	// focus on the market price only on mount
	let focused = false;

	$: if (!focused && browser && $filterdAsks$.length && $filterdBids$.length) {
		$container$?.scrollTo({
			left: 0,
			top: marketPriceScaled - $container$.clientHeight / 2,
			behavior: 'instant'
		});

		focused = true;
	}
</script>

<Group {x} {y}>
	<Text x={0} dy={-48} value={name} fill="cyan" baseline="top" align="end" />

	<PriceRanges {priceRangeScale} {step} {thresholds} />

	<!-- Depth Hitogram Levels -->
	<Group y={priceRangeScale(asksDepthPriceRange || 0) - step / 2}>
		<Path d={`M0,0 h${width}`} stroke="rgb(255 255 255 / 1)" />
		<Text
			value={asksDepthPriceRange?.toFixed(0) ?? '0'}
			x={width}
			dx={8}
			baseline="middle"
			color="white"
		/>
	</Group>

	<Group y={priceRangeScale(bidsDepthPriceRange || 0) - step / 2}>
		<Path d={`M0,0 h${width}`} stroke="rgb(255 255 255 / 1)" />
		<Text
			value={bidsDepthPriceRange?.toFixed(0) ?? '0'}
			x={width}
			dx={8}
			baseline="middle"
			color="white"
		/>
	</Group>
	<!--  -->

	<AksBins
		{priceRangeScale}
		sizeScale={asksSizeScale}
		totalScale={asksTotalScale}
		{step}
		bins={asksBins}
		total={asksTotal}
		marketPrice={$marketPrice$}
	/>

	<BidsBins
		{priceRangeScale}
		sizeScale={bidsSizeScale}
		totalScale={bidsTotalScale}
		{step}
		total={bidsTotal}
		bins={bidsBins}
		marketPrice={$marketPrice$}
	/>

	<MarketPrice x={0} y={marketPriceScaled} {width} stroke="rgb(70 60 188)">
		<Text
			value={$marketPrice$.toFixed(0)}
			x={width}
			baseline="ideographic"
			align="end"
			color="rgb(70 60 188)"
			fontSize="9pt"
			fontWeight="700"
		/>
	</MarketPrice>
</Group>

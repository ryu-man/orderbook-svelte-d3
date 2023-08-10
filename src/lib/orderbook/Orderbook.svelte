<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		scaleLinear,
		scaleBand,
		min,
		max,
		bin,
		extent,
		line,
		area,
		reverse,
		curveStep,
		curveStepAfter,
		curveStepBefore,
		type Bin,
		scaleOrdinal,
		sort,
		map,
		reduce
	} from 'd3';
	// import { Stage, Layer, Path, Rect, Text, Group } from '../konva';
	import {
		Canvas,
		Text,
		Rect,
		Group,
		Path,
		Bin as BinComponent,
		getCanvasContext
	} from '../canvas';
	import XAxis from './XAxis.svelte';
	import YAxis from './YAxis.svelte';

	import type { Padding, Spread } from './types';
	import MarketPrice from './MarketPrice.svelte';
	import { derived, writable, type Readable } from 'svelte/store';
	import AksBins from './AksBins.svelte';
	import BidsBins from './BidsBins.svelte';
	import PriceRanges from './PriceRanges.svelte';

	const { height$, clear } = getCanvasContext();

	export let name = '';
	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = $height$;
	export let padding: Partial<Padding> = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	};
	export let paddingTop = padding.top || 0;
	export let paddingRight = padding.right || 0;
	export let paddingBottom = padding.bottom || 0;
	export let paddingLeft = padding.left || 0;

	export let unite = 'px';

	export let thresholds: number[] = [];

	// export let messages: {
	// 	bids$: Readable<Spread[]>;
	// 	asks$: Readable<Spread[]>;
	// };

	const priceAccessor = (d: [number, number]) => d[0];
	const qteAccessor = (d: [number, number]) => d[1];

	export let asks$: Readable<Spread[]> = writable([]);
	export let bids$: Readable<Spread[]> = writable([]);

	const filterdAsks$ = writable<Spread[]>([]);
	const filterdBids$ = writable<Spread[]>([]);

	const bidsPriceMin$ = derived(filterdBids$, (array: Spread[]) => min(array, (d) => d[0]) || 0);
	const bidsPriceMax$ = derived(filterdBids$, (array: Spread[]) => max(array, (d) => d[0]) || 0);

	const asksPriceMin$ = derived(filterdAsks$, (array: Spread[]) => min(array, (d) => d[0]) || 0);
	const asksPriceMax$ = derived(filterdAsks$, (array: Spread[]) => max(array, (d) => d[0]) || 0);

	const spreadPricedMin$ = derived([asksPriceMin$, bidsPriceMin$], ([asksMin, bidsMin]) =>
		Math.min(asksMin, bidsMin)
	);
	const spreadPriceMax$ = derived([asksPriceMax$, bidsPriceMax$], ([asksMax, bidsMax]) =>
		Math.max(asksMax, bidsMax)
	);

	/***********************************************************************************************************/

	const bidsQteMin$ = derived(filterdBids$, (array: Spread[]) => min(array, (d) => d[1]) || 0);
	const bidsQteMax$ = derived(filterdBids$, (array: Spread[]) => max(array, (d) => d[1]) || 0);

	const asksQteMin$ = derived(filterdAsks$, (array: Spread[]) => min(array, (d) => d[1]) || 0);
	const asksQteMax$ = derived(filterdAsks$, (array: Spread[]) => max(array, (d) => d[1]) || 0);

	const spreadQteMin$ = derived([asksQteMin$, bidsQteMin$], ([asksMin, bidsMin]) =>
		Math.min(asksMin, bidsMin)
	);
	const spreadQteMax$ = derived([asksQteMax$, bidsQteMax$], ([asksMax, bidsMax]) =>
		Math.max(asksMax, bidsMax)
	);

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

	$: priceDomain = [$spreadPricedMin$, $spreadPriceMax$];
	$: priceScale = scaleLinear(priceDomain, [0, width]);

	$: priceRangeScale = scaleLinear(reverse(priceRangeDomain), [0, height]);

	$: [xr0, xr1] = priceScale.range();

	$: [yr0, yr1] = priceRangeScale.range();

	$: step = (yr1 - yr0) / thresholds.length;

	/***********************************************************************************************************/

	const qtePerBinConverter = (bins: Bin<[number, number], number>[]) =>
		bins.map((bin) => bin.map((d) => d[1]).reduce((acc, val) => acc + val, 0));

	$: spreadBin = bin<[number, number], number>().value(priceAccessor).thresholds(thresholds);

	$: bidsBins = sort(spreadBin($filterdBids$), (a, b) => b.x0 - a.x0);

	$: bidsBinsQte = qtePerBinConverter(bidsBins);
	$: bidsBinsMinQte = min(bidsBinsQte) || 0;
	$: bidsBinsMaxQte = max(bidsBinsQte) || 0;

	$: asksBins = sort(spreadBin($filterdAsks$), (a, b) => a.x0 - b.x0);
	$: asksBinsQte = qtePerBinConverter(asksBins);
	$: asksBinsMinQte = min(asksBinsQte) || 0;
	$: asksBinsMaxQte = max(asksBinsQte) || 0;

	/***********************************************************************************************************/

	$: qteDomain = extent([asksBinsMaxQte, asksBinsMinQte, bidsBinsMaxQte, bidsBinsMinQte]);
	$: qteScale = scaleLinear(qteDomain, [0, width]);

	/***********************************************************************************************************/

	const spreadAccumulator = (bins: Bin<[number, number], number>[]): [number, number][] =>
		bins.map((bin, i, data) => {
			return [
				bin.x0 || 0,
				data
					.slice(0, i + 1)
					.map((bin) => bin.reduce((acc, val) => acc + val[1], 0))
					.reduce((acc, val) => acc + val, 0)
			];
		});

	// array.map((d, i, data) => [d[0], data.slice(0, i + 1).reduce((acc, val) => acc + val[1], 0)]);

	$: bidsSum = spreadAccumulator(bidsBins);
	$: bidsSumQte = bidsSum.map(qteAccessor);
	$: bidsSumQteMin = min(bidsSumQte) || 0;
	$: bidsSumQteMax = max(bidsSumQte) || 0;

	$: asksSum = spreadAccumulator(asksBins);
	$: asksSumQte = asksSum.map(qteAccessor);
	$: asksSumQteMin = min(asksSumQte) || 0;
	$: asksSumQteMax = max(asksSumQte) || 0;

	$: sumScale = scaleLinear([0, Math.max(asksSumQteMax, bidsSumQteMax)], [0, width]);

	/***********************************************************************************************************/

	/***********************************************************************************************************/

	$: spreadArea = area()
		.y((d) => priceRangeScale(d[0]))
		.x0((d) => sumScale(0))
		.x1((d) => sumScale(d[1]))
		.curve(curveStep);

	$: spreadLine = line<Bin<[number, number], number>>()
		.y((d) => priceRangeScale(d[0]))
		.x((d) => sumScale(d[1]))
		.curve(curveStep);

	$: mpScaled = priceRangeScale($marketPrice$);

	function first<T>(array: T[]): T {
		return array[0];
	}
	function last<T>(array: T[]): T {
		return array[array.length - 1];
	}

	// #1e3eae
	// #447b63

	// #78197b
	// #c39f42
</script>

<Group {x} {y}>
	<Text
		x={0}
		dy={-48}
		value={name}
		fill="cyan"
		baseline="top"
		align="end"
		on:click={() => console.log('orderbook::title', name)}
	/>

	{@const gradientX0 = sumScale(0)}
	{@const gradientY0 = priceRangeScale($asksPriceMax$)}
	{@const gradientX1 = sumScale(asksSumQteMax)}
	{@const gradientY1 = sumScale(0)}

	<!-- <Group>
		<Path
			d={spreadArea(asksSum)}
			gradientX={gradientX0}
			gradientY={gradientY0}
			gradientWidth={gradientX1 - gradientX0}
			gradientHeight={gradientY0}
			fill={[
				['rgb(120 25 123 / .3)', 0],
				['rgb(195 159 66 / .1)', 1]
			]}
			stroke="transparent"
		/>

		<Path
			d={spreadLine(asksSum)}
			gradientX={gradientX0}
			gradientY={gradientY0}
			gradientWidth={gradientX1 - gradientX0}
			gradientHeight={gradientY0}
			stroke={[
				['rgb(120 25 123 / 1)', 0],
				['rgb(195 159 66 / 1)', 1]
			]}
			fill="transparent"
		/>
	</Group> -->

	<!-- <Group>
		<Path
			d={spreadArea(bidsSum)}
			gradientX={gradientX0}
			gradientY={gradientY0}
			gradientWidth={gradientX1 - gradientX0}
			gradientHeight={gradientY0}
			fill={[
				['rgb(68 123 99 / .3)', 0],
				['rgb(30 62 174 / .1)', 1]
			]}
			stroke="transparent"
		/>

		<Path
			d={spreadLine(bidsSum)}
			gradientX={gradientX0}
			gradientY={gradientY0}
			gradientWidth={gradientX1 - gradientX0}
			gradientHeight={gradientY0}
			stroke={[
				['rgb(68 123 99 / 1)', 0],
				['rgb(30 62 174 / 1)', 1]
			]}
			fill="transparent"
		/>
	</Group> -->

	<PriceRanges {priceRangeScale} {step} {thresholds} />
	<!-- <Group y={-step / 2}>
		{#each thresholds.slice(0, -1) as prange}
			<Text
				x={xr0}
				y={priceRangeScale(prange)}
				dx={-8}
				dy={0}
				value={prange.toString()}
				color="rgb(255 255 255 / .6)"
				fill="rgb(255 255 255 / 0)"
				align="end"
				baseline="middle"
				fontWeight="normal"
				fontSize="10pt"
			/>
		{/each}
	</Group> -->

	<AksBins
		{priceRangeScale}
		{qteScale}
		{step}
		{width}
		{gradientX0}
		{gradientX1}
		{gradientY0}
		{gradientY1}
		bins={asksBins}
		sum={asksSum}
		marketPriceScaled={mpScaled}
		area={spreadArea}
		line={spreadLine}
	/>

	<BidsBins
		{priceRangeScale}
		{qteScale}
		{step}
		{width}
		{gradientX0}
		{gradientX1}
		{gradientY0}
		{gradientY1}
		sum={bidsSum}
		bins={bidsBins}
		marketPriceScaled={mpScaled}
		area={spreadArea}
		line={spreadLine}
	/>

	<MarketPrice x={0} y={mpScaled} {width} stroke="rgb(70 60 188)">
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

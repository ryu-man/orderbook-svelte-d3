<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { writable, type Readable, derived } from 'svelte/store';
	import { scaleLinear, min, max, bin, reverse, type Bin, sort } from 'd3';
	import { Text, Group, Path, getCanvasContext, getCanvasViewportContext } from '../canvas';
	import MarketPrice from './MarketPrice.svelte';
	import AksBins from './AksBins.svelte';
	import BidsBins from './BidsBins.svelte';
	import PriceRanges from './PriceRanges.svelte';
	import { ceil, sizeOf, totalOf } from '$lib/utils';
	import type { OrderbookTheme, Spread } from '$lib/types';

	const { viewportElement$, vh$, vy$ } = getCanvasViewportContext();
	const { height$, container$ } = getCanvasContext();

	export let name = '';
	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = $height$;

	const priceAccessor = (d: [number, number]) => d[0];
	const qteAccessor = (d: [number, number]) => d[1];

	export let asks$: Readable<Spread[]> = writable([]);
	export let bids$: Readable<Spread[]> = writable([]);

	export let marketPrice$: Readable<number>;
	export let thresholds$: Readable<number[]>;

	export let theme: OrderbookTheme = {
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

	$: console.log(theme);

	export let grouping = 10;

	export let focus = false;

	$: thresholds = $thresholds$;

	/***********************************************************************************************************/

	$: priceRangeDomain = [min(thresholds) || 0, max(thresholds) || 0] as [number, number];
	$: priceRangeScale = scaleLinear(reverse(priceRangeDomain), [0, height]);

	$: [yr0, yr1] = priceRangeScale.range();

	$: step = (yr1 - yr0) / thresholds.length;

	/***********************************************************************************************************/

	const spreadBin = bin<[number, number], number>().value(priceAccessor);
	$: spreadBin.thresholds(thresholds);

	// const gen = bins<[number, number]>(priceRangeDomain, 10).value((d) => d[0]);
	// $: gen.domain(priceRangeDomain);

	$: asksBins = spreadBin($asks$);
	$: bidsBins = sort(spreadBin($bids$), (a, b) => (b.x0 || 0) - (a.x0 || 0));

	// let a = [];
	// $: a = gen.update(a, $asksUpdates$, (d) => d[1] === 0);

	// let b = [];
	// $: b = sort(
	// 	gen.update(b, $bidsUpdates$, (d) => d[1] === 0),
	// 	(a, b) => (b.x0 || 0) - (a.x0 || 0)
	// );

	// $: console.log(a);

	/***********************************************************************************************************/

	const asksDepthLevel = 20;
	const bidsDepthLevel = 20;

	$: asksDepthPriceRange = asksBins.at(asksDepthLevel)?.x0;
	$: asksDepthSize = max(asksBins.slice(0, asksDepthLevel + 1).map(sizeOf)) || 0;

	$: bidsDepthPriceRange = bidsBins.at(bidsDepthLevel)?.x0;
	$: bidsDepthSize = max(bidsBins.slice(0, bidsDepthLevel + 1).map(sizeOf)) || 0;

	$: asksSizeScale = scaleLinear([0, asksDepthSize], [0, width]);
	$: bidsSizeScale = scaleLinear([0, bidsDepthSize], [0, width]);

	/***********************************************************************************************************/

	const accumulateTotal = (bins: Bin<[number, number], number>[]): [number, number][] => {
		const res: [number, number][] = [];
		for (let i = 0; i < bins.length; i++) {
			const bin = bins[i];
			res.push([bin.x0 || 0, totalOf(bins.slice(0, i + 1))]);
		}

		return res;
	};

	$: bidsDepthTotal = totalOf(bidsBins.slice(0, bidsDepthLevel + 1));

	$: bidsTotal = accumulateTotal(bidsBins);

	$: asksDepthTotal = totalOf(asksBins.slice(0, asksDepthLevel + 1));

	$: asksTotal = accumulateTotal(asksBins);

	$: asksTotalScale = scaleLinear([0, asksDepthTotal], [0, width]);
	$: bidsTotalScale = scaleLinear([0, bidsDepthTotal], [0, width]);

	/***********************************************************************************************************/

	$: marketPriceScaled = priceRangeScale($marketPrice$);

	$: exp = Math.floor(Math.log10(Math.abs(grouping || 1))) - 1;

	/**********************************************************************************************************/
	//This logic handles order book auto scroll and focus on the market price
	// focus on the market price only on mount
	let autofocus = true;

	let oldGrouping = 0;

	const grouping$ = writable(0);
	$: grouping$.set(grouping);

	onMount(() => {
		if (focus) {
			return grouping$.subscribe((value) => {
				if (value <= 0) return;
				if (!autofocus && grouping === oldGrouping) return;

				setTimeout(() => {
					$viewportElement$?.scrollTo({
						left: 0,
						top: marketPriceScaled - $vh$ / 2,
						behavior: 'smooth'
					});
				}, 1000);

				oldGrouping = grouping;
				autofocus = false;
			});
		}
	});
</script>

<Group {x} {y}>
	{#if $asks$.length || $bids$.length}
		<PriceRanges {priceRangeScale} {step} {thresholds} {grouping} />

		<!-- Depth Hitogram Levels -->
		<Group y={priceRangeScale(asksDepthPriceRange || 0) - step / 2}>
			<Path d={`M0,0 h${width}`} stroke={theme.boundaries.line} />
			<Text
				value={asksDepthPriceRange?.toFixed(0) ?? '0'}
				x={width}
				dx={8}
				baseline="middle"
				color={theme.boundaries.text}
			/>
		</Group>

		<Group y={priceRangeScale(bidsDepthPriceRange || 0) - step / 2}>
			<Path d={`M0,0 h${width}`} stroke={theme.boundaries.line} />
			<Text
				value={bidsDepthPriceRange?.toFixed(0) ?? '0'}
				x={width}
				dx={8}
				baseline="middle"
				color={theme.boundaries.text}
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
			areaFill={theme.askArea}
			binFill={theme.askBin}
		/>

		<BidsBins
			{priceRangeScale}
			sizeScale={bidsSizeScale}
			totalScale={bidsTotalScale}
			{step}
			total={bidsTotal}
			bins={bidsBins}
			marketPrice={$marketPrice$}
			areaFill={theme.bidArea}
			binFill={theme.bidBin}
		/>

		<MarketPrice
			value={ceil($marketPrice$, -exp)}
			x={0}
			y={marketPriceScaled}
			{width}
			stroke={theme.marketPrice.line}
			fill={theme.marketPrice.text}
		/>
	{/if}
</Group>

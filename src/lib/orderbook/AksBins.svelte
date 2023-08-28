<script lang="ts">
	import { Group, Bin as BinComponent, Text, Path } from '$lib/canvas';
	import {
		type Area,
		type Bin,
		type Line,
		type ScaleLinear,
		reduce,
		area,
		line,
		curveStepBefore,
		curveStepAfter,
		curveStep
	} from 'd3';
	import { sizeOf, totalOf } from './utils';
	import AskBin from './AskBin.svelte';
	import { colord } from 'colord';

	export let priceRangeScale: ScaleLinear<number, number>;
	export let sizeScale: ScaleLinear<number, number>;
	export let totalScale: ScaleLinear<number, number>;

	export let bins: Bin<[number, number], number>[] = [];
	export let total: [number, number][] = [];

	export let step = 0;
	export let marketPrice = 0;

	export let areaFill: [string, number][] = [
		['rgb(204 46 209 / .2)', 0],
		['rgb(195 159 66 / .06)', 1]
	];

	export let binFill;

	let opacity = 0;

	$: areaStroke = [
		[colord(areaFill[0][0]).alpha(0.9).toHex(), areaFill[0][1]],
		[colord(areaFill[1][0]).alpha(0.9).toHex(), areaFill[1][1]]
	];

	$: filterBins = bins.filter((bin) => bin.length);

	// $: gradientWidth = Math.min(gradientX1 - gradientX0, sizeScale.range()[1]);

	$: marketPriceScaled = priceRangeScale(marketPrice);

	$: _area = area()
		.y((d) => Math.min(priceRangeScale(d[0]), marketPriceScaled))
		.x0((d) => totalScale(0))
		.x1((d) => Math.min(totalScale(d[1]), totalScale.range()[1]))
		.curve(curveStepBefore);

	$: _line = line<[number, number]>()
		.y((d) => Math.min(priceRangeScale(d[0]), marketPriceScaled))
		.x((d) => Math.min(totalScale(d[1]), totalScale.range()[1]))

		.curve(curveStepBefore);

	$: gradientX0 = 0;
	$: gradientY0 = priceRangeScale.range()[0];
	$: gradientX1 = totalScale.range()[1];
	$: gradientY1 = 0;
	$: gradientWidth = Math.min(gradientX1 - gradientX0, sizeScale.range()[1]);

	$: width = totalScale.range()[1];
	$: height = priceRangeScale(bins.at(0)?.x0 ?? 0);
	// $: console.log(bins.at(0), priceRangeScale(bins.at(0)?.x1 ?? 0));

	function onPointerEnterHandler() {
		opacity = 1;
		console.log('pointerenter');
	}

	function onPointerLeaveHandler() {
		opacity = 0;
	}

	
</script>

<Group>
	<Group>
		<Path
			d={_area([
				[marketPrice, 0],
				...total,
				[priceRangeScale.domain()[0] || 0, totalScale.domain()[1] || 0]
			])}
			{width}
			{height}
			gradientX={gradientX0}
			gradientY={gradientY0}
			{gradientWidth}
			gradientHeight={gradientY0}
			fill={areaFill}
			stroke="transparent"
		/>

		<Path
			d={_line([
				[marketPrice, 0],
				...total,
				[priceRangeScale.domain()[0] || 0, totalScale.domain()[1] || 0]
			])}
			{width}
			{height}
			gradientX={gradientX0}
			gradientY={gradientY0}
			{gradientWidth}
			gradientHeight={gradientY0}
			stroke={areaStroke}
			strokeWidth={1}
			fill="transparent"
		/>
	</Group>

	{#each filterBins as bin, i (bin.x0)}
		{@const y0 = Math.min(priceRangeScale(bin.x1 || 0), marketPriceScaled)}
		{@const y1 = Math.min(priceRangeScale(bin.x0 || 0), marketPriceScaled)}
		{@const height = Math.min(Math.abs(y1 - y0), step)}

		{@const total = totalOf(filterBins.slice(0, i + 1))}
		{@const size = sizeOf(bin)}
		{@const sizeDepth = Math.min(sizeScale(size), sizeScale.range()[1])}
		{@const totalDepth = Math.min(totalScale(total), totalScale.range()[1])}

		<AskBin
			x={0}
			y={y0}
			sizeWidth={sizeDepth}
			totalWidth={totalDepth}
			maxWidth={Math.max(...totalScale.range())}
			{height}
			{gradientWidth}
			{step}
			{size}
			{total}
			fill={binFill}
		/>
	{/each}
</Group>

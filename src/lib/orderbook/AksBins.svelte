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
		curveStepBefore
	} from 'd3';
	import { sizeOf, totalOf } from './utils';
	import AskBin from './AskBin.svelte';

	export let priceRangeScale: ScaleLinear<number, number>;
	export let sizeScale: ScaleLinear<number, number>;
	export let totalScale: ScaleLinear<number, number>;

	export let bins: Bin<[number, number], number>[] = [];
	export let total: [number, number][] = [];

	export let step = 0;
	export let marketPrice = 0;

	let opacity = 0;

	$: filterBins = bins.filter((bin) => bin.length);

	// $: gradientWidth = Math.min(gradientX1 - gradientX0, sizeScale.range()[1]);

	$: marketPriceScaled = priceRangeScale(marketPrice);

	$: _area = area()
		.y((d) => priceRangeScale(d[0]))
		.x0((d) => totalScale(0))
		.x1((d) => Math.min(totalScale(d[1]), totalScale.range()[1]))
		.curve(curveStepBefore);

	$: _line = line<[number, number]>()
		.y((d) => priceRangeScale(d[0]))
		.x((d) => Math.min(totalScale(d[1]), totalScale.range()[1]))
		.curve(curveStepBefore);

	$: gradientX0 = 0;
	$: gradientY0 = priceRangeScale.range()[0];
	$: gradientX1 = totalScale.range()[1];
	$: gradientY1 = 0;
	$: gradientWidth = Math.min(gradientX1 - gradientX0, sizeScale.range()[1]);
	// $: console.log(total);

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
			d={_area(total)}
			gradientX={gradientX0}
			gradientY={gradientY0}
			{gradientWidth}
			gradientHeight={gradientY0}
			fill={[
				['rgb(204 46 209 / .2)', 0],
				['rgb(195 159 66 / .06)', 1]
			]}
			stroke="transparent"
		/>

		<Path
			d={_line(total)}
			gradientX={gradientX0}
			gradientY={gradientY0}
			{gradientWidth}
			gradientHeight={gradientY0}
			stroke={[
				['rgb(204 46 209 / 1)', 0],
				['rgb(195 159 66 / 1)', 1]
			]}
			strokeWidth={1}
			fill="transparent"
		/>
	</Group>

	{#each filterBins as bin, i}
		{@const y0 = Math.min(priceRangeScale(bin.x1 || 0), marketPriceScaled)}
		{@const y1 = Math.min(priceRangeScale(bin.x0 || 0), marketPriceScaled)}
		{@const height = Math.abs(y1 - y0)}

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
		/>
	{/each}
</Group>

<script lang="ts">
	import { Group, Bin as BinComponent, Text, Path } from '$lib/canvas';
	import {
		area,
		curveStepAfter,
		type Area,
		type Bin,
		type Line,
		type ScaleLinear,
		line,
		range
	} from 'd3';
	import { sizeOf, totalOf } from './utils';
	import BidBin from './BidBin.svelte';

	export let priceRangeScale: ScaleLinear<number, number>;
	export let sizeScale: ScaleLinear<number, number>;
	export let totalScale: ScaleLinear<number, number>;

	export let bins: Bin<[number, number], number>[] = [];
	export let total: [number, number][] = [];

	export let step = 0;
	export let marketPrice = 0;

	$: filterBins = bins.filter((bin) => bin.length);

	$: marketPriceScaled = priceRangeScale(marketPrice);

	$: _area = area()
		.y((d) => priceRangeScale(d[0]))
		.x0((d) => totalScale(0))
		.x1((d) => Math.min(totalScale(d[1]), totalScale.range()[1]))
		.curve(curveStepAfter);

	$: _line = line<[number, number]>()
		.y((d) => priceRangeScale(d[0]))
		.x((d) => Math.min(totalScale(d[1]), totalScale.range()[1]))
		.curve(curveStepAfter);

	$: gradientX0 = 0;
	$: gradientY0 = priceRangeScale.range()[0];
	$: gradientX1 = totalScale.range()[1];
	$: gradientY1 = 0;
	$: gradientWidth = Math.min(gradientX1 - gradientX0, sizeScale.range()[1]);

	// #1e3eae
	// #447b63
</script>

<Group>
	<Group>
		<Path
			d={_area(total)}
			gradientX={gradientX0}
			gradientY={gradientY0}
			gradientWidth={gradientX1 - gradientX0}
			gradientHeight={gradientY0}
			fill={[
				['rgb(68 123 99 / .2)', 0],
				['rgb(30 62 174 / .06)', 1]
			]}
			stroke="transparent"
		/>

		<Path
			d={_line(total)}
			gradientX={gradientX0}
			gradientY={gradientY0}
			gradientWidth={gradientX1 - gradientX0}
			gradientHeight={gradientY0}
			stroke={[
				['rgb(68 123 99 / 1)', 0],
				['rgb(30 62 174 / 1)', 1]
			]}
			strokeWidth={1}
			fill="transparent"
		/>
	</Group>

	{#each filterBins as bin, i}
		{@const y0 = priceRangeScale(bin.x0 || 0)}
		{@const y1 = Math.max(priceRangeScale(bin.x1 || 0), marketPriceScaled)}
		{@const height = Math.abs(y1 - y0)}

		{@const total = totalOf(filterBins.slice(0, i + 1))}
		{@const size = sizeOf(bin)}
		{@const sizeDepth = Math.min(sizeScale(size), sizeScale.range()[1])}
		{@const totalDepth = Math.min(totalScale(total), totalScale.range()[1])}

		<BidBin
			x={0}
			y={y1}
			sizeWidth={sizeDepth}
			totalWidth={totalDepth}
			{height}
			maxWidth={Math.max(...totalScale.range())}
			{gradientWidth}
			{size}
			{total}
			{step}
		/>

		<!-- <Group>
			<BinComponent
				x={0}
				y={y1}
				height={_step}
				width={sizeDepth}
				{gradientWidth}
				fill={[
					['rgb(68 123 99 / .6)', 0],
					['rgb(30 62 174 / .6)', 1]
				]}
			/>

			<BinComponent
				x={0}
				y={y1}
				height={_step}
				width={totalDepth}
				{gradientWidth}
				fill={[
					[`rgb(68 123 99 / ${opacity})`, 0],
					[`rgb(30 62 174 / ${opacity})`, 1]
				]}
			/>
			{#if _step > 10}
				<Text
					value={total.toFixed(1)}
					x={Math.max(...totalScale.range())}
					dx={8}
					y={y1}
					dy={_step / 2}
					baseline="middle"
					color="white"
				/>
				<Text
					value={size.toFixed(1)}
					x={0}
					dx={8}
					y={y1}
					dy={_step / 2}
					baseline="middle"
					fontSize={(6 * _step) / step + 'pt'}
					fontWeight="600"
					color="white"
				/>
			{/if}
		</Group> -->
	{/each}
</Group>

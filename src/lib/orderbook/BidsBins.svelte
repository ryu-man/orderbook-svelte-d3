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
		range,
		curveStep,
		curveStepBefore
	} from 'd3';
	import { sizeOf, totalOf } from './utils';
	import BidBin from './BidBin.svelte';
	import { colord } from 'colord';
	import { domain } from './exchanges';

	export let priceRangeScale: ScaleLinear<number, number>;
	export let sizeScale: ScaleLinear<number, number>;
	export let totalScale: ScaleLinear<number, number>;

	export let bins: Bin<[number, number], number>[] = [];
	export let total: [number, number][] = [];

	export let step = 0;
	export let marketPrice = 0;

	export let areaFill: [string, number][] = [
		['rgb(68 123 99 / .2)', 0],
		['rgb(30 62 174 / .06)', 1]
	];

	$: areaStroke = [
		[colord(areaFill[0][0]).alpha(0.9).toHex(), areaFill[0][1]],
		[colord(areaFill[1][0]).alpha(0.9).toHex(), areaFill[1][1]]
	];
	// export let areaStroke = [
	// 	['rgb(68 123 99 / .9)', 0],
	// 	['rgb(30 62 174 / .9)', 1]
	// ];
	export let binFill;

	$: filterBins = bins.filter((bin) => bin.length);

	$: marketPriceScaled = priceRangeScale(marketPrice);

	$: _area = area()
		.y((d) => Math.max(priceRangeScale(d[0]), marketPriceScaled))
		.x0((d) => totalScale(0))
		.x1((d) => Math.min(totalScale(d[1]), totalScale.range()[1]))
		.curve(curveStepAfter);

	$: _line = line<[number, number]>()
		.y((d) => Math.max(priceRangeScale(d[0]), marketPriceScaled))
		.x((d) => Math.min(totalScale(d[1]), totalScale.range()[1]))
		.curve(curveStepAfter);

	$: gradientX0 = 0;
	$: gradientY0 = priceRangeScale.range()[0];
	$: gradientX1 = totalScale.range()[1];
	$: gradientY1 = 0;
	$: gradientWidth = Math.min(gradientX1 - gradientX0, sizeScale.range()[1]);

	$: y = priceRangeScale(bins.at(0)?.x1 ?? 0);
	$: width = totalScale.range()[1];
	$: height = priceRangeScale.range()[1] - y;

	// #1e3eae
	// #447b63
</script>

<Group>
	<Group>
		<Path
			d={_area([
				[marketPrice, 0],
				...total,
				[priceRangeScale.domain()[1] || 0, totalScale.domain()[1] || 0]
			])}
			{y}
			{height}
			{width}
			gradientX={gradientX0}
			gradientY={gradientY0}
			gradientWidth={gradientX1 - gradientX0}
			gradientHeight={gradientY0}
			fill={areaFill}
			stroke="transparent"
		/>

		<Path
			d={_line([
				[marketPrice, 0],
				...total,
				[priceRangeScale.domain()[1] || 0, totalScale.domain()[1] || 0]
			])}
			{y}
			{height}
			{width}
			gradientX={gradientX0}
			gradientY={gradientY0}
			gradientWidth={gradientX1 - gradientX0}
			gradientHeight={gradientY0}
			stroke={areaStroke}
			strokeWidth={1}
			fill="transparent"
		/>
	</Group>

	{#each filterBins as bin, i (bin.x0)}
		{@const y0 = priceRangeScale(bin.x0 || 0)}
		{@const y1 = priceRangeScale(bin.x1 || 0)}
		{@const height = Math.min(Math.abs(y1 - y0), step)}

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
			fill={binFill}
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

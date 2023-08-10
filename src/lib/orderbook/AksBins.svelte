<script lang="ts">
	import { Group, Bin as BinComponent, Text, Path } from '$lib/canvas';
	import { sort, type Area, type Bin, type Line, type ScaleLinear } from 'd3';

	export let priceRangeScale: ScaleLinear<number, number>;
	export let qteScale: ScaleLinear<number, number>;
	export let area: Area<[number, number]>;
	export let line: Line<Bin<[number, number], number>>;

	export let bins: Bin<[number, number], number>[] = [];
	export let sum: [number, number][] = [];

	export let step = 0;
	export let marketPriceScaled = 0;
	export let width = 0;

	export let gradientX0 = 0;
	export let gradientX1 = 0;
	export let gradientY0 = 0;
	export let gradientY1 = 0;

	$: filterBins = sort(
		bins.filter((bin) => bin.length),
		(a, b) => a.x0 || 0 - b.x0 || 0
	);

	// $: console.log(filterBins);
</script>

<Group>
	<Group>
		<Path
			d={area(sum)}
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
			d={line(sum)}
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
	</Group>

	{#each filterBins as bin, i}
		{@const y0 = Math.min(priceRangeScale(bin.x0 || 0), marketPriceScaled)}
		{@const y1 = priceRangeScale(bin.x1 || 0)}
		{@const _step = Math.abs(y1 - y0)}
		{@const sumAcc = filterBins
			.slice(0, i + 1)
			.map((d) => d.map((dd) => dd[1]).reduce((acc, val) => acc + val, 0))
			.reduce((acc, val) => acc + val, 0)}
		{@const sum = bin.reduce((acc, val) => acc + val[1], 0)}
		{@const binWidth = qteScale(sum)}

		<Group>
			<BinComponent
				x={0}
				y={y1}
				height={Math.min(_step, marketPriceScaled - y1)}
				width={binWidth}
				gradientWidth={width}
				fill={[
					['rgb(120 25 123 / .6)', 0],
					['rgb(195 159 66 / .6)', 1]
				]}
			/>
			{#if _step > 10}
				<Text
					value={sumAcc.toFixed(1)}
					x={Math.max(54, binWidth)}
					dx={8}
					y={y1}
					dy={_step / 2}
					baseline="middle"
					color="white"
				/>
				<Text
					value={sum.toFixed(1)}
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
		</Group>
	{/each}
</Group>

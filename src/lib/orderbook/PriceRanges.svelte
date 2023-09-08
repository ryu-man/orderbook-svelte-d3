<script lang="ts">
	import type { ScaleLinear } from 'd3';
	import { Group } from '$lib/canvas';
	import { expOf, round } from '$lib/utils';
	import Range from './PriceRange.svelte';

	export let grouping = 10;
	export let step = 2;
	export let thresholds: number[] = [];
	export let priceRangeScale: ScaleLinear<number, number>;

	export let primaryColor = 'rgb( 255 255 255 / 1)';
	export let secondaryColor = 'rgb( 255 255 255 / 0.5)';

	$: console.log(grouping);
</script>

<Group y={-step / 2}>
	{#each thresholds as price (price)}
		{@const exp = expOf(grouping)}
		{@const rounded = round(price, -exp)}
		{@const step = grouping * 10}
		{@const isPrimary = Math.floor(price / step) * step === price}

		{@const color = isPrimary ? primaryColor : secondaryColor}
		{@const fontSize = isPrimary ? '10pt' : '9pt'}

		<Range
			range={rounded.toFixed(Math.max(0, -exp))}
			y={priceRangeScale(price)}
			{color}
			{fontSize}
		/>
	{/each}
</Group>

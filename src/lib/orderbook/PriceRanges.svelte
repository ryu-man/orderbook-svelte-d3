<script lang="ts">
	import type { ScaleLinear } from 'd3';
	import { Group } from '$lib/canvas';
	import { expOf, floor, round } from '$lib/utils';
	import Range from './PriceRange.svelte';

	export let grouping = 10;
	export let step = 2;
	export let thresholds: number[] = [];
	export let priceRangeScale: ScaleLinear<number, number>;

	export let primaryColor = 'rgb( 255 255 255 / 1)';
	export let secondaryColor = 'rgb( 255 255 255 / 0.5)';

	function primary(exp: number, price: number, step: number) {
		if (exp > 0) {
			return floor(price / step, 0) * step === price;
		}
		return floor(price / step, 0) * step === price;
	}
</script>

<Group y={-step / 2}>
	{#each thresholds as price (price)}
		{@const exp = expOf(grouping)}
		{@const roundedPrice = round(price, -Math.min(0, exp))}
		{@const step = grouping * 10}
		{@const isPrimary = primary(exp, roundedPrice, step)}

		{@const color = isPrimary ? primaryColor : secondaryColor}
		{@const fontSize = isPrimary ? '10pt' : '9pt'}

		<Range
			range={roundedPrice.toFixed(Math.max(0, -exp))}
			y={priceRangeScale(price)}
			{color}
			{fontSize}
		/>
	{/each}
</Group>

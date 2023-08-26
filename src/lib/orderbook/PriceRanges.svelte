<script lang="ts">
	import { Group } from '$lib/canvas';
	import type { ScaleLinear } from 'd3';
	import Range from './PriceRange.svelte';
	import { expOf, floor, round } from '$lib/utils';

	export let grouping = 10;
	export let step = 2;
	export let thresholds: number[] = [];
	export let priceRangeScale: ScaleLinear<number, number>;

	function getOpacity(price: number, step = 10) {
		if (Math.floor(price / step) * step === price) {
			return 0.9;
		}

		return 0.4;
	}

	function getFontSize(price: number, step = 10) {
		if (Math.floor(price / step) * step === price) {
			return '10pt';
		}

		return '9pt';
	}
</script>

<Group y={-step / 2}>
	{#each thresholds as price (price)}
		{@const exp = expOf(grouping)}
		{@const rounded = round(price, -exp)}

		<Range
			range={rounded.toFixed(Math.max(0, -exp))}
			y={priceRangeScale(price)}
			opacity={getOpacity(rounded, grouping * 10)}
			fontSize={getFontSize(rounded, grouping * 10)}
		/>
	{/each}
</Group>

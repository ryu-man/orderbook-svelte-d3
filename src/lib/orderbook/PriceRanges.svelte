<script lang="ts">
	import { Group, Text } from '$lib/canvas';
	import type { ScaleLinear } from 'd3';
	import Range from './PriceRange.svelte';

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
		<Range
			range={price}
			y={priceRangeScale(price)}
			opacity={getOpacity(price, grouping * 10)}
			fontSize={getFontSize(price, grouping * 10)}
		/>
	{/each}
</Group>

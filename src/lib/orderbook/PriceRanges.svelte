<script lang="ts">
	import { Group, Text } from '$lib/canvas';
	import type { ScaleLinear } from 'd3';

	export let step = 2;
	export let thresholds: number[] = [];
	export let priceRangeScale: ScaleLinear<number, number>;
</script>

<Group y={-step / 2}>
	{#each thresholds.slice(0, -1) as priceRange}
		<Text
			x={0}
			y={priceRangeScale(priceRange)}
			dx={-8}
			dy={0}
			value={priceRange.toString()}
			color="rgb(255 255 255 / .6)"
			fill="rgb(255 255 255 / 0)"
			align="end"
			baseline="middle"
			fontWeight="normal"
			fontSize="10pt"
		/>
	{/each}
</Group>

<script lang="ts">
	import { flip } from 'svelte/animate';
	import type { Spread } from '$lib/types';
	import { sizeOf, totalOf } from '$lib/utils';
	import type { Bin, ScaleLinear } from 'd3';
	import SpreadItem from './SpreadItem.svelte';
	import { fade, slide } from 'svelte/transition';

	export let data: Spread[] = [];
	export let scale: ScaleLinear<number, number>;

	export let backgroundColor: string;
	export let textColor: string;

	export let reverse = false;

	export let grouping = 0;

	export let type: 'staircase' | 'ungrouped' = 'staircase';

	let klass = '';
	export { klass as class };

	function getTotalOf(grouping: number) {
		if (grouping === 0) {
			return sizeOf;
		}

		return totalOf;
	}

	function getSizeOf(grouping: number) {
		if (grouping === 0) {
			return (item: Spread) => item[1];
		}

		return sizeOf;
	}

	function getPrice(grouping = 0) {
		if (grouping === 0) {
			return (item: Spread) => item[0];
		}

		return (item: Bin<Spread[], number>) => item.x1;
	}

	function key(item: Spread | Bin<Spread[], number>) {
		if (item.x0 && item.x1) {
			return item.x0 + '-' + item.x1;
		}
		return item[0];
	}
</script>

<div class="group {klass}" class:reverse>
	<div class="">
		<div class="flex flex-col w-full h-full" style:gap={1 * window.devicePixelRatio + 'px'}>
			{#each data as item, i (key(item))}
				{@const total = getTotalOf(grouping)(data.slice(0, i))}
				{@const size = getSizeOf(grouping)(item)}
				{@const price = getPrice(grouping)(item)}
				{@const exponent = Math.min(2, Math.log10(grouping || 1))}

				{@const width = type === 'staircase' ? scale(total) : scale(size)}

				<div class="flex-1 flex min-h-0" animate:flip={{ duration: 100 }}>
					<SpreadItem
						{total}
						{size}
						{price}
						{width}
						{backgroundColor}
						{textColor}
						fractionDigits={Math.abs(Math.floor(exponent)) +
							Math.ceil(exponent - Math.floor(exponent))}
					/>
				</div>
			{/each}
		</div>
	</div>
</div>

<style lang="postcss">
	.group {
		@apply text-sm flex-1 relative;
		font-size: clamp(0.2vh, 1.2vh, 24px);
	}

	.group > div {
		@apply absolute inset-0;
	}

	.group.reverse > div > div {
		@apply flex-col-reverse;
	}
</style>

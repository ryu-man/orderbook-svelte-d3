<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';
	import { format } from '$lib/utils';

	export let total = 0;
	export let size = 0;
	export let price = 0;
	export let width = 0;

	export let backgroundColor: string;
	export let textColor: string;

	export let fractionDigits = 0;

	const width$ = tweened(width, { duration: 100, easing: cubicOut });
	$: width$.set(width);
</script>

<div class="spread-item flex relative">
	<div
		class="flex items-center pl-2"
		style:background-color={backgroundColor}
		style:color={textColor}
		style:width={$width$ + '%'}
	>
		<span>{price.toFixed(Math.max(2, fractionDigits))}</span>
	</div>
	<div class="absolute top-0 bottom-0 right-2 flex items-center gap-4 text-white">
		<span class="absolute right-0" style:transform="translateX(0) translateX(-25vw)">{format(total)}</span>
		<span class="absolute right-0">{format(size)}</span>
	</div>
</div>

<style lang="postcss">
	.spread-item {
		flex: 1;
		min-height: 0;
	}

	.spread-item:hover {
		filter: brightness(1.2);
	}
</style>

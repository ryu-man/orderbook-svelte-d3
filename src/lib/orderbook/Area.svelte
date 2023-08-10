<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { getCanvasContext } from '../canvas';
	import type { ScaleLinear } from 'd3';

	const { mount, unmount } = getCanvasContext();

	export let tick: Date | string | number;
	export let x = 0;
	export let y = 0;

	onMount(() => {
		mount(draw);

		return () => {
			unmount(draw);
		};
	});

	function draw(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = 'white';
		ctx.fillText(tick.toString(), x, y);
	}
</script>

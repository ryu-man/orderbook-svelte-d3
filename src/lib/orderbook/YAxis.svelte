<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { getCanvasContext } from '../canvas';
	import type { ScaleLinear } from 'd3';
	import Tick from './Tick.svelte';

	const { height$, mount, unmount } = getCanvasContext();

	export let scale: ScaleLinear<any, any>;
	export let values: any[] | undefined = undefined;

	$: [r0, r1] = scale.range();

	onMount(() => {
		mount(draw);

		return () => {
			unmount(draw);
		};
	});

	function draw(ctx: CanvasRenderingContext2D) {
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 1;
		ctx.stroke(getDomainPath());
	}

	function getDomainPath() {
		return new Path2D(`M64,${r0} h${6} v${$height$ - r0} h${-6}`);
	}

	$: ticks = values ?? scale?.ticks?.() ?? scale.domain();
</script>

{#each ticks as tick}
	<Tick {tick} x={0} y={scale(tick)} dy={-4} />
{/each}

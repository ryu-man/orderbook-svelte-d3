<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { getCanvasContext } from './context';
	import type { ScaleLinear } from 'd3';

	const { mount, unmount } = getCanvasContext();

	export let d = '';
	export let gradientX = 0;
	export let gradientY = 0;
	export let gradientWidth = 0;
	export let gradientHeight = 0;
	export let stroke: string | [string, number][] = 'black';
	export let strokeWidth = 1;
	export let fill: string | [string, number][] = 'transparent';

	onMount(() => {
		mount(draw);

		return () => {
			unmount(draw);
		};
	});

	$: path = new Path2D(d);

	function draw(ctx: CanvasRenderingContext2D) {
		if (Array.isArray(fill)) {
			const gradient = ctx.createLinearGradient(
				gradientX,
				gradientY,
				gradientX + gradientWidth,
				gradientY + gradientHeight
			);

			fill.forEach(([color, offset = 0]) => {
				gradient.addColorStop(offset, color);
			});

			ctx.fillStyle = gradient;
		} else {
			ctx.fillStyle = fill;
		}

		ctx.fill(path);

		if (Array.isArray(stroke)) {
			const gradient = ctx.createLinearGradient(
				gradientX,
				gradientY,
				gradientX + gradientWidth,
				gradientY + gradientHeight
			);

			stroke.forEach(([color, offset]) => {
				gradient.addColorStop(offset, color);
			});

			ctx.strokeStyle = gradient;
		} else {
			ctx.strokeStyle = stroke;
		}

		ctx.lineWidth = strokeWidth;

		ctx.stroke(path);
	}
</script>

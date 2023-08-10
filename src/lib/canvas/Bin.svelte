<script lang="ts">
	import { onMount } from 'svelte';
	import { getCanvasContext } from './context';

	const { mount, unmount } = getCanvasContext();

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = 0;

	export let gradientX = x;
	export let gradientY = y;
	export let gradientWidth = width;
	export let gradientHeight = height;

	export let fill: string | [string, number][] = 'black';

	onMount(() => {
		mount(draw);

		return () => {
			unmount(draw);
		};
	});

	function draw(ctx: CanvasRenderingContext2D) {
		if (Array.isArray(fill)) {
			const gradient = ctx.createLinearGradient(
				gradientX,
				gradientY,
				gradientX + gradientWidth,
				gradientY + gradientHeight
			);

			fill.forEach(([color, offset]) => {
				gradient.addColorStop(offset, color);
			});

			ctx.fillStyle = gradient;
		} else {
			ctx.fillStyle = fill;
		}

		ctx.fillRect(x, y, width, height);
	}
</script>

<slot />

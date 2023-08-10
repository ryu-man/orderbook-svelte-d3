<script lang="ts">
	import { onMount } from 'svelte';
	import { getCanvasContext } from './context';

	const { mount, unmount } = getCanvasContext();

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = 0;

	export let fill: string | [string, number][] = 'black';

	onMount(() => {
		mount(draw);

		return () => {
			unmount(draw);
		};
	});

	function draw(ctx: CanvasRenderingContext2D) {
		if (Array.isArray(fill)) {
			const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
			fill.forEach(([color, offset]) => {
				gradient.addColorStop(offset, color);
			});

			ctx.fillStyle = gradient;
		} else {
			ctx.fillStyle = fill;
		}

		ctx.fillRect(x, y, width - x, height);
	}
</script>

<slot />

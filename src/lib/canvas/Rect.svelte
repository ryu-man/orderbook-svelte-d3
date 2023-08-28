<script lang="ts">
	import { onMount } from 'svelte';
	import { getCanvasContext } from './context';
	import { getDraw } from './utils';

	const { mount, unmount } = getCanvasContext();

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = 0;

	export let fill: string | [string, number][] = 'black';

	const elem = getDraw(
		(ctx: CanvasRenderingContext2D) => {
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
		},
		{
			x,
			y,
			w: width,
			h: height,
			type: 'rect'
		}
	);

	$: elem.x = x;
	$: elem.y = y;
	$: elem.w = width;
	$: elem.h = height;

	onMount(() => {
		mount(elem);

		return () => {
			unmount(elem);
		};
	});
</script>

<slot />

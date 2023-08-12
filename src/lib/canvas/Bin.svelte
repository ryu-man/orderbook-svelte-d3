<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { getCanvasContext } from './context';

	const dispatch = createEventDispatcher();

	const { mount, unmount, addEventListener, removeEventListener } = getCanvasContext();

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = 0;

	export let gradientX = x;
	export let gradientY = y;
	export let gradientWidth = width;
	export let gradientHeight = height;

	export let fill: string | [string, number][] = 'black';

	// $: console.log(fill);

	let path: Path2D;
	let transform: DOMMatrix;

	let pointerenter = false;

	onMount(() => {
		mount(draw);

		const removeEventListener = addEventListener(
			'pointermove',
			(e: PointerEvent, ctx: CanvasRenderingContext2D) => {
				ctx.save();

				const offsetX = +e.offsetX;
				const offsetY = +e.offsetY;

				ctx.setTransform(transform);

				if (ctx.isPointInPath(path, offsetX, offsetY)) {
					if (!pointerenter) {
						dispatch('pointerenter');
						pointerenter = true;
					}
				} else {
					if (pointerenter) {
						dispatch('pointerleave');
						pointerenter = false;
					}
				}

				ctx.restore();
				return;
			}
		);

		return () => {
			unmount(draw);
			removeEventListener();
		};
	});

	function draw(ctx: CanvasRenderingContext2D) {
		transform = ctx.getTransform();

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

		path = new Path2D(`M${x},${y} h${width} v${height} h${-width} z0,0`);

		ctx.fillRect(x, y, width, height);
	}
</script>

<slot />

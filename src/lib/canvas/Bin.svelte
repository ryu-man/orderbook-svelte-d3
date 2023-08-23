<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { getCanvasContext, type DrawFn } from './context';
	import { getDraw } from './utils';
	import { cubicOut } from 'svelte/easing';

	const dispatch = createEventDispatcher();

	const { mount, unmount, addEventListener, removeEventListener, ctx$ } = getCanvasContext();

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = 0;

	export let gradientX = x;
	export let gradientY = y;
	export let gradientWidth = width;
	export let gradientHeight = height;

	export let fill: string | [string, number][] = 'black';

	const width$ = tweened(width, { duration: 400, easing: cubicOut, delay: Math.random() * 600 });
	$: width$.set(width);

	const y$ = tweened(y, { duration: 400, easing: cubicOut });
	$: y$.set(y);

	let path: Path2D;
	let transform: DOMMatrix;

	let pointerenter = false;

	const elem = getDraw(
		(ctx: CanvasRenderingContext2D) => {
			transform = ctx.getTransform();

			if (gradient) {
				ctx.fillStyle = gradient;
			} else {
				ctx.fillStyle = fill as string;
			}
			ctx.fillRect(x, $y$, $width$, height);
		},
		{ x, y, w: width, h: height, type: 'bin' }
	);

	$: elem.x = x;
	$: elem.y = y;
	$: elem.w = width;
	$: elem.h = height;

	onMount(() => {
		tick().then(() => {
			mount(elem);
		});

		const removeEventListener = addEventListener(
			'pointermove',
			async (e: PointerEvent, ctx: CanvasRenderingContext2D) => {
				await tick();

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
			unmount(elem);
			removeEventListener();
		};
	});

	$: gradient = buildGradient($ctx$, gradientX, gradientY, gradientWidth, gradientHeight, fill);
	$: path = new Path2D(`M${x},${y} h${width} v${height} h${-width} z0,0`);

	function buildGradient(
		ctx: CanvasRenderingContext2D,
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		fill: string | [string, number][]
	) {
		if (Array.isArray(fill)) {
			const gradient = ctx.createLinearGradient(x, y, x + width, y + height);

			fill.forEach(([color, offset]) => {
				gradient.addColorStop(offset, color);
			});

			return gradient;
		}
	}
</script>

<slot />

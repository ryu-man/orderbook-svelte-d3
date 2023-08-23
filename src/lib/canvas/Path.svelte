<script lang="ts">
	import { onMount } from 'svelte';
	import { getCanvasContext } from './context';
	import { getDraw } from './utils';

	const { mount, unmount, ctx$ } = getCanvasContext();

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = 0;

	export let d = '';
	export let gradientX = 0;
	export let gradientY = 0;
	export let gradientWidth = 0;
	export let gradientHeight = 0;
	export let stroke: string | [string, number][] = 'black';
	export let strokeWidth = 1;
	export let fill: string | [string, number][] = 'transparent';

	const elem = getDraw(
		(ctx: CanvasRenderingContext2D) => {
			if (fillGradient) {
				ctx.fillStyle = fillGradient;
			} else {
				ctx.fillStyle = fill;
			}

			if (strokeGradient) {
				ctx.strokeStyle = strokeGradient;
			} else {
				ctx.strokeStyle = stroke;
			}

			ctx.fill(path);

			ctx.lineWidth = strokeWidth;

			ctx.stroke(path);
		},
		{
			x,
			y,
			w: width,
			h: height,
			type: 'path'
		}
	);

	$: elem.x = x;
	$: elem.y = y;
	$: elem.w = width;
	$: elem.h = height;

	$: path = new Path2D(d);
	$: fillGradient = buildGradient($ctx$, gradientX, gradientY, gradientWidth, gradientHeight, fill);
	$: strokeGradient = buildGradient(
		$ctx$,
		gradientX,
		gradientY,
		gradientWidth,
		gradientHeight,
		stroke
	);

	onMount(() => {
		mount(elem);

		return () => {
			unmount(elem);
		};
	});

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

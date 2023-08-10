<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { getCanvasContext } from './context';

	const { mount, unmount, addEventListener, removeEventListener, getParentProps } =
		getCanvasContext();

	const dispatch = createEventDispatcher();

	export let value: string;
	export let x = 0;
	export let y = 0;
	export let maxWidth: number | undefined = undefined;
	export let dx = 0;
	export let dy = 0;

	export let color = 'black';
	export let fill = 'transparent';
	export let fontFamily = 'arial';
	export let fontSize = '8pt';
	export let fontWeight = '400';
	export let fontVariant = 'normal';
	export let fontStyle = 'normal';

	export let align: CanvasTextAlign = 'start';
	export let baseline: CanvasTextBaseline = 'alphabetic';

	export let padding = 2;
	export let paddingTop = padding;
	export let paddingRight = padding;
	export let paddingBottom = padding;
	export let paddingLeft = padding;

	let path: Path2D;
	let transform: DOMMatrix;

	let pointerenter = false;

	onMount(() => {
		mount(draw);
		const removeClickEventListener = createEventListener('click', (e, ctx) =>
			dispatch('click', ctx)
		);

		const removeMouseEnterEventListener = createEventListener(
			'pointermove',
			(e, ctx) => {
				dispatch('pointermove');
				if (!pointerenter) {
					dispatch('pointerenter', ctx);
					pointerenter = true;
				}
			},
			(ctx) => {
				if (pointerenter) {
					dispatch('pointerleave', ctx);
					pointerenter = false;
				}
			}
		);

		return () => {
			removeClickEventListener();
			removeMouseEnterEventListener();
			unmount(draw);
		};
	});

	function draw(ctx: CanvasRenderingContext2D) {
		transform = ctx.getTransform();

		ctx.font = ` ${fontSize} ${fontFamily}`;
		ctx.textAlign = align;
		ctx.textBaseline = baseline;

		const metrics = ctx.measureText(value);

		const width = metrics.width;

		const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

		const paddingVertical = paddingLeft + paddingRight;
		const paddingHorinzontal = paddingTop + paddingBottom;

		path = new Path2D(
			`M${x + dx - metrics.actualBoundingBoxLeft - paddingLeft},${
				y + dy - metrics.actualBoundingBoxAscent - paddingTop
			} h${width + paddingVertical} v${actualHeight + paddingHorinzontal} h${
				-width - paddingVertical
			} z0,0`
		);

		ctx.fillStyle = fill;
		ctx.fill(path, 'evenodd');

		ctx.fillStyle = color;
		ctx.fillText(value, x + dx, y + dy, maxWidth);
	}

	function createEventListener(
		type: string,
		callback,
		out: ((ctx: CanvasRenderingContext2D) => boolean | void) | undefined = undefined
	) {
		let canCallAgain = true;

		return addEventListener(type, (e: PointerEvent, ctx: CanvasRenderingContext2D) => {
			ctx.save();
			const offsetX = +e.offsetX;
			const offsetY = +e.offsetY;

			ctx.setTransform(transform);

			if (ctx.isPointInPath(path, offsetX, offsetY)) {
				callback?.(e, ctx);
			} else if (canCallAgain) {
				canCallAgain = out?.(ctx) ?? true;
			}

			ctx.restore();
			return;
		});
	}
</script>

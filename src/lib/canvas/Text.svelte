<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { getCanvasContext } from './context';
	import { getDraw } from './utils';

	const { mount, unmount, addEventListener, removeEventListener, getParentProps, ctx$ } =
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
	const elem = getDraw(
		(ctx: CanvasRenderingContext2D) => {
			transform = ctx.getTransform();

			ctx.fillStyle = color;
			ctx.font = ` ${fontSize} ${fontFamily}`;
			ctx.textAlign = align;
			ctx.textBaseline = baseline;

			// if (path) {
			// 	ctx.fillStyle = fill;
			// 	ctx.fill(path, 'evenodd');
			// }

			ctx.fillText(value, x + dx, y + dy);
		},
		{ x, y, type: 'text' }
	);

	$: measures = measure($ctx$, value, { fontFamily, fontSize, align, baseline });
	$: elem.x = x;
	$: elem.y = y;
	$: elem.w = measures.w;
	$: elem.h = measures.h;

	onMount(() => {
		tick().then(() => {
			mount(elem);
		});

		// const removeClickEventListener = createEventListener('click', (e, ctx) =>
		// 	dispatch('click', ctx)
		// );

		// const removeMouseEnterEventListener = createEventListener(
		// 	'pointermove',
		// 	(e, ctx) => {
		// 		dispatch('pointermove');
		// 		if (!pointerenter) {
		// 			dispatch('pointerenter', ctx);
		// 			pointerenter = true;
		// 		}
		// 	},
		// 	(ctx) => {
		// 		if (pointerenter) {
		// 			dispatch('pointerleave', ctx);
		// 			pointerenter = false;
		// 		}
		// 	}
		// );

		return () => {
			// removeClickEventListener();
			// removeMouseEnterEventListener();
			unmount(elem);
		};
	});

	$: if (fill && fill !== 'transparent') {
		path = buildPath($ctx$, value, { x, y, fontFamily, fontSize, align, baseline });
	}

	function measure(
		ctx: CanvasRenderingContext2D,
		value: string,
		{ fontSize = '8pt', fontFamily = 'arial', align = 'start', baseline = 'alphabetic' } = {}
	) {
		if (!ctx) {
		}

		ctx.save();
		ctx.font = ` ${fontSize} ${fontFamily}`;
		ctx.textAlign = align;
		ctx.textBaseline = baseline;

		const metrics = ctx.measureText(value);

		const w = metrics.width;
		const h = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

		ctx.restore();

		return { w: w, h: h };
	}

	function buildPath(
		ctx: CanvasRenderingContext2D,
		value: string,
		{
			x = 0,
			y = 0,
			fontSize = '8pt',
			fontFamily = 'arial',
			align = 'start',
			baseline = 'alphabetic'
		}
	) {
		ctx.font = ` ${fontSize} ${fontFamily}`;
		ctx.textAlign = align;
		ctx.textBaseline = baseline;

		const metrics = ctx.measureText(value);

		const width = metrics.width;

		const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

		const paddingVertical = paddingLeft + paddingRight;
		const paddingHorinzontal = paddingTop + paddingBottom;

		return new Path2D(
			`M${x + dx - metrics.actualBoundingBoxLeft - paddingLeft},${
				y + dy - metrics.actualBoundingBoxAscent - paddingTop
			} h${width + paddingVertical} v${actualHeight + paddingHorinzontal} h${
				-width - paddingVertical
			} z0,0`
		);
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

			if (path && ctx.isPointInPath(path, offsetX, offsetY)) {
				callback?.(e, ctx);
			} else if (canCallAgain) {
				canCallAgain = out?.(ctx) ?? true;
			}

			ctx.restore();
			return;
		});
	}
</script>

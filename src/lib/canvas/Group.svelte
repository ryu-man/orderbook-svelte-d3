<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getCanvasContext,
		type DrawFn,
		overridesContext,
		getCanvasViewportContext
	} from './context';
	import { getDraw, shouldDraw } from './utils';

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = 0;
	export let clip = false;

	const { vh$, vw$, vx$, vy$ } = getCanvasViewportContext();
	const { mount, unmount, getParentProps, clear } = getCanvasContext();
	overridesContext({
		mount: _mount,
		unmount: _unmount,
		getParentProps: _getParentProps,
		clear
	});

	let children: DrawFn[] = [];

	$: vx = $vx$;
	$: vy = $vy$;
	$: vw = $vw$;
	$: vh = $vh$;

	$: path = new Path2D(`M0,0 h${width} v${height} h${-width} Z0,0`);

	const elem = getDraw(
		(ctx: CanvasRenderingContext2D) => {
			ctx.translate(x, y);

			if (clip && path) {
				ctx.clip(path);
			}

			const within_view = children.filter(
				(child) =>
					child.type === 'group' ||
					shouldDraw(vx, vy, vw, vh, {
						x: child.x + x,
						y: child.y + y,
						w: child.w,
						h: child.h
					})
			);

			for (let index = 0; index < within_view.length; index++) {
				const element = within_view[index];

				ctx.save();

				element.draw(ctx);

				ctx.restore();
			}
		},
		{
			x,
			y,
			w: width,
			h: height,
			type: 'group'
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

	function _mount(fn: DrawFn) {
		children = [..._unmount(fn), fn];
	}
	function _unmount(fn: DrawFn) {
		children = children.filter((d) => d !== fn);
		return children;
	}

	function _getParentProps() {
		const props = getParentProps?.();

		return { x: x + props?.x || 0, y: y + props?.y || 0 };
	}
</script>

<slot />

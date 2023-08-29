<script lang="ts">
	import { onMount } from 'svelte';
	import { getCanvasContext, overridesContext, type DrawFn } from './context';
	import { getDraw, shouldDraw } from './utils';

	const { mount, unmount, getParentProps, clear } = getCanvasContext();
	overridesContext({
		mount: _mount,
		unmount: _unmount,
		getParentProps: _getParentProps,
		clear
	});

	let children: DrawFn[] = [];

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let height = 0;

	$: path = new Path2D(`M${x},${y} h${width} v${height} h${-width} Z0,0`);

	const elem = getDraw(
		(ctx: CanvasRenderingContext2D) => {
			ctx.clip(path);

			for (let index = 0; index < children.length; index++) {
				const element = children[index];

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
			type: 'clip'
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

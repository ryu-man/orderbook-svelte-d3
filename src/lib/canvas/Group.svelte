<script lang="ts">
	import { onMount } from 'svelte';
	import { setCanvasContext, getCanvasContext, type DrawFn, overridesContext } from './context';

	export let x = 0;
	export let y = 0;

	const { mount, unmount, getParentProps, clear } = getCanvasContext();

	// setCanvasContext({
	// 	mount: _mount,
	// 	unmount: _unmount,
	// 	getParentProps: _getParentProps,
	// 	clear,
	// 	...rest
	// });
	overridesContext({
		mount: _mount,
		unmount: _unmount,
		getParentProps: _getParentProps,
		clear
	});

	let children: DrawFn[] = [];

	onMount(() => {
		mount(draw);

		return () => {
			unmount(draw);
		};
	});

	function draw(ctx: CanvasRenderingContext2D) {
		ctx.translate(x, y);

		children.forEach((draw) => {
			ctx.save();

			draw(ctx);

			ctx.restore();
		});
	}

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

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { setCanvasContext } from './context';
	import { writable, type Writable } from 'svelte/store';
	import type { Padding } from '$lib/orderbook/types';

	const { ctx$, height$, width$ } = setCanvasContext({
		mount,
		unmount,
		addEventListener,
		removeEventListener,
		clear: clearCanvas
	});

	export let width = 0;
	export let height = 0;
	export let style = '';

	$: width$.set(width);
	$: height$.set(height);

	let node: HTMLCanvasElement;
	let mounted = false;

	const events = new Map<string, ((e: Event, ctx: CanvasRenderingContext2D) => void)[]>();
	const queu$ = writable<((ctx: CanvasRenderingContext2D) => void)[]>([]);

	$: console.log($queu$.length);

	// onMount(() => {});

	export function draw(queu: ((ctx: CanvasRenderingContext2D) => void)[]) {
		$ctx$.clearRect(0, 0, $width$, $height$);

		queu.forEach((draw) => {
			$ctx$.save();

			draw($ctx$);

			$ctx$.restore();
		});
	}

	function mount(fn: (ctx: CanvasRenderingContext2D) => void) {
		queu$.update((val) => {
			return [...val.filter((d) => d !== fn), fn];
		});
	}

	function unmount(fn: (ctx: CanvasRenderingContext2D) => void) {
		queu$.update((val) => {
			return val.filter((d) => d !== fn);
		});
	}

	function addEventListener(type: string, callback) {
		const array = events.get(type) || [];
		events.set(type, [...array, callback]);

		// node.addEventListener(type, (e) => callback(e, $ctx$));

		return () => removeEventListener(type, callback);
		// return () => node.removeEventListener(type, callback);
	}

	function removeEventListener(type: string, callback) {
		const array = (events.get(type) || []).filter((d) => d !== callback);
		events.set(type, array);
	}

	function onPointerMoveHandler(e: PointerEvent) {
		const array = events.get('pointermove') || [];

		array.forEach((handler) => {
			handler(e, $ctx$);
		});
	}

	function onClickHandler(e: PointerEvent) {
		const array = events.get('click') || [];

		array.forEach((handler) => {
			handler(e, $ctx$);
		});
	}

	function isTarget(e: Event, { x = 0, y = 0 } = {}) {}

	function canvasMounted(node: HTMLCanvasElement) {
		const ctx = node.getContext('2d') as CanvasRenderingContext2D;
		(ctx$ as Writable<CanvasRenderingContext2D>).set(ctx);

		console.log(node.clientHeight);

		mounted = true;

		let frameId: number;

		const render = () => {
			// console.log('canvas::render')
			draw($queu$);

			frameId = requestAnimationFrame(render);
		};

		frameId = requestAnimationFrame(render);

		return {
			destroy() {
				cancelAnimationFrame(frameId);
			}
		};
	}

	function clearCanvas() {
		queu$.set([]);
		$ctx$.clearRect(0, 0, $width$, $height$);
	}
</script>

<div class="canvas-container">
	{#await tick() then _}
		<!-- promise was fulfilled -->
		<canvas
			bind:this={node}
			use:canvasMounted
			{width}
			{height}
			{style}
			on:pointermove={onPointerMoveHandler}
			on:click={onClickHandler}
		>
			{#if mounted}
				<slot clientHeight={height} clientWidth={width} />
			{/if}
		</canvas>
	{/await}
</div>

<style>
	.canvas-container {
		width: 100%;
		height: 100%;
		padding: 0;
		margin: 0;
		box-sizing: border-box;
		border-width: 0;
	}
</style>

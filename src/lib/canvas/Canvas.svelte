<script lang="ts">
	import { tick } from 'svelte';
	import { setCanvasContext } from './context';
	import { writable, type Writable } from 'svelte/store';

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

	const queu$ = writable<((ctx: CanvasRenderingContext2D) => void)[]>([]);

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
		const handler = (e) => callback(e, $ctx$);
		node.addEventListener(type, handler);

		return () => node.removeEventListener(type, handler);
	}

	function removeEventListener(type: string, handler) {
		return node.removeEventListener(type, handler);
	}

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
	<canvas bind:this={node} use:canvasMounted {width} {height} {style}>
		{#if mounted}
			<slot clientHeight={height} clientWidth={width} />
		{/if}
	</canvas>
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

<script lang="ts">
	import { tick } from 'svelte';
	import { setCanvasContext, setCanvasViewportContext, type DrawFn } from './context';
	import { writable, type Writable } from 'svelte/store';
	import { shouldDraw } from './utils';

	const { vh$, vw$, vx$, vy$, viewportElement$ } = setCanvasViewportContext();
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

	const queu$ = writable<DrawFn[]>([]);
	$: queu = $queu$;
	$: ctx = $ctx$;

	$: vx = $vx$;
	$: vy = $vy$;
	$: vw = $vw$;
	$: vh = $vh$;

	export function draw(queu: DrawFn[]) {
		const within_view = queu.filter(
			(child) => child.type === 'group' || shouldDraw(vx, vy, vw, vh, child)
		);

		ctx.clearRect(0, 0, $width$, $height$);

		for (let index = 0; index < within_view.length; index++) {
			const element = within_view[index];

			ctx.save();

			element.draw(ctx);

			ctx.restore();
		}
	}

	function mount(fn: DrawFn) {
		queu$.update((val) => {
			return [...val.filter((d) => d !== fn), fn];
		});
	}

	function unmount(fn: DrawFn) {
		queu$.update((val) => {
			return val.filter((d) => d !== fn);
		});
	}

	function addEventListener(type: string, callback) {
		const handler = (e) => callback(e, ctx);
		node.addEventListener(type, handler);

		return () => node.removeEventListener(type, handler);
	}

	function removeEventListener(type: string, handler) {
		return node.removeEventListener(type, handler);
	}

	function canvasMounted(node: HTMLCanvasElement) {
		vx$.set($viewportElement$.scrollLeft);
		vy$.set($viewportElement$.scrollTop);

		const ctx = node.getContext('2d') as CanvasRenderingContext2D;
		(ctx$ as Writable<CanvasRenderingContext2D>).set(ctx);

		mounted = true;

		let frameId: number;

		const render = () => {
			draw(queu);

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
		ctx.clearRect(0, 0, $width$, $height$);
	}

	function scrollhandler(e: Event) {
		const currentTarget = e.currentTarget as HTMLDivElement;

		vx$.set(currentTarget.scrollLeft);
		vy$.set(currentTarget.scrollTop);
	}
</script>

<div
	class="canvas-container"
	bind:this={$viewportElement$}
	bind:clientWidth={$vw$}
	bind:clientHeight={$vh$}
	on:scroll={scrollhandler}
	on:scroll
>
	{#await tick() then _}
		<canvas bind:this={node} use:canvasMounted {width} {height} {style}>
			{#if mounted}
				<slot clientHeight={height} clientWidth={width} {vx} {vy} {vw} {vh} />
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
		overflow-y: scroll;
		overflow-x: hidden;
	}
</style>

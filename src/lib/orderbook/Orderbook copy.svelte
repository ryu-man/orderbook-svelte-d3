<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		scaleLinear,
		scaleBand,
		min,
		max,
		bin,
		extent,
		line,
		area,
		reverse,
		curveStep,
		curveStepAfter,
		curveStepBefore,
		type Bin
	} from 'd3';
	import { Canvas } from '../canvas';
	import { Stage, Layer, Path, Rect, Text } from '../konva'
	import XAxis from './XAxis.svelte';
	import YAxis from './YAxis.svelte';
	// import Rect from './Rect.svelte';
	// import Path from './Path.svelte';
	// import Text from './Text.svelte';
	import type { Padding } from './types';
	import MarketPrice from './MarketPrice.svelte';

	let innerWidth = 0;
	let innerHeight = 0;
	let canvasController: Canvas;

	export let width = 0;
	export let height = 0;
	export let padding: Partial<Padding> = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	};
	export let paddingTop = padding.top || 0;
	export let paddingRight = padding.right || 0;
	export let paddingBottom = padding.bottom || 0;
	export let paddingLeft = padding.left || 0;

	export let unite = 'px';

	export let bids: [number, number][] = [];
	export let asks: [number, number][] = [];

	const priceAccessor = (d: [number, number]) => d[0];
	const qteAccessor = (d: [number, number]) => d[1];

	$: asksMin = min(asks, priceAccessor) || 0;
	$: asksMax = max(asks, priceAccessor) || 0;
	$: bidsMin = min(bids, priceAccessor) || 0;
	$: bidsMax = max(bids, priceAccessor) || 0;

	$: spreadMin = Math.min(asksMin, bidsMin);
	$: spreadMax = Math.max(asksMax, bidsMax);

	$: marketPrice = (asksMin + bidsMax) / 2;

	$: yDomain = [27000, 32000];

	$: xScale = scaleLinear([0, 1000], [54, innerWidth - 54 - 24]);

	$: yScale = scaleLinear(reverse(yDomain), [24, innerHeight]);

	$: totalScale = scaleLinear(
		extent(bids, (d) => d[0] * d[1]),
		[20, innerHeight]
	);

	$: thresholds = getThresholds(yDomain as [number, number], 100);

	$: bidsBins = bin<[number, number], number>()
		.domain(yDomain as [number, number])
		.value(priceAccessor)
		.thresholds(thresholds)(bids);

	$: asksBins = bin<[number, number], number>()
		.domain(yDomain as [number, number])
		.value(priceAccessor)
		.thresholds(thresholds)(asks);

	$: d = line<Bin<[number, number], number>>()
		.x((d) => xScale(d.length))
		.y((d) => yScale(d.x1))
		.curve(curveStepAfter)(bidsBins.filter((bin) => bin.length));

	onMount(() => {
		canvasController?.draw();

		const inervalId = setInterval(() => {
			canvasController?.draw();
		}, 3000);

		return () => {
			clearInterval(inervalId);
		};
	});

	function resizer(node: HTMLDivElement) {
		innerWidth = node.clientWidth;
		innerHeight = node.clientHeight;

		const observer = new ResizeObserver(() => {
			innerWidth = node.clientWidth;
			innerHeight = node.clientHeight;
		});

		observer.observe(node, {});

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	function first<T>(array: T[]): T {
		return array[0];
	}
	function last<T>(array: T[]): T {
		return array[array.length - 1];
	}

	function getThresholds(domain: [number, number], step = 100) {
		const array = [];

		let i = domain[0];

		while (i < domain[1]) {
			array.push(i);
			i += step;
		}

		return array;
	}
</script>

<div
	use:resizer
	class="orderbook"
	style:width={width ? width + unite : '100%'}
	style:height={height ? height + unite : '100%'}
>
	<Stage>
		<Layer>
			
		</Layer>
	</Stage>
	<Canvas bind:this={canvasController} width={innerWidth} height={innerHeight}>
		{@const [xr0, xr1] = xScale.range()}
		{@const [yr0, yr1] = yScale.range()}
		{@const step = (yr1 - yr0) / thresholds.length}

		<XAxis scale={xScale} />
		<!-- <YAxis scale={yScale} values={thresholds} /> -->

		{#each thresholds as prange}
			<Text
				x={xr0}
				y={yScale(prange)}
				dx={-8}
				dy={-step / 2}
				value={prange.toString()}
				fill="rgb(255 255 255 / .4)"
				align="end"
				baseline="middle"
				fontWeight="normal"
				fontSize="10pt"
			/>
		{/each}

		{#each asksBins.filter((bin) => bin.length) as bin (bin.x1)}
			{@const y0 = yScale(bin.x0)}
			{@const y1 = yScale(bin.x1)}
			{@const step = Math.abs(y0 - y1)}
			{@const width = xScale(bin.length)}

			<Rect x={xr0} y={y0} height={y1 - y0 - 1} {width} fill="rgb(235 86 96 / .6)" />
			<Text
				value={width.toFixed(2)}
				x={xScale.range()[0] + 12}
				y={y1 + step / 2}
				baseline="middle"
			/>
		{/each}

		{#each bidsBins.filter((bin) => bin.length) as bin (bin.x1)}
			{@const y0 = yScale(bin.x0)}
			{@const y1 = yScale(bin.x1)}
			{@const step = Math.abs(y0 - y1)}
			{@const width = xScale(bin.length)}

			<Rect x={xr0} y={y0} height={y1 - y0 - 1} {width} fill="rgb(255 255 225 / .6)" />
			<Text
				value={width.toFixed(2)}
				x={xScale.range()[0] + 12}
				y={y0 - step / 2}
				baseline="middle"
			/>
		{/each}

		<Path {d} stroke="yellow" />

		{@const mpScaled = yScale(marketPrice)}
		<MarketPrice x={xr0} y={mpScaled} width={xr1 - xr0} stroke="yellow">
			<Text
				value={marketPrice.toString()}
				x={spreadMax}
				y={mpScaled}
				baseline="hanging"
				fill="yellow"
			/>
		</MarketPrice>
	</Canvas>
</div>

<style>
	.orderbook {
		margin: 0;
		padding: 0;
		border-width: 0;
		overflow: hidden;
	}
</style>

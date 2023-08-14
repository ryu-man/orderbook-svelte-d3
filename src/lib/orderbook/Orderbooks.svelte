<script lang="ts">
	import { scaleBand } from 'd3';
	import { Canvas, Group } from '../canvas';
	import { tick } from 'svelte';
	import type { Source } from './types';
	import OrderbookSource from './OrderbookSource.svelte';
	import { setOrderbookContext } from './context';

	export let padding = {
		top: 48,
		right: 24,
		bottom: 0,
		left: 48
	};
	export let width = 0;
	export let height = 0;

	export let sources: Source[];
	export let domain: [number, number];
	export let grouping = 10;

	const { padding$ } = setOrderbookContext();
	$: padding$.set(padding);

	let clientWidth = 0;
	let clientHeight = 0;

	$: innerWidth = clientWidth - padding.left - padding.right;
	$: innerHeight = clientHeight - padding.top - padding.bottom;

	$: productIds = sources.map((d) => d.productId);
	$: productScale = scaleBand()
		.domain(productIds)
		.range([0, innerWidth])
		.paddingInner(0.2)
		.paddingOuter(0);

	$: thresholds = getThresholds(domain, grouping);

	$: maxHeight = Math.max(innerHeight, thresholds.length * 24);

	function resizer(node: HTMLDivElement) {
		clientWidth = node.clientWidth;
		clientHeight = node.clientHeight;

		const observer = new ResizeObserver(() => {
			clientWidth = node.clientWidth;
			clientHeight = node.clientHeight;
		});

		observer.observe(node, {});

		return {
			destroy() {
				observer.disconnect();
			}
		};
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

<div class="orderbooks" style="width: 100%; height: 100%;" use:resizer>
	<Canvas height={maxHeight} width={clientWidth}>
		<Group x={padding.left} y={padding.top}>
			{#await tick() then _}
				{#each sources as { productId, url } (productId)}
					<OrderbookSource
						{productId}
						{url}
						x={productScale(productId)}
						width={productScale.bandwidth()}
						height={maxHeight}
						{thresholds}
					/>
				{/each}
			{/await}
		</Group>
	</Canvas>
</div>

<style>
	.storybooks {
		overflow: hidden;
	}
</style>

<script lang="ts">
	import { scaleBand } from 'd3';
	import { Canvas, Group } from '../canvas';
	import { tick } from 'svelte';
	import ExchangeComponent from './Exchange.svelte';
	import { setOrderbookContext } from './context';
	import type { Exchange } from './exchanges/exchange';

	export let padding = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	};

	export let width = 0;
	export let height = 0;

	export let exchanges: Exchange[];

	const { padding$ } = setOrderbookContext();
	$: padding$.set(padding);

	let clientWidth = 0;
	let clientHeight = 0;

	$: maxHeight = Math.max(clientHeight, 24 * 300);

	$: innerWidth = clientWidth - padding.left - padding.right;
	$: innerHeight = maxHeight - padding.top - padding.bottom;

	$: productIds = exchanges.map((d) => d.name);
	$: productScale = scaleBand()
		.domain(productIds)
		.range([0, innerWidth])
		.paddingInner(0.4)
		.paddingOuter(0.3);

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
		<Group x={padding.left} y={padding.top} width={innerWidth} height={maxHeight} clip>
			{#await tick() then _}
				{#each exchanges as exchange (exchange.name)}
					<ExchangeComponent
						{exchange}
						x={productScale(exchange.name)}
						width={productScale.bandwidth()}
						height={maxHeight}
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

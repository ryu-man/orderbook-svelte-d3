<script lang="ts">
	import { scaleBand } from 'd3';
	import Orderbook from './Orderbook.svelte';
	import { Canvas, Group } from '../canvas';
	import { messages } from './store';
	import { tick } from 'svelte';

	export let productIds: string[] = [];
	export let padding = {
		top: 48,
		right: 24,
		bottom: 0,
		left: 48
	};
	export let width = 0;
	export let height = 0;

	let clientWidth = 0;
	let clientHeight = 0;

	const stores = messages('wss://ws-feed.exchange.coinbase.com', productIds);

	const priceRange = 10;

	$: innerWidth = clientWidth - padding.left - padding.right;
	$: innerHeight = clientHeight - padding.top - padding.bottom;

	$: productScale = scaleBand()
		.domain(productIds)
		.range([0, innerWidth])
		.paddingInner(0.2)
		.paddingOuter(0);

	$: thresholds = getThresholds([27000, 32000], priceRange);

	$: maxHeight = Math.max(innerHeight, thresholds.length * 24);
	$: step = maxHeight / thresholds.length;

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
				{#each productIds as productId (productId)}
					{@const { asks$, bids$ } = stores[productId]}
					<Orderbook
						width={productScale.bandwidth()}
						height={maxHeight}
						x={productScale(productId)}
						name={productId}
						{asks$}
						{bids$}
						{thresholds}
					/>
				{/each}
			{/await}
		</Group>
	</Canvas>
</div>

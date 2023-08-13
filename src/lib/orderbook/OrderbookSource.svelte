<script lang="ts">
	import Orderbook from './Orderbook.svelte';
	import { messages } from './store';

	export let productId: string;
	export let url: string;

	export let width = 0;
	export let height = 0;
	export let x = 0;
	export let y = 0;
	export let thresholds: number[];

	const { asks$, bids$ } = messages(url, productId);
</script>

<Orderbook {width} {height} {x} {y} name={productId} {asks$} {bids$} {thresholds} />

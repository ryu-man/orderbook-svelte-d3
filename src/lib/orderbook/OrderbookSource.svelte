<script lang="ts">
	import { documentVisibilityStore } from 'svelte-legos';
	import Orderbook from './Orderbook.svelte';
	import { messages } from './store';
	import { onMount } from 'svelte';

	const visibility$ = documentVisibilityStore();

	export let productId: string;
	export let url: string;

	export let width = 0;
	export let height = 0;
	export let x = 0;
	export let y = 0;
	export let thresholds: number[];

	const { asks$, bids$, isClosed, reconnect } = messages(url, productId);

	onMount(() =>
		visibility$.subscribe((value) => {
			if (value === 'visible') {
				// Check if websocket is closed
				if (isClosed()) {
					// Then reconnect the websocket
					reconnect();
				}
			}
		})
	);
</script>

<Orderbook {width} {height} {x} {y} name={productId} {asks$} {bids$} {thresholds} />

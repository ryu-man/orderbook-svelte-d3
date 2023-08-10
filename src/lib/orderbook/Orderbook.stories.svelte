<script lang="ts">
	import { Meta, Story } from '@storybook/addon-svelte-csf';
	import Orderbook from './Orderbook.svelte';
	import { onMount } from 'svelte';
	import { derived, readable, writable, type Readable } from 'svelte/store';
	import type { Snapshot, Spread, Update } from './types';
	import Orderbooks from './Orderbooks.svelte';

	// const products = ['ETH-USD', 'BTC-USD'];
	const products = ['BTC-USD'];

	function tickerable(url: string, products: string[]) {
		const ws = new WebSocket(url);
		ws.onopen = () => {
			// ws.send(
			// 	JSON.stringify({
			// 		type: 'subscribe',
			// 		product_ids: products,
			// 		channels: ['level2_batch']
			// 	})
			// );
		};

		ws.onerror = (err) => {
			// console.error(err);
		};

		const { subscribe } = readable({}, (set) => {
			ws.onmessage = (e) => {
				set(JSON.parse(e.data));
			};

			return () => {
				ws.close();
			};
		});

		return { subscribe };
	}

	function parseSnapshot(raw: Record<string, any>): Snapshot {
		return {
			asks: raw.asks.map((d) => [parseFloat(d[0]), parseFloat(d[1])]),
			bids: raw.bids.map((d) => [parseFloat(d[0]), parseFloat(d[1])]),
			product_id: raw.product_id,
			time: new Date(raw.time),
			type: 'snapshot'
		};
	}
</script>

<Meta title="Orderbook" component={Orderbook} />

<Story id="orderbook" name="Orderbook" let:args>
	<!-- <Orderbook bids={$bids$} asks={$asks$} /> -->
	<Orderbooks productIds={products} />
</Story>

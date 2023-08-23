<script lang="ts">
	import { Meta, Story } from '@storybook/addon-svelte-csf';
	import Orderbook from './Orderbook.svelte';
	import Orderbooks from './Orderbooks.svelte';
	import { binance } from './exchanges/binance';

	const { asks$, bids$ } = binance('wss://stream.binance.com:443/ws');

	// const products = ['ETH-USD', 'BTC-USD'];
	// const sources = ['BTC-USD'];
	let from = 'BTC'; // | 'ETH' | 'SOL'
	const exchanges = [
		{
			url: 'wss://ws-feed.exchange.coinbase.com',
			productId: 'BTC-USD'
		}
	];

	let grouping = 10;
</script>

<Meta title="Orderbook" component={Orderbook} />

<Story id="bnc" name="Binance" let:args>Hello</Story>

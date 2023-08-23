<script lang="ts">
	import { Meta, Story } from '@storybook/addon-svelte-csf';
	import Orderbook from './Orderbook.svelte';
	import Orderbooks from './Orderbooks.svelte';
	import { CoinbaseExchange, BinanceExchange } from './exchanges';

	// const products = ['ETH-USD', 'BTC-USD'];
	// const sources = ['BTC-USD'];
	let from = 'BTC'; // | 'ETH' | 'SOL'
	const exchanges = [
		new CoinbaseExchange('BTC-USD', 'wss://ws-feed.exchange.coinbase.com')
		// new BinanceExchange('btcusdt', 'wss://stream.binance.com:443/ws')
	];

	let grouping = 10;
</script>

<Meta title="Orderbook" component={Orderbook} />

<Story id="orderbook" name="Orderbook" let:args>
	<div style="width: 100%; height: 100%; display: flex; flex-direction:column; overflow: hidden;">
		<div
			style="width: 100%; padding: 16px; background-color: rgb(0 0 0 / .9); box-sizing: border-box;"
		>
			<div>
				<div style="color: white; margin-bottom:4px;">Aggregating Grouping</div>
				<input
					type="number"
					value={grouping}
					on:blur={(e) => {
						grouping = e.currentTarget.valueAsNumber;
					}}
				/>
			</div>
		</div>

		<div style="flex:1; overflow: hidden;">
			<Orderbooks {exchanges} domain={[24000, 29000]} {grouping} />
		</div>
	</div>
</Story>

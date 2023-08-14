<script lang="ts">
	import { Meta, Story } from '@storybook/addon-svelte-csf';
	import Orderbook from './Orderbook.svelte';
	import Orderbooks from './Orderbooks.svelte';

	// const products = ['ETH-USD', 'BTC-USD'];
	// const sources = ['BTC-USD'];
	const sources = [
		{
			url: 'wss://ws-feed.exchange.coinbase.com',
			productId: 'BTC-USD'
		}
	];
</script>

<Meta title="Orderbook" component={Orderbook} />

<Story id="orderbook" name="Orderbook" let:args>
	<Orderbooks {sources} domain={[27000, 32000]} />
</Story>

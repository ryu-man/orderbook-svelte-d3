<script lang="ts">
	import { Meta, Story } from '@storybook/addon-svelte-csf';
	import {
		CoinbaseExchange,
		BinanceExchange,
		BitfinexExchange,
		BitmexExchange,
		BybitExchange,
		BitgetExchange,
		KrakenExchange,
		Exchange,
		getMaxGroupingValue
	} from '$lib/orderbook/exchanges';
	import { setConfigurationContext } from '$lib/configuration';
	import OrderbookLite from './OrderbookLite.svelte';
	import Feeder from './Feeder.svelte';
	import Options from './Options.svelte';

	setConfigurationContext();

	// const exchange = new CoinbaseExchange({ from: 'XRP', to: 'USD' });
	const exchange = new CoinbaseExchange({ from: 'BTC', to: 'USD' });
	let grouping = 0;
</script>

<Meta title="Orderbook Lite" component={OrderbookLite} />

<Story id="orderbooklite" name="OrderbookLite" let:args>
	<div class="flex flex-col w-full h-full">
		<Options bind:grouping />

		<div class="flex-1">
			<Feeder {exchange} bind:grouping let:asks let:bids let:marketPrice>
				<OrderbookLite
					{asks}
					{bids}
					{marketPrice}
					from={exchange.from()}
					to={exchange.to()}
					{grouping}
				/>
			</Feeder>
		</div>
	</div>
</Story>

<script lang="ts">
	import Orderbooks from '$lib/orderbook/Orderbooks.svelte';
	import {
		CoinbaseExchange,
		BinanceExchange,
		BitfinexExchange,
		BitmexExchange,
		BybitExchange,
		BitgetExchange,
		KrakenExchange,
		Exchange
	} from '$lib/orderbook/exchanges';
	import { onMount } from 'svelte';
	import { colord } from 'colord';
	import { getConfigurationContext } from '$lib/configuration';
	import { ColorPickr } from '$lib/component';
	import { scaleBand } from 'd3';

	const { grouping$, theme } = getConfigurationContext();

	const askTheme$ = theme.asks$;
	const bidTheme$ = theme.bids$;

	// const products = ['ETH-USD', 'BTC-USD'];
	// const sources = ['BTC-USD'];
	let from = 'BTC'; // | 'ETH' | 'SOL'
	let exchanges: Exchange[] = [];

	let clientWidth = 0;

	onMount(() => {
		exchanges = [
			new CoinbaseExchange({ from: 'BTC', to: 'USD' }),
			new BinanceExchange({ from: 'btc', to: 'usdt' }),
			new BitfinexExchange({ from: 'BTC', to: 'USD' }),
			new BitmexExchange({ from: 'XBT', to: 'USD' }),
			new BybitExchange({ from: 'BTC', to: 'USDT' }),
			new BitgetExchange({ from: 'BTC', to: 'USDT' }),
			new KrakenExchange({ from: 'BTC', to: 'USD' })
		];
	});

	$: productIds = exchanges.map((d) => d.fullname);
	$: productScale = scaleBand()
		.domain(productIds)
		.range([0, clientWidth])
		.paddingInner(0.4)
		.paddingOuter(0.3);

	function onChangeProduct(id: string) {
		return () => {
			from = id;

			for (let i = 0; i < exchanges.length; i++) {
				const exchange = exchanges[i];

				exchange.disconnect();
			}

			for (let i = 0; i < exchanges.length; i++) {
				const exchange = exchanges[i];
				exchange.from(id).connect();
			}

			exchanges = exchanges;
		};
	}
</script>

<div
	class="w-full h-full overflow-hidden flex flex-col relative"
	style="background-color: rgb(0 0 0)"
>
	<div class="settings-bar absolute top-0 left-0 z-10 w-full" style="backdrop-filter: blur(6px);">
		<div class="w-full p-4 box-border flex gap-6">
			<div class="flex gap-2">
				<div class="flex items-center gap-2">
					<button
						class="currency-switch"
						class:selected={from === 'BTC'}
						on:click={onChangeProduct('BTC')}>BTC</button
					>
					<button
						class="currency-switch"
						class:selected={from === 'ETH'}
						on:click={onChangeProduct('ETH')}>ETH</button
					>
				</div>
			</div>
			<div class="flex flex-col">
				<div class="text-white mb-2">Aggregating Grouping</div>
				<select
					name=""
					id=""
					value={$grouping$ + ''}
					on:change={(e) => grouping$.set(parseFloat(e.currentTarget.value))}
				>
					<option value="0.1">0.1</option>
					<option value="0.25">0.25</option>
					<option value="0.5">0.5</option>
					<option value="0.75">0.75</option>
					<option value="1">1</option>
					<option value="2.5">2.5</option>
					<option value="5">5</option>
					<option value="7.5">7.5</option>
					<option value="10">10</option>
					<option value="25">25</option>
					<option value="50">50</option>
					<option value="75">75</option>
					<option value="100">100</option>
					<option value="250">250</option>
					<option value="500">500</option>
					<option value="750">750</option>
					<option value="1000">1000</option>
				</select>
			</div>

			<div class="flex items-center">
				<span class="text-4xl text-white font-black upp">Ask Theme</span>
			</div>

			<div class="flex flex-col">
				<div class="text-white mb-2">Bin Colors</div>
				<div class="flex gap-2">
					<ColorPickr
						value={colord($askTheme$.binFill[0][0]).toHex()}
						on:change={(e) => ($askTheme$.binFill[0][0] = e.detail)}
					/>
					<ColorPickr
						value={colord($askTheme$.binFill[1][0]).toHex()}
						on:change={(e) => ($askTheme$.binFill[1][0] = e.detail)}
					/>
				</div>
			</div>

			<div class="flex flex-col">
				<div class="text-white mb-2">Area Colors</div>
				<div class="flex gap-2">
					<ColorPickr
						value={colord($askTheme$.areaFill[0][0]).toHex()}
						on:change={(e) => ($askTheme$.areaFill[0][0] = e.detail)}
					/>
					<ColorPickr
						value={colord($askTheme$.areaFill[1][0]).toHex()}
						on:change={(e) => ($askTheme$.areaFill[1][0] = e.detail)}
					/>
				</div>
			</div>

			<div class="flex items-center">
				<span class="text-4xl text-white font-black">Ask Theme</span>
			</div>

			<div class="flex flex-col">
				<div class="text-white mb-2">Bin Colors</div>
				<div class="flex gap-2">
					<ColorPickr
						value={colord($bidTheme$.binFill[0][0]).toHex()}
						on:change={(e) => ($bidTheme$.binFill[0][0] = e.detail)}
					/>
					<ColorPickr
						value={colord($bidTheme$.binFill[1][0]).toHex()}
						on:change={(e) => ($bidTheme$.binFill[1][0] = e.detail)}
					/>
				</div>
			</div>

			<div class="flex flex-col">
				<div class="text-white mb-2">Area Colors</div>
				<div class="flex gap-2">
					<ColorPickr
						value={colord($bidTheme$.areaFill[0][0]).toHex()}
						on:change={(e) => ($bidTheme$.areaFill[0][0] = e.detail)}
					/>
					<ColorPickr
						value={colord($bidTheme$.areaFill[1][0]).toHex()}
						on:change={(e) => ($bidTheme$.areaFill[1][0] = e.detail)}
					/>
				</div>
			</div>
		</div>
	</div>

	<div class="flex-1 overflow-hidden relative" bind:clientWidth>
		<div class="absolute inset-0 pointer-events-none z-10">
			<div class="orderbooks-names inner absolute w-full h-12" style="top:96px">
				<div class="w-full h-full relative">
					{#each productIds as id, i}
						<div class="orderbook-name absolute" style:left="{productScale.step() * i + 24}px">
							{id}
						</div>
					{/each}
				</div>
			</div>
		</div>
		<Orderbooks {exchanges} />
	</div>
</div>

<style lang="postcss">
	.orderbook-name {
		@apply p-2 text-lg;
		color: white;
		top: 0;
	}

	.orderbooks-names {
		backdrop-filter: blur(6px);
	}

	.settings-bar {
		height: 96px;
	}

	button.currency-switch {
		@apply p-2 font-semibold border border-white text-white bg-white bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20;
	}
	button.currency-switch.selected {
		@apply bg-white bg-opacity-100 text-gray-900 hover:bg-opacity-80 active:bg-opacity-70;
	}
</style>

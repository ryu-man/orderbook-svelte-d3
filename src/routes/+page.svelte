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
		Exchange,
		getMaxGroupingValue
	} from '$lib';
	import { onMount, tick } from 'svelte';
	import { colord } from 'colord';
	import { getConfigurationContext } from '$lib/configuration';
	import { ColorPickr } from '$lib/component';
	import { scaleBand } from 'd3';
	import { derived } from 'svelte/store';

	const { grouping$, theme$ } = getConfigurationContext();

	const currencies = ['BTC', 'ETH', 'XRP'];

	let from = 'BTC'; // | 'ETH' | 'SOL'

	let exchanges: Exchange[] = [
		new CoinbaseExchange({ from: from, to: 'USD' }).focus(true),
		new BinanceExchange({ from: from.toLowerCase(), to: 'usdt' }),
		new BitfinexExchange({ from: from, to: 'UST' }),
		new BitmexExchange({ from: from, to: 'USD' }),
		new BybitExchange({ from: from, to: 'USDT' }),
		new BitgetExchange({ from: from, to: 'USDT' }),
		new KrakenExchange({ from: from, to: 'USD' })
	];

	let clientWidth = 0;

	const maxDomain$ = derived(
		exchanges.map((d) => d.domain$),
		(domains) => {
			if (domains.some((d) => d[1] === 0)) {
				return 0;
			}

			const first = domains[0];
			return domains.reduce((acc, val) => Math.max(acc, val[0]), first[0]);
		},
		0
	);
	const minDomain$ = derived(
		exchanges.map((d) => d.domain$),
		(domains) => {
			if (domains.some((d) => d[1] === 0)) {
				return 0;
			}

			const first = domains[0];
			return domains.reduce((acc, val) => Math.min(acc, val[1]), first[1]);
		},
		0
	);
	const domain = derived(
		[maxDomain$, minDomain$],
		([max, min]) => {
			return [max, min];
		},
		[0, 0]
	);

	const aggregationValues$ = derived(
		domain,
		([max, min]) => {
			if (max === 0 || min === 0) {
				return [];
			}

			const values: number[] = [];
			if (max === 0) {
				return values;
			}

			// console.log(max)
			const maxGroupingValue = getMaxGroupingValue(max);

			let start = maxGroupingValue;
			let level = 10;
			let l = 4;
			let a = 4;

			let i = 13;
			while (i > 0) {
				values.push(start * (a / l));

				if (a === 1) {
					start = maxGroupingValue / level;
					level *= 10;
					a = 4;
					values.push(start);
				}

				a = a - 1;
				i--;
			}
			return values;
		},
		[]
	);

	onMount(() =>
		aggregationValues$.subscribe((d) => {
			// console.log(d);
			if (d.length && $grouping$ === 0) {
				grouping$.set(d[0] / 100);
			}
		})
	);

	$: productIds = exchanges.map((d) => d.fullname);
	$: productScale = scaleBand()
		.domain(productIds)
		.range([0, clientWidth])
		.paddingInner(0.4)
		.paddingOuter(0.3);

	$: step = productScale.step();
	$: paddingOuter = step * productScale.paddingOuter();

	function onChangeProduct(id: string) {
		return async () => {
			from = id;

			for (let i = 0; i < exchanges.length; i++) {
				const exchange = exchanges[i];

				exchange.disconnect();
			}
			grouping$.set(0);

			for (let i = 0; i < exchanges.length; i++) {
				const exchange = exchanges[i];
				exchange.from(id).connect();
			}

			await tick();
			exchanges = exchanges;
		};
	}

	function onChangeStatusHandler(exchange: Exchange) {
		return (e: Event) => {
			const currentTarget = e.currentTarget as HTMLInputElement;
			if (currentTarget.checked) {
				// turn on
				exchange.connect();
			} else {
				// turn off
				exchange.status('off').disconnect();
			}
		};
	}
</script>

<div
	class="w-full h-full overflow-hidden flex flex-col relative"
	style="background-color: rgb(0 0 0)"
>
	<div
		class="settings-bar absolute top-0 left-0 z-10 w-full border-b border-white border-opacity-20"
		style="backdrop-filter: blur(6px);"
	>
		<div class="w-full p-4 box-border flex justify-between gap-2">
			<div class="flex gap-2">
				<div class="flex items-center gap-2">
					{#each currencies as currency}
						<button
							class="currency-switch"
							class:selected={from === currency}
							on:click={onChangeProduct(currency)}>{currency}</button
						>
					{/each}
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
					{#each $aggregationValues$ as val}
						<option value={val + ''}>{val}</option>
					{/each}
				</select>
			</div>

			<div class="flex items-center">
				<span class="text-4xl text-white font-black upp">Ask</span>
			</div>

			<div class="flex flex-col">
				<div class="text-white mb-2">Bin Colors</div>
				<div class="flex gap-2">
					<ColorPickr
						value={colord($theme$.askBin[0][0]).toHex()}
						on:change={(e) => ($theme$.askBin[0][0] = e.detail)}
					/>
					<ColorPickr
						value={colord($theme$.bidBin[1][0]).toHex()}
						on:change={(e) => ($theme$.bidBin[1][0] = e.detail)}
					/>
				</div>
			</div>

			<div class="flex flex-col">
				<div class="text-white mb-2">Area Colors</div>
				<div class="flex gap-2">
					<ColorPickr
						value={colord($theme$.askArea[0][0]).toHex()}
						on:change={(e) => ($theme$.askArea[0][0] = e.detail)}
					/>
					<ColorPickr
						value={colord($theme$.askArea[1][0]).toHex()}
						on:change={(e) => ($theme$.askArea[1][0] = e.detail)}
					/>
				</div>
			</div>

			<div class="flex items-center">
				<span class="text-4xl text-white font-black">Bid</span>
			</div>

			<div class="flex flex-col">
				<div class="text-white mb-2">Bin Colors</div>
				<div class="flex gap-2">
					<ColorPickr
						value={colord($theme$.bidBin[0][0]).toHex()}
						on:change={(e) => ($theme$.bidBin[0][0] = e.detail)}
					/>
					<ColorPickr
						value={colord($theme$.bidBin[1][0]).toHex()}
						on:change={(e) => ($theme$.bidBin[1][0] = e.detail)}
					/>
				</div>
			</div>

			<div class="flex flex-col">
				<div class="text-white mb-2">Area Colors</div>
				<div class="flex gap-2">
					<ColorPickr
						value={colord($theme$.bidArea[0][0]).toHex()}
						on:change={(e) => ($theme$.bidArea[0][0] = e.detail)}
					/>
					<ColorPickr
						value={colord($theme$.bidArea[1][0]).toHex()}
						on:change={(e) => ($theme$.bidArea[1][0] = e.detail)}
					/>
				</div>
			</div>

			<div class="flex items-center">
				<span class="text-4xl text-white font-black upp">Boundaries</span>
			</div>

			<div class="flex gap-2">
				<div class="flex flex-col">
					<div class="text-white mb-2">Text</div>
					<ColorPickr
						value={colord($theme$.boundaries.text).toHex()}
						on:change={(e) => ($theme$.boundaries.text = e.detail)}
					/>
				</div>
				<div class="flex flex-col">
					<div class="text-white mb-2">Line</div>
					<ColorPickr
						value={colord($theme$.boundaries.line).toHex()}
						on:change={(e) => ($theme$.boundaries.line = e.detail)}
					/>
				</div>
			</div>

			<div class="flex items-center">
				<span class="text-4xl text-white font-black upp">Market Price</span>
			</div>

			<div class="flex gap-2">
				<div class="flex flex-col">
					<div class="text-white mb-2">Text</div>
					<ColorPickr
						value={colord($theme$.marketPrice.text).toHex()}
						on:change={(e) => ($theme$.marketPrice.text = e.detail)}
					/>
				</div>
				<div class="flex flex-col">
					<div class="text-white mb-2">Line</div>
					<ColorPickr
						value={colord($theme$.marketPrice.line).toHex()}
						on:change={(e) => ($theme$.marketPrice.line = e.detail)}
					/>
				</div>
			</div>
		</div>
	</div>

	<div class="flex-1 overflow-hidden relative" bind:clientWidth>
		<div class="absolute inset-0 pointer-events-none z-10">
			<div
				class="orderbooks-names inner absolute w-full h-12 border-t border-white border-opacity-20"
				style="bottom:0px"
				style:padding="0 {paddingOuter}px"
			>
				<div class="w-full h-full relative">
					{#each exchanges as exchange, i}
						<div
							class="orderbook-name absolute flex justify-start items-center gap-2"
							style:left="0px"
							style:transform="translateX({step * i}px)"
							style:width="{step}px"
						>
							<input
								class="pointer-events-auto"
								type="checkbox"
								checked={exchange.status() === 'on'}
								on:change={onChangeStatusHandler(exchange)}
							/>
							<span>{exchange.fullname}</span>
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

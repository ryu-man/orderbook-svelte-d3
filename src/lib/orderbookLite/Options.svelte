<script lang="ts">
	export let grouping = 0;

	function increment() {
		grouping = nextGrouping(grouping);
	}
	function decrement() {
		grouping = previousGrouping(grouping);
	}

	function nextGrouping(x: number) {
		const k = +Number.isInteger(Math.log10(x || 1));

		return x * 2 + (x / 2) * k;
	}
	function previousGrouping(x: number) {
		const exponent = Math.floor(Math.log10(x || 1));
		const k = (Math.pow(10, exponent + 1) * 1) / 4 === x ? 1 : 0;

		return (x - ((x * 2) / 10) * k) / 2;
	}
</script>

<div class="orderbook-lite-options-bar">
	<div class="text-2xl">
		<span class="font-bold">Group:</span>
		<span>{grouping}</span>
	</div>

	<div class="flex gap-2">
		<button on:click={decrement}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"
				><path
					fill="currentColor"
					d="M3 10a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Z"
				/></svg
			>
		</button>
		<button on:click={increment}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"
				><path
					fill="currentColor"
					d="M10.5 2.75a.75.75 0 0 0-1.5 0V9H2.75a.75.75 0 0 0 0 1.5H9v6.25a.75.75 0 0 0 1.5 0V10.5h6.25a.75.75 0 0 0 0-1.5H10.5V2.75Z"
				/></svg
			>
		</button>
	</div>
</div>

<style lang="postcss">
	.orderbook-lite-options-bar {
		@apply flex justify-between items-center py-2 text-white;
	}

	button {
		@apply flex items-center justify-center w-6 h-6 bg-gray-800 rounded-sm;
		@apply hover:bg-opacity-80;
		@apply active:bg-opacity-60;
	}
</style>

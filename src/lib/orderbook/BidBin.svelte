<script lang="ts">
	import { Group, Bin as BinComponent, Text } from '$lib/canvas';

	export let x = 0;
	export let y = 0;
	export let sizeWidth = 0;
	export let totalWidth = 0;
	export let maxWidth = 0;
	export let height = 0;
	export let gradientWidth = 0;

	export let step = 0;
	export let size = 0;
	export let total = 0;

	let opacity = 0;

	function onPointerEnterHandler() {
		opacity = 1;
	}

	function onPointerLeaveHandler() {
		opacity = 0;
	}
</script>

<Group>
	<BinComponent
		{x}
		{y}
		{height}
		width={sizeWidth}
		{gradientWidth}
		fill={[
			['rgb(68 123 99 / .6)', 0],
			['rgb(30 62 174 / .6)', 1]
		]}
	/>

	<BinComponent
		{x}
		{y}
		{height}
		width={totalWidth}
		{gradientWidth}
		fill={[
			[`rgb(68 123 99 / ${opacity * 0.1})`, 0],
			[`rgb(30 62 174 / ${opacity * 0.1})`, 1]
		]}
	/>

	<!-- This Bin is for sake of pointer movement detection -->
	<BinComponent
		{x}
		{y}
		{height}
		width={maxWidth}
		fill="transparent"
		on:pointerenter={onPointerEnterHandler}
		on:pointerleave={onPointerLeaveHandler}
	/>
	<!--  -->

	<Text
		value={total.toFixed(1)}
		x={maxWidth}
		dx={-8}
		{y}
		dy={height / 2}
		baseline="middle"
		align="end"
		color="rgb(30 62 174 / {opacity})"
	/>

	{#if height > 10}
		<Text
			value={size.toFixed(1)}
			x={0}
			dx={8}
			{y}
			dy={height / 2}
			baseline="middle"
			fontSize={(9 * height) / step + 'pt'}
			fontWeight="600"
			color="rgb(68 123 99 / 1)"
		/>
	{/if}
</Group>

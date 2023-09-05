<script lang="ts">
	import { Group, Bin as BinComponent, Text } from '$lib/canvas';
	import { colord } from 'colord';
	import { format } from '$lib/utils';

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

	export let fill: [string, number][] = [
		['rgb(204 46 209 / .4)', 0],
		['rgb(195 159 66 / .4)', 1]
	];

	$: hoverFillValues = [colord(fill[0][0]).alpha(), colord(fill[0][0])];

	// const sizeWidth$ = tweened(sizeWidth, { duration: 1000, easing: cubicOut });
	// $: sizeWidth$.set(sizeWidth);

	let opacity = 0;

	function onPointerEnterHandler() {
		opacity = 1;
	}

	function onPointerLeaveHandler() {
		opacity = 0;
	}
</script>

<Group {y}>
	<BinComponent {x} y={0} {height} width={sizeWidth} {gradientWidth} {fill} />
	<BinComponent
		{x}
		y={0}
		{height}
		width={totalWidth}
		{gradientWidth}
		fill={[
			[
				colord(fill[0][0])
					.alpha(opacity * 0.1)
					.toRgbString(),
				0
			],
			[
				colord(fill[1][0])
					.alpha(opacity * 0.1)
					.toRgbString(),
				1
			]
		]}
	/>

	<!-- This Bin is for sake of pointer movement detection -->
	<BinComponent
		{x}
		y={0}
		{height}
		width={maxWidth}
		fill="transparent"
		on:pointerenter={onPointerEnterHandler}
		on:pointerleave={onPointerLeaveHandler}
	/>
	<!--  -->

	<Text
		value={format(total)}
		x={maxWidth}
		dx={-8}
		y={0}
		dy={height / 2}
		baseline="middle"
		align="end"
		color={`rgb(195 159 66 / ${opacity})`}
	/>

	{#if height > 10}
		<Text
			value={format(size)}
			x={0}
			dx={8}
			y={0}
			dy={height / 2}
			baseline="middle"
			fontSize={(9 * height) / step + 'pt'}
			fontWeight="600"
			color="rgb(204 46 209 / 1)"
		/>
	{/if}
</Group>

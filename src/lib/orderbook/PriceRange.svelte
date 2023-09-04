<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Text } from '$lib/canvas';

	export let range: number | string;
	export let y: number = 0;
	export let fontSize = '10pt';
	export let color = 'rgb( 255 255 255 / 1)';

	$: console.log(color);

	const y$ = tweened(y, { duration: 300, easing: cubicOut });
	$: y$.set(y);
</script>

<Text
	x={0}
	y={$y$}
	dx={-8}
	dy={0}
	value={range.toString()}
	{color}
	fill="rgb(255 255 255 / 0)"
	align="end"
	baseline="middle"
	fontWeight="normal"
	{fontSize}
/>

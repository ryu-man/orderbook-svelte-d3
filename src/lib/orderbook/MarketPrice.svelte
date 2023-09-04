<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Group, Path, Text } from '../canvas';

	export let x = 0;
	export let y = 0;
	export let width = 0;
	export let value = 0;

	export let stroke = 'black';
	export let fill = 'black';

	const x$ = tweened(x, { duration: 100, easing: cubicOut });
	$: x$.set(x);
</script>

<Group x={$x$} {y}>
	<Path d="M{0},{0} h{width}" {stroke} strokeWidth={0.5} />
	<Text
		{value}
		x={width}
		dx={8}
		baseline="middle"
		align="start"
		color={fill}
		fontSize="9pt"
		fontWeight="700"
	/>
</Group>

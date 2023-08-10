<script lang="ts">
	import { onMount } from 'svelte';
	import { Group, Text, Path } from '../canvas';

	export let tick: Date | string | number;

	export let x = 0;
	export let y = 0;
	export let dx = 0;
	export let dy = 0;

	export let height = 0;
	export let offset = 0;

	onMount(() => {
		return () => {};
	});

	const color = 'rgb(255 255 255 / .6)';
	const fill = 'rgb(0 0 0 / 0)';
</script>

<Group x={x + dx} y={y + dy}>
	<Text
		dy={-offset}
		value={tick.toString()}
		{color}
		{fill}
		align="center"
		baseline="ideographic"
		padding={2}
	/>
	<Path d={`M${0},${0} v${height}`} stroke={color} />
</Group>

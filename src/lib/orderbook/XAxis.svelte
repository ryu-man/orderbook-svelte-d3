<script lang="ts">
	import { onMount } from 'svelte';
	import type { ScaleLinear } from 'd3';
	import Tick from './Tick.svelte';
	import { Group, Text, Path } from '../canvas';

	export let scale: ScaleLinear<any, any>;
	export let values: any[] | undefined = undefined;
	export let height = 0;
	export let y = 0;

	$: [r0, r1] = scale.range();
	$: console.log(r0, r1);

	onMount(() => {
		return () => {};
	});

	$: ticks = values ?? scale?.ticks?.() ?? scale.domain();

	const color = 'rgb(255 255 255 / .6)';
</script>

<Group x={0} {y}>
	<!-- <Path d={`M${r0},0 h${r1}`} stroke={color} strokeWidth={1} /> -->

	{#each ticks as tick}
		<Tick {tick} x={scale(tick)} y={0} {height} offset={2} />
	{/each}
</Group>

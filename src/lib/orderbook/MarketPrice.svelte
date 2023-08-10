<script lang="ts">
	import { Group, Path } from '../canvas';

	export let x = 0;
	export let y = 0;
	export let width = 0;

	export let stroke = 'black';
</script>

<Group {x} {y}>
	<Path d="M{0},{0} h{width}" {stroke} strokeWidth={0.5} />
	<slot />
</Group>

<script lang="ts">
	import { Clip, getCanvasViewportContext } from '$lib/canvas';

	const { vh$, vw$, vx$, vy$ } = getCanvasViewportContext();
</script>

<Clip x={$vx$} y={$vy$} width={$vw$} height={$vh$}>
	<slot />
</Clip>

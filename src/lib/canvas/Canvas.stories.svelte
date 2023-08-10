<script lang="ts">
	import { Meta, Story } from '@storybook/addon-svelte-csf';
	import Canvas from './Canvas.svelte';
	import Text from './Text.svelte';

	let innerWidth = 0;
	let innerHeight = 0;

	function resizer(node: HTMLDivElement) {
		const observer = new ResizeObserver(() => {
			innerWidth = node.clientWidth;
			innerHeight = node.clientHeight;
		});
		observer.observe(node, { box: 'border-box' });

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<Meta title="Canvas" component={Canvas} />

<Story id="canvas" name="Canvas" let:args>
	<div style="width: 100%; height: 100%;" use:resizer>
		<Canvas height={innerHeight} width={innerWidth}>
			<Text
				value="Hello Svelte jj 4!"
				x={innerWidth / 2}
				y={innerHeight / 2}
				fontSize="48pt"
				align="center"
				baseline="ideographic"
				color="rgb(255 255 255 / 1)"
				padding={0}
				on:click={() => console.log('hello!')}
			/>
		</Canvas>
	</div>
</Story>

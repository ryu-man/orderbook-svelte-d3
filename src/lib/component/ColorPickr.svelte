<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type Pickr from '@simonwep/pickr';
	import '@simonwep/pickr/dist/themes/nano.min.css';

	const dispatch = createEventDispatcher();

	export let width = '24px';
	export let height = width;

	export let value = 'rgb(0 0 0)';

	let element: HTMLElement;
	let pickr: Pickr;

	onMount(() => {
		import('@simonwep/pickr').then((module) => {
			const Pickr = module.default;

			pickr = new Pickr({
				el: element,
				theme: 'nano',
				closeOnScroll: true,
				default: value,
				components: {
					// Main components
					preview: true,
					opacity: true,
					hue: true,

					// Input / output Options
					interaction: {
						hex: false,
						rgba: false,
						hsla: false,
						hsva: false,
						cmyk: false,
						input: true,
						clear: true,
						save: true
					}
				}
			});

			pickr.on('hide', onHideHandler);
			pickr.on('save', onSaveHandler);
		});

		return () => {
			if (!pickr) return;

			pickr.off('hide', onHideHandler);
			pickr.off('save', onSaveHandler);
			pickr.destroy();
		};

		function onSaveHandler(color: Pickr.HSVaColor) {
			pickr.hide();
		}

		function onHideHandler() {
			pickr.applyColor(true);
			value = pickr.getColor().toHEXA().toString();
			dispatch('change', value);
		}
	});

	$: if (pickr) {
		pickr.setColor(value, true);
	}

	function openPickrHandler() {
		if (!pickr) return;

		pickr.show();
	}
</script>

<button
	class="color-pickr"
	style:width
	style:height
	bind:this={element}
	on:click={openPickrHandler}
/>

# Orderbook - Svelte

App: [orderbook-svelte-d3.vercel.app](https://orderbook-svelte-d3.vercel.app/).

Storybook: [orderbook-svelte-d3-ltd2.vercel.app](https://orderbook-svelte-d3-ltd2.vercel.app/).

# Define Theme Pack

Theme configuration are stored in the `configuration` context (`./src/lib/configuration/context.ts`) under the `theme` object, first you have to define the context on a top level parent where it will be available for the whole app using the function called `setConfigurationContext`, the `OrderbookTheme` is defined like follows:

```
export type OffsetColor = [color: string, offset: number];
export type OrderbookTheme = {
	askBin: [OffsetColor, OffsetColor];
	askArea: [OffsetColor, OffsetColor];
	bidBin: [OffsetColor, OffsetColor];
	bidArea: [OffsetColor, OffsetColor];
	marketPrice: {
		line: string;
		text: string;
	};
	boundaries: {
		line: string;
		text: string;
	};
	priceTicks: {
		primary: string,
		secondary: string,
	
	}
};
```

The bin and area theming must be a gradient color, which necessitates the use of a start color and a stop color. We are using an array as a structure to hold such information, and each of the start and stop colors must be of the `OffsetColor` type, which is an array with the first element being a color string and the second being an offset number (between 0 and 1) used when creating the gradient color.

To change the theme you can follow these steps in the following piece of code:

```
// a top level +layout.svelte of a parent
<script>
	import { setConfigurationContext } from '$lib/configuration';
    // import a pre-defined theme
    import { customTheme } from '$lib/themes'

    // You can refactor the `setConfigurationContext` to accept a default theme object as an argument
    const { grouping$, theme$ } = setConfigurationContext();

    // overrides the default theme, the change will be real-time due the usabe of Svelte stores
    applyTheme(theme$, customTheme)

    // You can move this function under configuration context so it can reused across your app
    
    function applyTheme(theme$: Writable<OrderbookTheme>, customTheme: OrderbookTheme){
        theme$.set(structuredClone(customTheme))
    }
</script>
```

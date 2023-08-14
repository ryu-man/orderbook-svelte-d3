import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import type { Padding } from './types';

export const ORDERBOOK_CONTEXT_KEY = 'orderbook_context-key';

export type OrderbookContext = {
	padding$: Writable<Padding>;
};

export function getOrderbookContext(): OrderbookContext {
	return getContext(ORDERBOOK_CONTEXT_KEY);
}

export function setOrderbookContext(): OrderbookContext {
	return setContext(ORDERBOOK_CONTEXT_KEY, {
		padding$: writable({
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		})
	});
}

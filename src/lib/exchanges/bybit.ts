import type { Spread } from '../types';
import {
	domain,
	getDefaultGroupingValue,
	getMaxGroupingValue,
	marketPrice,
	syncAll,
	within
} from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';
import { ceil, floor } from '$lib/utils';

export type Snapshot = {
	asks: Spread[];
	bids: Spread[];
};
export type Update = {
	asks: Spread[];
	bids: Spread[];
};
export type DepthUpdate = {
	E: number;
	U: number;
	a: [number, number][];
	b: [number, number][];
	e: string;
	s: string;
	u: number;
};


export class BybitExchange extends Exchange<Snapshot, Update> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('bybit', 'wss://stream.bybit.com/v5/public/linear', product);
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BybitExchange): void {
		const raw = JSON.parse(e.data);

		if (raw.type === 'snapshot') {
			const parsed = parse(raw);
			const limitsDomain = exchange.stat.limits$.value || [30000, 0.00001];

			const asks = sort(
				parsed.asks.filter((d) => within(d[0], limitsDomain)),
				(a, b) => a[0] - b[0]
			);
			const bids = sort(
				parsed.bids.filter((d) => within(d[0], limitsDomain)),
				(a, b) => b[0] - a[0]
			);

			exchange.stat.asks0$.set(asks);
			exchange.stat.bids0$.set(bids);

			exchange.stat.ready$.set(true);

			return;
		}

		if (raw.type === 'delta') {
			const parsed = parse(raw);

			const ask = exchange.stat.asks0$.value[0];
			const bid = exchange.stat.bids0$.value[0];

			if (bid?.[0]) {
				exchange.stat.asks0$.set(parsed.asks.filter((d) => d[0] > bid[0]));
			} else {
				exchange.stat.asks0$.set(parsed.asks);
			}

			if (ask?.[0]) {
				exchange.stat.bids0$.set(parsed.bids.filter((d) => d[0] < ask[0]));
			} else {
				exchange.stat.bids0$.set(parsed.bids);
			}
		}
	}

	subscribe(): void {
		const param = `orderbook.500.${this.productID}`;

		this.#unsubscribe_props = {
			op: 'unsubscribe',
			args: [param],
			req_id: 'customised_id'
		};

		this.ws.send(
			JSON.stringify({
				req_id: 'test', // optional
				op: 'subscribe',
				args: [param]
			})
		);
	}

	unsubscribe(): void {
		this.ws.send(JSON.stringify(this.#unsubscribe_props));
		this.#unsubscribe_props = {};
	}
}

function parse(raw: Record<string, any>) {
	const asks: [number, number][] = [];
	for (const d of raw.data.a) {
		asks.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const bids: [number, number][] = [];
	for (const d of raw.data.b) {
		bids.push([parseFloat(d[0]), parseFloat(d[1])]);
	}
	return {
		asks,
		bids
	};
}

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

export type Snapshot = [number, Record<string, any>, string, string];

export type Update = [number, Record<string, any>, string, string];

function parseSnapshot(raw: [number, Record<string, any>, string, string]) {
	const asks: [number, number][] = [];
	for (const d of raw[1]?.as ?? []) {
		asks.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const bids: [number, number][] = [];
	for (const d of raw[1]?.bs ?? []) {
		bids.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks,
		bids
	};
}

function parseUpdate(raw: [number, Record<string, any>, string, string]) {
	const a: [number, number][] = [];
	for (const d of raw[1]?.a ?? []) {
		a.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const b: [number, number][] = [];
	for (const d of raw[1]?.b ?? []) {
		b.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks: a,
		bids: b
	};
}

export class KrakenExchange extends Exchange<Snapshot, Update> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('kraken', 'wss://ws.kraken.com', product);
	}

	get productID(): string {
		return `${this.from().toUpperCase()}/${this.to().toUpperCase()}`;
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: KrakenExchange): void {
		const raw = JSON.parse(e.data);

		if (raw.event === 'subscriptionStatus') {
			exchange.#unsubscribe_props.channelID = raw.channelID;
			exchange.#unsubscribe_props.pair = raw.pair;
		}

		if (raw[1]?.as && raw[1]?.bs) {
			const parsed = parseSnapshot(raw);
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

		if (raw[1]?.a || raw[1]?.b) {
			exchange.onUpdate(raw);
		}
	}

	onUpdate(data: Update): void {
		const parsed = parseUpdate(data);

		const ask = this.stat.asks0$.value[0];
		const bid = this.stat.bids0$.value[0];

		this.stat.asks0$.set(parsed.asks.filter((d) => d[0] > bid[0]));
		this.stat.bids0$.set(parsed.bids.filter((d) => d[0] < ask[0]));
	}

	subscribe(): void {
		this.#unsubscribe_props = {
			event: 'unsubscribe',
			pair: [this.productID],
			...this.#unsubscribe_props,
			subscription: {
				name: 'book'
			}
		};

		this.ws.send(
			JSON.stringify({
				event: 'subscribe',
				pair: [this.productID],
				subscription: {
					name: 'book',
					depth: 1000
				}
			})
		);
	}

	unsubscribe(): void {
		this.ws.send(JSON.stringify(this.#unsubscribe_props));
		this.#unsubscribe_props = {};
	}
}

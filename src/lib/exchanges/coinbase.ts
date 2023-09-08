import type { Snapshot, Spread, Update } from '../types';
import {
	domain,
	marketPrice,
	getMaxGroupingValue,
	syncAll,
	within,
	getDefaultGroupingValue,
	thresholds
} from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';
import { ceil, floor } from '$lib/utils';

export class CoinbaseExchange extends Exchange<Snapshot, Update> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('coinbase', 'wss://ws-feed.exchange.coinbase.com', product);
	}

	get productID(): string {
		return `${this.from().toUpperCase()}-${this.to().toUpperCase()}`;
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: CoinbaseExchange): void {
		const raw = JSON.parse(e.data);
		switch (raw.type) {
			case 'snapshot': {
				exchange.onSnapshot(raw);
				break;
			}

			case 'l2update': {
				exchange.onUpdate(raw);
				break;
			}
		}
	}

	onSnapshot(data: Snapshot): void {
		const parsed = parseSnapshot(data);
		const limitsDomain = this.stat.limits$.value || [30000, 0.00001];

		const asks = sort(
			parsed.asks.filter((d) => within(d[0], limitsDomain)),
			(a, b) => a[0] - b[0]
		);
		const bids = sort(
			parsed.bids.filter((d) => within(d[0], limitsDomain)),
			(a, b) => b[0] - a[0]
		);

		this.stat.asks0$.set(asks);
		this.stat.bids0$.set(bids);

		this.stat.ready$.set(true);
	}

	onUpdate(data: Update): void {
		const parsed = parseUpadate(data);

		const ask = this.stat.asks0$.value[0];
		const bid = this.stat.bids0$.value[0];

		if (bid?.[0]) {
			this.stat.asks0$.set(parsed.asks.filter((d) => d[0] > bid[0]));
		} else {
			this.stat.asks0$.set(parsed.asks);
		}

		if (ask?.[0]) {
			this.stat.bids0$.set(parsed.bids.filter((d) => d[0] < ask[0]));
		} else {
			this.stat.bids0$.set(parsed.bids);
		}
	}

	subscribe(): void {
		const productId = this.productID;

		this.#unsubscribe_props = {
			type: 'unsubscribe',
			product_ids: [productId],
			channel: ['level2_batch']
		};

		this.ws.send(
			JSON.stringify({
				type: 'subscribe',
				product_ids: [productId],
				channels: ['level2_batch']
			})
		);
	}

	unsubscribe(): void {
		this.ws.send(JSON.stringify(this.#unsubscribe_props));
	}
}

function parseSnapshot(raw: Record<string, any>): Snapshot {
	const asks: [number, number][] = [];
	for (const d of raw.asks) {
		asks.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const bids: [number, number][] = [];
	for (const d of raw.bids) {
		bids.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks,
		bids
	};
}

function parseUpadate(raw: Record<string, any>) {
	const asks: Spread[] = [];
	const bids: Spread[] = [];

	for (const change of raw.changes) {
		if (change[0] === 'sell') {
			asks.push([+change[1], +change[2]]);
		} else {
			bids.push([+change[1], +change[2]]);
		}
	}

	return {
		asks,
		bids
	};
}

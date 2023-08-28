import type { Spread } from '../types';
import { domain, getDefaultGroupingValue, marketPrice, syncAll, within } from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';
import { ceil, floor } from '$lib/utils';

export type Snapshot = {
	lastUpdateId: number;
	asks: [number, number][];
	bids: [number, number][];
};
export type DepthUpdateRaw = {
	E: number;
	U: number;
	a: [string, string][];
	b: [string, string][];
	e: string;
	s: string;
	u: number;
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

function parse(raw: Record<string, any>) {
	const asks: [number, number][] = [];
	for (const d of raw?.asks ?? raw?.a ?? []) {
		asks.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const bids: [number, number][] = [];
	for (const d of raw?.bids ?? raw?.b ?? []) {
		bids.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks,
		bids
	};
}

export class BinanceExchange extends Exchange<Snapshot, DepthUpdateRaw> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('binance', 'wss://stream.binance.com:443/ws', product);
	}

	get productID(): string {
		return `${this.from().toLowerCase()}${this.to().toLowerCase()}`;
	}

	getSnapshot(): Promise<{ asks: Spread[]; bids: Spread[] }> {
		const snapshotURL = new URL('https://api.binance.com/api/v3/depth');
		snapshotURL.searchParams.set('limit', '10000');
		snapshotURL.searchParams.set('symbol', this.productID.toUpperCase());

		return fetch(snapshotURL)
			.then((res) => res.json())
			.then(parse)
			.then((snapshot) => {
				const limitsDomain = this.stat.limits$.value || [30000, 0.00001];

				const asks = sort(
					snapshot.asks.filter((d) => within(d[0], limitsDomain)),
					(a, b) => a[0] - b[0]
				);
				const bids = sort(
					snapshot.bids.filter((d) => within(d[0], limitsDomain)),
					(a, b) => b[0] - a[0]
				);

				this.stat.asks0$.set(asks);
				this.stat.bids0$.set(bids);

				this.stat.ready$.set(true);

				return {
					asks,
					bids
				};
			});
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BinanceExchange): void {
		const raw = JSON.parse(e.data) as DepthUpdateRaw;
		if (raw.id) {
			exchange.#unsubscribe_props.id = raw.id;
		}
		if (raw.e === 'depthUpdate') {
			const parsed = parse(raw);

			const ask = exchange.stat.asks0$.value[0];
			const bid = exchange.stat.bids0$.value[0];

			exchange.stat.asks0$.set(parsed.asks.filter((d) => d[0] > bid[0]));
			exchange.stat.bids0$.set(parsed.bids.filter((d) => d[0] < ask[0]));
		}
	}

	subscribe(): void {
		const param = this.productID + '@depth@100ms';
		const id = +new Date();

		this.#unsubscribe_props = {
			method: 'UNSUBSCRIBE',
			id,
			params: [param]
		};
		this.ws.send(
			JSON.stringify({
				method: 'SUBSCRIBE',
				id: id,
				params: [param]
			})
			// 'btcusdt@trade',
		);
	}

	unsubscribe(): void {
		this.ws.send(JSON.stringify(this.#unsubscribe_props));
		this.#unsubscribe_props = {};
	}
}

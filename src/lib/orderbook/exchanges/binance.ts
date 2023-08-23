import type { Spread } from '../types';
import { domain, marketPrice, syncAll, within } from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';

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
		lastUpdateId: raw.lastUpdateId,
		asks,
		bids
	};
}

function parseUpdate(raw: DepthUpdateRaw): DepthUpdate {
	const a: [number, number][] = [];
	for (const d of raw.a) {
		a.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const b: [number, number][] = [];
	for (const d of raw.b) {
		b.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		E: raw.E,
		U: raw.U,
		e: raw.e,
		s: raw.s,
		u: raw.u,
		a,
		b
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
			.then(parseSnapshot)
			.then((snapshot) => {
				const asks = sort(snapshot.asks, (a, b) => a[0] - b[0]);
				const bids = sort(snapshot.bids, (a, b) => b[0] - a[0]);

				const mn = Math.ceil(asks[0][0]);
				const mx = Math.ceil(bids[0][0]);

				const mp = marketPrice(mn, mx);
				const dm = domain(mp, 10, 200);

				return {
					asks: asks.filter((d) => within(d[0], dm)),
					bids: bids.filter((d) => within(d[0], dm))
				};
			});
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BinanceExchange): void {
		const raw = JSON.parse(e.data) as DepthUpdateRaw;
		if (raw.id) {
			exchange.#unsubscribe_props.id = raw.id;
		}
		if (raw.e === 'depthUpdate') {
			exchange.onUpdate(raw);
		}
	}

	onUpdate(data: DepthUpdateRaw): void {
		const parsed = parseUpdate(data);

		const asks = parsed.a.filter((d) => within(d[0], this.stat.domain$.value || [0, 0]));
		const bids = parsed.b.filter((d) => within(d[0], this.stat.domain$.value || [0, 0]));

		this.stat.asks$.update((val) => sort(syncAll(val, asks), (a, b) => a[0] - b[0]));
		this.stat.bids$.update((val) => sort(syncAll(val, bids), (a, b) => b[0] - a[0]));
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

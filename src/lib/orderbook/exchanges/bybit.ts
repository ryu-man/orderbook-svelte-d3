import type { Spread } from '../types';
import { domain, marketPrice, syncAll, within } from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';

export type Snapshot = {
	topic: string;
	ts: number;
	type: 'snapshot';
	data: {
		s: string;
		b: Spread[];
		a: Spread[];
		u: number;
		seq: number;
	};
};
export type Update = {
	topic: string;
	ts: number;
	type: 'delta';
	data: {
		s: string;
		b: Spread[];
		a: Spread[];
		u: number;
		seq: number;
	};
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
	for (const d of raw.data.a) {
		asks.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const bids: [number, number][] = [];
	for (const d of raw.data.b) {
		bids.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		topic: raw.topic,
		ts: raw.ts,
		type: raw.type,
		data: {
			s: raw.data.s,
			b: bids,
			a: asks,
			u: raw.data.u,
			seq: raw.data.seq
		}
	};
}

function parseUpdate(raw: Record<string, any>): Update {
	const a: [number, number][] = [];
	for (const d of raw.data.a) {
		a.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const b: [number, number][] = [];
	for (const d of raw.data.b) {
		b.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		topic: raw.topic,
		ts: raw.ts,
		type: raw.type,
		data: {
			s: raw.data.s,
			b: b,
			a: a,
			u: raw.data.u,
			seq: raw.data.seq
		}
	};
}

export class BybitExchange extends Exchange<Snapshot, Update> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('bybit', 'wss://stream.bybit.com/v5/public/linear', product);
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BybitExchange): void {
		const raw = JSON.parse(e.data);

		if (raw.type === 'snapshot') {
			const parsed = parseSnapshot(raw);
			const asks = sort(parsed.data.a, (a, b) => a[0] - b[0]);
			const bids = sort(parsed.data.b, (a, b) => b[0] - a[0]);

			const mn = Math.ceil(asks[0][0]);
			const mx = Math.ceil(bids[0][0]);

			const mp = marketPrice(mn, mx);
			const dm = domain(mp, 10, 200);

			exchange.stat.asks$.set(asks.filter((d) => within(d[0], dm)));
			exchange.stat.bids$.set(bids.filter((d) => within(d[0], dm)));

			return;
		}

		if (raw.type === 'delta') {
			exchange.onUpdate(raw);
		}
	}

	onUpdate(data: Update): void {
		const parsed = parseUpdate(data);

		const domain = this.stat.domain$.value || [0, 0];

		const asks = parsed.data.a.filter((d) => within(d[0], domain));
		const bids = parsed.data.b.filter((d) => within(d[0], domain));

		this.stat.asks$.update((val) => sort(syncAll(val, asks), (a, b) => a[0] - b[0]));
		this.stat.bids$.update((val) => sort(syncAll(val, bids), (a, b) => b[0] - a[0]));
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

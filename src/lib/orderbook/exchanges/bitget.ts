import { domain, marketPrice, syncAll, within } from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';

export type Snapshot = {
	action: 'snapshot';
	arg: {
		instType: string;
		channel: string;
		instId: string;
	};
	data: [
		{
			asks: [];
			bids: [];
			checksum: number;
			ts: string;
		}
	];
	ts: number;
};

export type Update = {
	action: 'update';
	arg: {
		instType: string;
		channel: string;
		instId: string;
	};
	data: [
		{
			asks: [];
			bids: [];
			checksum: number;
			ts: string;
		}
	];
	ts: 1692797241430;
};

function parseSnapshot(raw: Record<string, any>) {
	const asks: [number, number][] = [];
	for (const d of raw.data?.[0]?.asks ?? []) {
		asks.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const bids: [number, number][] = [];
	for (const d of raw.data?.[0]?.bids ?? []) {
		bids.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks,
		bids
	};
}

function parseUpdate(raw: Record<string, any>) {
	const a: [number, number][] = [];
	for (const d of raw.data?.[0]?.asks ?? []) {
		a.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const b: [number, number][] = [];
	for (const d of raw.data?.[0]?.bids ?? []) {
		b.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks: a,
		bids: b
	};
}

export class BitgetExchange extends Exchange<Snapshot, Update> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('bitget', 'wss://ws.bitget.com/mix/v1/stream', product);
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BitgetExchange): void {
		const raw = JSON.parse(e.data);

		// console.log(raw);

		// return;

		if (raw.action === 'snapshot') {
			const parsed = parseSnapshot(raw);
			const asks = sort(parsed.asks, (a, b) => a[0] - b[0]);
			const bids = sort(parsed.bids, (a, b) => b[0] - a[0]);

			const mn = Math.ceil(asks[0][0]);
			const mx = Math.ceil(bids[0][0]);

			const mp = marketPrice(mn, mx);
			const dm = domain(mp, 10, 200);

			exchange.stat.asks$.set(asks.filter((d) => within(d[0], dm)));
			exchange.stat.bids$.set(bids.filter((d) => within(d[0], dm)));

			return;
		}

		if (raw.action === 'update') {
			exchange.onUpdate(raw);
		}
	}

	onUpdate(data: Update): void {
		const parsed = parseUpdate(data);

		const domain = this.stat.domain$.value || [0, 0];

		const asks = parsed.asks.filter((d) => within(d[0], domain));
		const bids = parsed.bids.filter((d) => within(d[0], domain));

		this.stat.asks$.update((val) => sort(syncAll(val, asks), (a, b) => a[0] - b[0]));
		this.stat.bids$.update((val) => sort(syncAll(val, bids), (a, b) => b[0] - a[0]));
	}

	subscribe(): void {
		// const param = `orderbook.500.${this.productID}`;

		this.#unsubscribe_props = {
			op: 'unsubscribe',
			args: [
				{
					instType: 'mc',
					channel: 'books',
					instId: this.productID
				}
			]
		};

		this.ws.send(
			JSON.stringify({
				op: 'subscribe',
				args: [
					{
						instType: 'mc',
						channel: 'books',
						instId: this.productID
					}
				]
			})
		);
	}

	unsubscribe(): void {
		this.ws.send(JSON.stringify(this.#unsubscribe_props));
		this.#unsubscribe_props = {};
	}
}

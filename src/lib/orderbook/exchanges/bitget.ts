import { domain, getDefaultGroupingValue, marketPrice, syncAll, within } from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';
import { ceil, floor } from '$lib/utils';

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

function parse(raw: Record<string, any>) {
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

export class BitgetExchange extends Exchange<Snapshot, Update> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('bitget', 'wss://ws.bitget.com/mix/v1/stream', product);
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BitgetExchange): void {
		const raw = JSON.parse(e.data);

		if (raw.action === 'snapshot') {
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

		if (raw.action === 'update') {
			const parsed = parse(raw);

			const ask = exchange.stat.asks0$.value[0];
			const bid = exchange.stat.bids0$.value[0];

			exchange.stat.asks0$.set(parsed.asks.filter((d) => d[0] > bid[0]));
			exchange.stat.bids0$.set(parsed.bids.filter((d) => d[0] < ask[0]));
		}
	}

	subscribe(): void {
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

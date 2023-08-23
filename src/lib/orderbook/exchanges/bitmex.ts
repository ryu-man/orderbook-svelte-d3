import { sort } from 'd3';
import { Exchange } from './exchange';
import { syncAll } from './utils';

export type Snapshot = [
	channelId: number,
	snapshot: [price: number, count: number, amount: number][]
];

export type Operation = Insert | Update | Delete | Partial;

export type Update = {
	table: 'orderBookL2';
	action: 'update';
	data: [
		{
			symbol: string;
			id: number;
			side: 'Buy' | 'Sell';
			size: number;
			price: number;
			timestamp: string;
		}
	];
};

export type Delete = {
	table: 'orderBookL2';
	action: 'delete';
	data: {
		symbol: string;
		id: number;
		side: 'Buy' | 'Sell';
		price: number;
		timestamp: string;
	}[];
};

export type Insert = {
	table: 'orderBookL2';
	action: 'insert';
	data: {
		symbol: string;
		id: number;
		side: 'Buy' | 'Sell';
		size: number;
		price: number;
		timestamp: string;
	}[];
};
export type Partial = {
	table: 'orderBookL2';
	action: 'partial';
	data: {
		symbol: string;
		id: number;
		side: 'Buy' | 'Sell';
		size: number;
		price: number;
		timestamp: string;
	}[];
};

export class BitmexExchange extends Exchange<Snapshot, Operation> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('bitmex', 'wss://ws.bitmex.com/realtime', product);
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BitmexExchange): void {
		const raw = JSON.parse(e.data) as Operation;

		switch (raw.action) {
			case 'partial': {
				const asks: [number, number][] = sort(
					raw.data.filter((d) => d.side === 'Sell').map((d) => [d.price, d.size || 0]),
					(a, b) => a[0] - b[0]
				);
				const bids: [number, number][] = sort(
					raw.data.filter((d) => d.side === 'Buy').map((d) => [d.price, d.size || 0]),
					(a, b) => b[0] - a[0]
				);

				exchange.stat.asks$.set(asks);
				exchange.stat.bids$.set(bids);
				break;
			}
			case 'delete': {
				exchange.stat.asks$.update((val) =>
					syncAll(
						val,
						raw.data.filter((d) => d.side === 'Sell').map((d) => [d.price, 0])
					)
				);
				exchange.stat.bids$.update((val) =>
					syncAll(
						val,
						raw.data.filter((d) => d.side === 'Buy').map((d) => [d.price, 0])
					)
				);
				break;
			}
			case 'insert':
			case 'update': {
				exchange.stat.asks$.update((val) =>
					syncAll(
						val,
						raw.data.filter((d) => d.side === 'Sell').map((d) => [d.price, d.size])
					)
				);
				exchange.stat.bids$.update((val) =>
					syncAll(
						val,
						raw.data.filter((d) => d.side === 'Buy').map((d) => [d.price, d.size])
					)
				);
			}
		}
	}

	subscribe(): void {
		this.#unsubscribe_props = {
			op: 'unsubscribe',
			args: [`orderBookL2:${this.productID}`]
		};
		this.ws.send(JSON.stringify({ op: 'subscribe', args: [`orderBookL2:${this.productID}`] }));
	}

	unsubscribe(): void {
		this.ws.send(JSON.stringify(this.#unsubscribe_props));
		this.#unsubscribe_props = {};
	}
}

function parseSnapshot(raw: Record<string, any>) {
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

function parseUpdate(raw: Record<string, any>) {
	const a: [number, number][] = [];
	for (const d of raw.a) {
		a.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const b: [number, number][] = [];
	for (const d of raw.b) {
		b.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks: a,
		bids: b
	};
}

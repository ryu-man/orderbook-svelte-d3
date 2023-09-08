import { sort } from 'd3';
import { Exchange } from './exchange';
import { within } from './utils';

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
		super('bitmex', 'wss://ws.bitmex.com/realtime', {
			from: product.from === 'BTC' ? 'XBT' : product.from,
			to: product.to
		});
	}

	from(): string;
	from(val: string): this;
	from(...args: string[]): string | this {
		if (args.length) {
			return super.from(args[0] === 'BTC' ? 'XBT' : args[0]);
		}

		return super.from();
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BitmexExchange): void {
		const raw = JSON.parse(e.data) as Operation;
		const parsed = parse(raw);

		switch (raw.action) {
			case 'partial': {
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

				break;
			}
			case 'delete':
			case 'insert':
			case 'update': {
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

function parse(raw: Record<string, any>) {
	switch (raw.action) {
		case 'delete': {
			return {
				asks: raw.data.filter((d) => d.side === 'Sell').map((d) => [+d.price, 0]) as [
					number,
					number
				][],
				bids: raw.data.filter((d) => d.side === 'Buy').map((d) => [+d.price, 0]) as [
					number,
					number
				][]
			};
		}
		case 'partial':
		case 'insert':
		case 'update': {
			return {
				asks: raw.data.filter((d) => d.side === 'Sell').map((d) => [+d.price, +d.size]) as [
					number,
					number
				][],
				bids: raw.data.filter((d) => d.side === 'Buy').map((d) => [+d.price, +d.size]) as [
					number,
					number
				][]
			};
		}
		default: {
			return {
				asks: [],
				bids: []
			};
		}
	}
}

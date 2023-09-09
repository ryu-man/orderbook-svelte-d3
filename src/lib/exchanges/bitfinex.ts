import { sort } from 'd3';
import { Exchange } from './exchange';
import { domain, getDefaultGroupingValue, marketPrice, syncAll, within } from './utils';
import { ceil, floor } from '$lib/utils';

export type Snapshot = [
	channelId: number,
	snapshot: [price: number, count: number, amount: number][]
];

export type Update = [channelId: number, update: [price: number, count: number, amount: number]];

export class BitfinexExchange extends Exchange<Snapshot, Update> {
	#index = 1;
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('bitfinex', 'wss://api-pub.bitfinex.com/ws/2', product);
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: BitfinexExchange): void {
		const raw = JSON.parse(e.data);

		if (raw.event === 'subscribed') {
			exchange.#unsubscribe_props.chanId = raw.chanId;
			return;
		}
		if (Array.isArray(raw)) {
			const parsed = parse(raw);

			if (exchange.#index) {
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
				exchange.#index = 0;

				return;
			}

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
		this.#unsubscribe_props = {
			event: 'unsubscribe'
		};
		this.ws.send(JSON.stringify({ event: 'conf', flags: 536870912 }));
		this.ws.send(
			JSON.stringify({
				event: 'subscribe',
				channel: 'book',
				symbol: this.productID,
				len: '250'
			})
		);
	}

	unsubscribe(): void {
		this.ws.send(JSON.stringify(this.#unsubscribe_props));
		this.#unsubscribe_props = {};
		this.#index = 1;
	}
}

function parse(raw: Record<string, any>) {
	const asks: [number, number][] = [];
	const bids: [number, number][] = [];

	const array = raw[1] as [price: number, count: number, amount: number][];

	for (let i = 0; i < array.length; i++) {
		const item = array[i];
		const [price, count, amount] = item;

		if (count > 0) {
			if (amount > 0) {
				bids.push([price, amount] as [number, number]);
			} else {
				asks.push([price, Math.abs(amount)] as [number, number]);
			}
		} else if (count === 0) {
			if (amount === 1) {
				bids.push([price, 0] as [number, number]);
			} else if (amount === -1) {
				asks.push([price, 0] as [number, number]);
			}
		}
	}

	return {
		asks,
		bids
	};
}

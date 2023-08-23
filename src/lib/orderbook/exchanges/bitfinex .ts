import { sort } from 'd3';
import { Exchange } from './exchange';
import { domain, marketPrice, syncAll, within } from './utils';

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
				const asks = sort(parsed.asks, (a, b) => a[0] - b[0]);

				const bids = sort(parsed.bids, (a, b) => b[0] - a[0]);

				const mn = Math.ceil(asks[0][0]);
				const mx = Math.ceil(bids[0][0]);

				const mp = marketPrice(mn, mx);
				const dm = domain(mp, 10, 200);

				exchange.stat.asks$.set(asks.filter((d) => within(d[0], dm)));
				exchange.stat.bids$.set(bids.filter((d) => within(d[0], dm)));
				exchange.#index = 0;

				return;
			}

			const dm = exchange.stat.domain$.value || [0, 0];

			const asks = parsed.asks.filter((d) => within(d[0], dm));
			const bids = parsed.bids.filter((d) => within(d[0], dm));

			exchange.stat.asks$.update((val) => sort(syncAll(val, asks), (a, b) => a[0] - b[0]));
			exchange.stat.bids$.update((val) => sort(syncAll(val, bids), (a, b) => b[0] - a[0]));
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

import type { Snapshot, Spread, Update } from '../types';
import { domain, marketPrice, syncAll, within } from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';

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

		const asks = sort(parsed.asks, (a, b) => a[0] - b[0]);
		const bids = sort(parsed.bids, (a, b) => b[0] - a[0]);

		const mn = Math.ceil(asks[0][0]);
		const mx = Math.ceil(bids[0][0]);

		const mp = marketPrice(mn, mx);
		const dm = domain(mp, 10, 200);

		const filtereAsks = asks.filter((d) => d[0] < dm[0] && d[0] > dm[1]);
		this.stat.asks$.set(filtereAsks);

		const filteredBids = bids.filter((d) => d[0] < dm[0] && d[0] > dm[1]);
		this.stat.bids$.set(filteredBids);
	}

	onUpdate(data: Update): void {
		const update = parseUpadate(data);
		const domain = this.stat.domain$.value ?? [0, 0];

		const asksChanges: [number, number][] = update.asks.filter((d) => within(d[1], domain));
		this.stat.asks$.update((val) => sort(syncAll(val, asksChanges), (a, b) => a[0] - b[0]));

		const bidsChanges: [number, number][] = update.bids.filter((d) => within(d[1], domain));
		this.stat.bids$.update((val) => sort(syncAll(val, bidsChanges), (a, b) => b[0] - a[0]));
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

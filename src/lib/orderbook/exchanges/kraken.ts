import { domain, marketPrice, syncAll, within } from './utils';
import { Exchange } from './exchange';
import { sort } from 'd3';

export type Snapshot = [number, Record<string, any>, string, string];

export type Update = [number, Record<string, any>, string, string];

function parseSnapshot(raw: [number, Record<string, any>, string, string]) {
	const asks: [number, number][] = [];
	for (const d of raw[1]?.as ?? []) {
		asks.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const bids: [number, number][] = [];
	for (const d of raw[1]?.bs ?? []) {
		bids.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks,
		bids
	};
}

function parseUpdate(raw: [number, Record<string, any>, string, string]) {
	const a: [number, number][] = [];
	for (const d of raw[1]?.a ?? []) {
		a.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	const b: [number, number][] = [];
	for (const d of raw[1]?.b ?? []) {
		b.push([parseFloat(d[0]), parseFloat(d[1])]);
	}

	return {
		asks: a,
		bids: b
	};
}

export class KrakenExchange extends Exchange<Snapshot, Update> {
	#unsubscribe_props: Record<string, any> = {};

	constructor(product: { from: string; to: string } = { from: '', to: '' }) {
		super('kraken', 'wss://ws.kraken.com', product);
	}

	get productID(): string {
		return `${this.from().toUpperCase()}/${this.to().toUpperCase()}`;
	}

	onMessage(this: WebSocket, e: MessageEvent<any>, exchange: KrakenExchange): void {
		const raw = JSON.parse(e.data);

		if (raw.event === 'subscriptionStatus') {
			exchange.#unsubscribe_props.channelID = raw.channelID;
			exchange.#unsubscribe_props.pair = raw.pair;
		}

		if (raw[1]?.as && raw[1]?.bs) {
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

		if (raw[1]?.a || raw[1]?.b) {
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
		this.#unsubscribe_props = {
			event: 'unsubscribe',
			pair: [this.productID],
			...this.#unsubscribe_props,
			subscription: {
				name: 'book'
			}
		};

		this.ws.send(
			JSON.stringify({
				event: 'subscribe',
				pair: [this.productID],
				subscription: {
					name: 'book',
					depth: 1000
				}
			})
		);
	}

	unsubscribe(): void {
		this.ws.send(JSON.stringify(this.#unsubscribe_props));
		this.#unsubscribe_props = {};
	}
}

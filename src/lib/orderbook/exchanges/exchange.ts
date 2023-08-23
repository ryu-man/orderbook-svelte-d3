import { writable, readonly } from 'svelte/store';
import type { Spread } from '../types';
import { marketPrice } from './utils';
import { derived } from './store';

export abstract class Exchange<S = any, U = any> {
	protected ws: WebSocket;
	protected stat = queu();

	#name: string;
	#from: string;
	#to: string;
	#url: string;

	public asks$ = readonly(this.stat.asks$);
	public bids$ = readonly(this.stat.bids$);

	public marketPrice$ = this.stat.marketPrice$;
	public thresholds$ = this.stat.thresholds$;
	public length$ = this.stat.length$;
	public grouping$ = this.stat.grouping$;

	removeEventListeners: (() => void)[] = [];

	constructor(name: string, url: string, product: { from: string; to: string }) {
		this.#name = name;
		this.#from = product.from || '';
		this.#to = product.to || '';
		this.#url = url;
	}

	connect() {
		this.ws = new WebSocket(this.#url);
		this.ws.addEventListener('message', (e) => this.onMessage(e, this));

		// Load market snapshot
		this.getSnapshot().then((snapshot) => {
			this.stat.asks$.set(snapshot.asks);
			this.stat.bids$.set(snapshot.bids);
		});

		const handler = (e) => {
			this.subscribe();
		};
		const removeEventListener = () => this.ws.removeEventListener('open', handler);
		this.removeEventListeners.push(removeEventListener);

		this.ws.addEventListener('open', handler);
	}

	reconnect() {
		this.disconnect();
		this.connect();
	}

	disconnect() {
		this.removeEventListeners.forEach((cb) => cb());
		this.unsubscribe();
		this.ws.close();
		this.stat.asks$.set([]);
		this.stat.bids$.set([]);
	}

	isClosed() {
		return this.ws.readyState === this.ws.CLOSED;
	}

	from(): string;
	from(val: string): this;
	from(...args: string[]) {
		if (args.length) {
			this.#from = args[0];
			return this;
		}

		return this.#from;
	}

	to(): string;
	to(val: string): this;
	to(...args: string[]) {
		if (args.length) {
			this.#to = args[0];
			return this;
		}

		return this.#to;
	}

	get productID() {
		return `${this.#from.toUpperCase()}${this.#to.toUpperCase()}`;
	}

	get fullname() {
		return `${this.#name}@${this.productID}`;
	}

	get name() {
		return this.#name;
	}

	getSnapshot(): Promise<{ asks: Spread[]; bids: Spread[] }> {
		return Promise.resolve({
			asks: [],
			bids: []
		});
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onSnapshot(data: S) {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onUpdate(data: U) {}

	abstract onMessage(this: WebSocket, e: MessageEvent, exchange: Exchange<S, U>): void;
	abstract subscribe(): void;
	abstract unsubscribe(): void;
}

export function queu() {
	const asks$ = writable<Spread[]>([]);
	const bids$ = writable<Spread[]>([]);

	const grouping$ = writable<number>(10);

	const length$ = writable<number>(200);

	const marketPrice$ = derived([asks$, bids$], ([asks, bids]) =>
		marketPrice(asks[0]?.[0] ?? 0, bids[0]?.[0] ?? 0)
	);

	const domain$ = derived([asks$, bids$, grouping$, length$], ([asks, bids, grouping, length]) => {
		const ask = Math.ceil((asks[0]?.[0] ?? 0) / 10) * 10;
		const bid = Math.floor((bids[0]?.[0] ?? 0) / 10) * 10;

		if (ask === 0 && bid === 0) {
			return [0, 0] as [number, number];
		}
		return [ask + grouping * length, bid - grouping * length] as [number, number];
	});

	const thresholds$ = derived([domain$, grouping$], ([domain, grouping]) => {
		const res: number[] = [];

		const end = Math.ceil(Math.max(...domain) / grouping) * grouping;
		let start = Math.floor(Math.min(...domain) / grouping) * grouping;

		if (start === 0 && end === 0) {
			return res;
		}

		while (start < end) {
			res.push(start);
			start += grouping;
		}

		return res;
	});

	return {
		asks$,
		bids$,
		grouping$,
		length$,
		marketPrice$,
		domain$,
		thresholds$
	};
}

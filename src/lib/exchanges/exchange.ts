import { readonly } from 'svelte/store';
import type { Spread } from '../types';
import { marketPrice, syncAll, within } from './utils';
import { derived, writable } from './store';
import { sort } from 'd3';

export abstract class Exchange<S = any, U = any> {
	protected ws: WebSocket;
	protected stat = lab();

	#name: string;
	#from: string;
	#to: string;
	#url: string;

	#focus = false;
	#status: 'on' | 'off' = 'on';

	public asks$ = readonly(this.stat.asks$);
	public bids$ = readonly(this.stat.bids$);
	public domain$ = readonly(this.stat.domain$);

	public marketPrice$ = this.stat.marketPrice$;
	// public thresholds$ = this.stat.thresholds$;
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
			this.stat.asks0$.set(snapshot.asks);
			this.stat.bids0$.set(snapshot.bids);
		});

		const handler = (e) => {
			this.#status = 'on';
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
		this?.removeEventListeners.forEach((cb) => cb());
		if (!this.isClosed()) {
			try {
				this?.unsubscribe();
				this.ws?.close();
			} catch (error) {
				//
			}
		}
		this.stat.asks0$.clear();
		this.stat.bids0$.clear();
	}

	isClosed() {
		return this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING;
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

	focus(): boolean;
	focus(value: boolean): this;
	focus(...args: boolean[]) {
		if (args.length) {
			this.#focus = args[0];
			return this;
		}

		return this.#focus;
	}

	status(): 'on' | 'off';
	status(value: 'on' | 'off'): this;
	status(...args: ('on' | 'off')[]) {
		if (args.length) {
			this.#status = args[0];
			return this;
		}

		return this.#status;
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

	abstract onMessage(this: WebSocket, e: MessageEvent, exchange: Exchange<S, U>): void;
	abstract subscribe(): void;
	abstract unsubscribe(): void;
}

export function lab() {
	const asks0$ = ask_spreads();
	const bids0$ = bid_spreads();

	const limits$ = writable<[number, number]>([30000, 0.00001]);
	const length$ = writable<number>(200);
	const grouping$ = writable(0);

	const ask0$ = derived(asks0$, (asks) => asks[0] || [0, 0]);
	const bid0$ = derived(bids0$, (bids) => bids[0] || [0, 0]);

	const ask0Price$ = derived(ask0$, (ask) => ask[0] ?? 0, 0);
	const bid0Price$ = derived(bid0$, (bid) => bid[0] ?? 0, 0);

	const marketPrice$ = derived([ask0Price$, bid0Price$], ([ask, bid]) => marketPrice(ask, bid), 0);

	const domain$ = derived(
		[ask0Price$, bid0Price$, grouping$, length$],
		([ask, bid, grouping, length]) => {
			if (ask === 0 || bid === 0) {
				return [0, 0];
			}

			const by = length * grouping;
			return [Math.min(30000, boundary(ask, by)), Math.max(0.00001, boundary(bid, -by))];
		},
		[0, 0] as [number, number]
	);

	const asks$ = derived([asks0$, domain$], ([asks, domain]) => {
		return asks.filter((d) => d[0] < domain[0]);
	});
	const bids$ = derived([bids0$, domain$], ([bids, domain]) => {
		return bids.filter((d) => d[0] > domain[1]);
	});

	const ready$ = writable(false);

	return {
		asks0$,
		bids0$,
		asks$: asks$,
		bids$: bids$,
		marketPrice$,
		domain$,
		limits$,
		length$,
		grouping$,
		ready$
	};
}

function ask_spreads() {
	const initial$ = writable<Spread[]>([]);

	return {
		subscribe: initial$.subscribe,
		set: (value: Spread[]) => {
			initial$.update((val) => {
				let v: typeof val;

				if (val.length === 0) {
					v = sort(
						value.filter((d) => within(d[0], [30000, 0.00001])),
						(a, b) => a[0] - b[0]
					);
				} else {
					const updates = value.filter((d) => within(d[0], [30000, 0.00001]));
					v = sort(syncAll(val, updates), (a, b) => a[0] - b[0]);
				}

				return v;
			});
		},
		clear() {
			initial$.set([]);
		},
		get value() {
			return initial$.value;
		}
	};
}

function bid_spreads() {
	const initial$ = writable<Spread[]>([]);

	return {
		subscribe: initial$.subscribe,
		set: (value: Spread[]) => {
			initial$.update((val) => {
				let v: typeof val;
				if (val.length === 0) {
					v = sort(
						value.filter((d) => within(d[0], [30000, 0.00001])),
						(a, b) => b[0] - a[0]
					);
				} else {
					const updates = value.filter((d) => within(d[0], [30000, 0.00001]));
					v = sort(syncAll(val, updates), (a, b) => b[0] - a[0]);
				}

				return v;
			});
		},
		clear() {
			initial$.set([]);
		},
		get value() {
			return initial$.value;
		}
	};
}

function boundary(value: number, boundBy = 0) {
	return value + boundBy;
}

function fraction(value: number) {
	return Math.sign(Math.log10(Math.abs(value))) * -1;
}

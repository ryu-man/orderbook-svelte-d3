import { writable } from 'svelte/store';
import type { Change, Snapshot, Spread, Update } from './types';

export function messages(url: string, productId = 'BTC-USD') {
	const bids$ = writable([]);
	const asks$ = writable([]);

	let ws = connect(url);

	function connect(url: string) {
		const ws = new WebSocket(url);
		ws.onopen = () => {
			ws.send(
				JSON.stringify({
					type: 'subscribe',
					product_ids: [productId],
					channels: ['level2_batch']
				})
			);
		};

		ws.onmessage = (e) => {
			const raw = JSON.parse(e.data);

			switch (raw.type) {
				case 'snapshot': {
					const data = parseSnapshot(raw);

					bids$.set(data.bids);
					asks$.set(data.asks);

					break;
				}
				case 'l2update': {
					const data = {
						type: raw.type,
						product_id: raw.product_id,
						changes: raw.changes.map((change) => [
							change[0],
							parseFloat(change[1]),
							parseFloat(change[2])
						]),
						time: new Date(raw.time)
					} as Update;

					// sync changes
					data.changes.forEach((change) => {
						const type = change[0];
						if (type === 'buy') {
							bids$.update((val) => sync(val, change));
						} else {
							asks$.update((val) => sync(val, change));
						}
					});
					break;
				}
			}
		};

		ws.onerror = (err) => {
			console.error(err);
		};

		return ws;
	}

	function reconnect() {
		if (ws.readyState !== ws.CLOSED) {
			ws.close();
		}
		ws = connect(url);
	}

	function isClosed() {
		return ws.readyState === ws.CLOSED;
	}

	function disconnect() {
		return ws.close();
	}

	return { asks$, bids$, isClosed, reconnect, disconnect };
}

function parseSnapshot(raw: Record<string, any>): Snapshot {
	return {
		asks: raw.asks.map((d) => [parseFloat(d[0]), parseFloat(d[1])]),
		bids: raw.bids.map((d) => [parseFloat(d[0]), parseFloat(d[1])]),
		product_id: raw.product_id,
		time: new Date(raw.time),
		type: 'snapshot'
	};
}

function sync(array: Spread[], change: Change): Spread[] {
	const [, price, volume] = change;
	// bid update
	if (volume) {
		// add bid
		const existant = array.find((d) => d[0] === price);
		if (existant) {
			existant[1] = volume;
			return [...array];
		}
		return [...array, [price, volume]];
	} else {
		// delete bid
		return array.filter((d) => d[0] !== price);
	}
}

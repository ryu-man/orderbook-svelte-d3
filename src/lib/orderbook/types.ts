export type SpreadType = 'buy' | 'sell';

export type Spread = [price: number, volume: number];

export type Snapshot = {
	type: 'snapshot';
	product_id?: string;
	time?: Date;
	asks: Spread[];
	bids: Spread[];
};
export type Change = [type: SpreadType, price: number, quantity: number];

export type Update = {
	type: string;
	product_id?: string;
	changes: Change[];
	time?: Date;
};

export type Padding = {
	top: number;
	right: number;
	bottom: number;
	left: number;
};

export type Source = {
	productId: string;
	url: string;
};

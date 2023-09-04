export type SpreadType = 'buy' | 'sell';

export type Spread = [price: number, volume: number];

export type Snapshot = {
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

export type OffsetColor = [color: string, offset: number];
export type OrderbookTheme = {
	askBin: [OffsetColor, OffsetColor];
	askArea: [OffsetColor, OffsetColor];
	bidBin: [OffsetColor, OffsetColor];
	bidArea: [OffsetColor, OffsetColor];
	marketPrice: {
		line: string;
		text: string;
	};
	boundaries: {
		line: string;
		text: string;
	};
	priceTicks: {
		primary: string,
		secondary: string,
	
	}
};

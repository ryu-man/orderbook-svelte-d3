export function floor(value: number, fraction = 0) {
	if (value === 0) return 0;

	const abs = Math.abs(fraction);
	const exponent = Math.floor(Math.log10(Math.abs(value)));

	if (fraction > 0) {
		const fractionedExponent = Math.abs(exponent) + abs - 1;
		const pow = Math.pow(10, fractionedExponent);

		return Math.floor(value * pow) / pow;
	} else {
		const pow = Math.pow(10, abs);

		return Math.floor(value / pow) * pow;
	}
}

export function ceil(value: number, fraction = 0) {
	if (value === 0) return 0;

	const abs = Math.abs(fraction);
	const exponent = Math.floor(Math.log10(Math.abs(value)));

	if (fraction > 0) {
		const fractionedExponent = Math.abs(exponent) + abs - 1;
		const pow = Math.pow(10, fractionedExponent);

		return Math.ceil(value * pow) / pow;
	} else {
		const pow = Math.pow(10, abs);

		return Math.ceil(value / pow) * pow;
	}
}

export function round(value: number, fraction = 0) {
	if (value === 0) return 0;

	const abs = Math.abs(fraction);
	const exponent = Math.floor(Math.log10(Math.abs(value)));

	if (fraction > 0) {
		const fractionedExponent = Math.abs(exponent) + abs - 1;
		const pow = Math.pow(10, fractionedExponent);

		return Math.round(value * pow) / pow;
	} else {
		const pow = Math.pow(10, abs);

		return Math.round(value / pow) * pow;
	}
}

export function expOf(value: number) {
	return Math.floor(Math.log10(Math.abs(value || 1)));
}

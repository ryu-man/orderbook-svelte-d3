export function floor(value: number, fraction = 0) {
	if (value === 0) return 0;

	const abs = Math.abs(fraction);

	if (fraction > 0) {
		const pow = Math.pow(10, abs);
		return Math.floor(value * pow) / pow;
	} else {
		const pow = Math.pow(10, abs);
		return Math.floor(value / pow) * pow;
	}
}

export function ceil(value: number, fraction = 0) {
	if (value === 0) return 0;

	const abs = Math.abs(fraction);

	if (fraction > 0) {
		const pow = Math.pow(10, abs);
		return Math.ceil(value * pow) / pow;
	} else {
		const pow = Math.pow(10, abs);
		return Math.ceil(value / pow) * pow;
	}
}

export function round(value: number, fraction = 0) {
	if (value === 0) return 0;

	const abs = Math.abs(fraction);

	if (fraction > 0) {
		const pow = Math.pow(10, abs);
		return Math.round(value * pow) / pow;
	} else {
		const pow = Math.pow(10, abs);
		return Math.round(value / pow) * pow;
	}
}

export function nice(value: number, grouping: number) {
	const isAboveZero = Math.log10(Math.abs(grouping || 1)) > 0;

	if (isAboveZero) {
		if (grouping > 0) {
			return floor(value, -Math.floor(Math.log10(Math.abs(grouping || 1)))) + grouping;
		} else {
			return floor(value, -Math.floor(Math.log10(Math.abs(grouping || 1))));
		}
	} else {
		const base = floor(value - grouping, 0);
		const fraction = value - base;

		const ratio = Math.floor(Math.abs(fraction / grouping));

		if (grouping > 0) {
			return base + grouping * (ratio + 1);
		} else {
			return base + Math.abs(grouping) * ratio;
		}
	}
}

export function expOf(value: number) {
	return Math.floor(Math.log10(Math.abs(value || 1)));
}

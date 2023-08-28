import type { DrawFn } from './context';

export function getDraw(
	fn: (ctx: CanvasRenderingContext2D) => void,
	{ x = 0, y = 0, w = 0, h = 0, type = 'element' } = {}
) {
	return {
		x: x,
		y: y,
		w: w,
		h: h,
		type: type,
		draw: fn
	} as DrawFn;
}

type CanvasElement = { x: number; y: number; w: number; h: number };

export function shouldDraw(vx: number, vy: number, vw: number, vh: number, elem: CanvasElement) {
	const x0_within = elem.x >= vx && elem.x <= vx + vw;
	const y0_within = elem.y >= vy && elem.y <= vy + vh;

	const x1_within = elem.x + elem.w >= vx && elem.x + elem.w <= vx + vw;
	const y1_within = elem.y + elem.h >= vy && elem.y + elem.h <= vy + vh;

	const overlapsX = elem.x <= vx && elem.x + elem.w >= vx + vw;
	const overlapsY = elem.y <= vy && elem.y + elem.h >= vy + vh;

	return (
		((x0_within || overlapsX) && (y0_within || y1_within || overlapsY)) ||
		((x1_within || overlapsX) && (y0_within || y1_within || overlapsY))
	);
}

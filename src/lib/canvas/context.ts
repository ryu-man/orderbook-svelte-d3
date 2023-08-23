import { getContext, setContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';

export const CANVAS_CONTEXT_KEY = '6XaRMari';

export type DrawFn = {
	x: number;
	y: number;
	w: number;
	h: number;
	type: string;
	draw: (ctx: CanvasRenderingContext2D) => void;
};

export type EventCallback<T extends Event> =
	| ((e: T) => void)
	| ((e: T, ctx: CanvasRenderingContext2D) => void)
	| (() => void);

export type RemoveEventListener = () => void;

export type ContextProps = {
	ctx?: CanvasRenderingContext2D;
	width?: number;
	height?: number;
	mount(fn: DrawFn): void;
	unmount(fn: DrawFn): void;

	addEventListener<T extends Event = Event>(type: string, cb: (e: T) => void): RemoveEventListener;
	addEventListener<T extends Event = Event>(
		type: string,
		cb: (e: T, ctx: CanvasRenderingContext2D) => void
	): RemoveEventListener;
	addEventListener(type: string, cb: () => void): RemoveEventListener;

	removeEventListener<T extends Event>(type: string, cb: (e: T) => void): void;
	removeEventListener<T extends Event>(
		type: string,
		cb: (e: T, ctx: CanvasRenderingContext2D) => void
	): void;
	removeEventListener(type: string, cb: () => void): void;

	getParentProps(): Record<string, any>;

	clear(): void;
};

export type CanvasContext = {
	ctx$: Readable<CanvasRenderingContext2D>;
	width$: Writable<number>;
	height$: Writable<number>;
	vx$: Writable<number>;
	vy$: Writable<number>;
	vw$: Writable<number>;
	vh$: Writable<number>;
	container$: Writable<HTMLDivElement | undefined>;
	refresh$: Writable<number>;
	mount(fn: DrawFn): void;
	unmount(fn: DrawFn): void;

	addEventListener<T extends Event = Event>(type: string, cb: (e: T) => void): RemoveEventListener;
	addEventListener<T extends Event = Event>(
		type: string,
		cb: (e: T, ctx: CanvasRenderingContext2D) => void
	): RemoveEventListener;
	addEventListener<T extends Event = Event>(type: string, cb: () => void): RemoveEventListener;

	removeEventListener<T extends Event>(type: string, cb: (e: T) => void): void;
	removeEventListener<T extends Event>(
		type: string,
		cb: (e: T, ctx: CanvasRenderingContext2D) => void
	): void;
	removeEventListener(type: string, cb: () => void): void;

	getParentProps(): Record<string, any>;

	clear(): void;
};

export function getCanvasContext() {
	return getContext(CANVAS_CONTEXT_KEY) as CanvasContext;
}

export function setCanvasContext(props: ContextProps): CanvasContext {
	return setContext(CANVAS_CONTEXT_KEY, {
		ctx$: writable(props.ctx),
		width$: writable(props.width || 0),
		height$: writable(props.height || 0),
		vx$: writable(0),
		vy$: writable(0),
		vw$: writable(0),
		vh$: writable(0),
		container$: writable(),
		refresh$: writable(1),
		mount: props.mount,
		unmount: props.unmount,
		addEventListener: props.addEventListener,
		removeEventListener: props.removeEventListener,
		getParentProps: props.getParentProps,
		clear: props.clear
	});
}

export function overridesContext(context: Partial<CanvasContext>) {
	const old = getCanvasContext();
	return setContext(CANVAS_CONTEXT_KEY, {
		...old,
		...context
	});
}


/********************************************************************************************************** */

const CANVAS_VIEWPORT_CONTEXT = 'canvas_viewport_context';

export type CanvasViewportContext = {
	vx$: Writable<number>;
	vy$: Writable<number>;
	vw$: Writable<number>;
	vh$: Writable<number>;
	viewportElement$: Writable<HTMLElement>;
};

export function getCanvasViewportContext(): CanvasViewportContext {
	return (
		getContext(CANVAS_VIEWPORT_CONTEXT) || {
			vh$: writable(0),
			vw$: writable(0),
			vx$: writable(0),
			vy$: writable(0),
			viewportElement$: writable()
		}
	);
}

export function setCanvasViewportContext(): CanvasViewportContext {
	return setContext(CANVAS_VIEWPORT_CONTEXT, {
		vh$: writable(0),
		vw$: writable(0),
		vx$: writable(0),
		vy$: writable(0),
		viewportElement$: writable()
	});
}

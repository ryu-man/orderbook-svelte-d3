import { getContext, setContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';

export const CANVAS_CONTEXT_KEY = '6XaRMari';

export type DrawFn = (ctx: CanvasRenderingContext2D) => void;

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

export function setCanvasContext({
	ctx,
	width,
	height,
	mount,
	unmount,
	addEventListener,
	removeEventListener,
	getParentProps,
	clear
}: ContextProps): CanvasContext {
	return setContext(CANVAS_CONTEXT_KEY, {
		ctx$: writable(ctx),
		width$: writable(width || 0),
		height$: writable(height || 0),
		mount,
		unmount,
		addEventListener,
		removeEventListener,
		getParentProps,
		clear
	});
}

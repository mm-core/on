export interface IHandle {
	destroy(this: IHandle): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function nop() { }

/**
 * Returns an object with a destroy method that, when called, calls the passed-in destructor.
 * This is intended to provide a unified interface for creating "remove" / "destroy" handlers for
 * event listeners, timers, etc.
 *
 * @param destructor A function that will be called when the handle's `destroy` method is invoked
 * @return The handle object
 */
export function createHandle(destructor: () => void): IHandle {
	return {
		destroy() {
			this.destroy = nop;
			destructor.call(this);
		}
	};
}

/**
 * Returns a single handle that can be used to destroy multiple handles simultaneously.
 *
 * @param handles An array of handles with `destroy` methods
 * @return The handle object
 */
export function createCompositeHandle(...handles: IHandle[]): IHandle {
	return createHandle(() => {
		for (const handle of handles) {
			handle.destroy();
		}
	});
}

/**
 * Provides a normalized mechanism for dispatching events for event emitters,
 * Evented objects, or DOM nodes.
 * @param {(Window | Document | Node)} target The target to emit the event from
 * @param {string} type The event type to emit
 * @returns Boolean indicating if preventDefault was called on the event object (only relevant for DOM events;
 */
export function emit(target: Window | Document | Node, type: string, bubbles: boolean, cancelable: boolean, params?: { [key: string]: any; }) {
	const node = target as Node;
	const win = target as Window;
	const doc = target as Document;
	if (
		target.dispatchEvent && /* includes window and document */
		((node.ownerDocument && node.ownerDocument.createEvent) || /* matches nodes */
			(win.document && win.document.createEvent) || /* matches window */
			doc.createEvent) /* matches document */
	) {
		const nativeEvent = (node.ownerDocument || win.document || doc).createEvent('HTMLEvents');
		nativeEvent.initEvent(type, bubbles, cancelable);

		if (params) {
			for (const key in params) {
				if (!(key in nativeEvent)) {
					nativeEvent[key] = (params as any)[key];
				}
			}
		}

		return target.dispatchEvent(nativeEvent);
	}

	throw new Error('Target must be an event emitter');
}

/**
 * Provides a normalized mechanism for listening to events from event emitters, Evented objects, or DOM nodes.
 * @param target Target to listen for event on
 * @param type Event event type(s) to listen for; may a string or an array of strings
 * @param listener Callback to handle the event when it fires
 * @param capture Whether the listener should be registered in the capture phase (DOM events only)
 * @return A handle which will remove the listener when destroy is called
 */
export default function on(target: Window | Document | Node, type: string | string[], listener: EventListener, capture?: boolean) {
	if (Array.isArray(type)) {
		const handles: IHandle[] = type.map((tp: string) => {
			return on(target, tp, listener, capture);
		});

		return createCompositeHandle(...handles);
	}

	const callback = function (this: any, ...args: any[]) {
		listener.apply(this, args);
	} as EventListener;

	// DOM EventTarget
	if (target.addEventListener && target.removeEventListener) {
		target.addEventListener(type, callback, capture);
		return createHandle(() => {
			target.removeEventListener(type, callback, capture);
		});
	}

	throw new TypeError('Unknown event emitter object');
}

/**
 * Provides a mechanism for listening to the next occurrence of an event from event
 * emitters, Evented objects, or DOM nodes.
 * @param target Target to listen for event on
 * @param type Event event type(s) to listen for; may be a string or an array of strings
 * @param listener Callback to handle the event when it fires
 * @param capture Whether the listener should be registered in the capture phase (DOM events only)
 * @return A handle which will remove the listener when destroy is called
 */
export function once(target: Window | Document | Node, type: string | string[], listener: EventListener, capture?: boolean) {
	const handle = on(target, type, (evt: Event) => {
		handle.destroy();
		return listener(evt);
	}, capture);

	return handle;
}

export interface IPausableHandle extends IHandle {
	pause(): void;
	resume(): void;
}

/**
 * Provides a mechanism for creating pausable listeners for events from event emitters, Evented objects, or DOM nodes.
 * @param target Target to listen for event on
 * @param type Event event type(s) to listen for; may a string or an array of strings
 * @param listener Callback to handle the event when it fires
 * @param capture Whether the listener should be registered in the capture phase (DOM events only)
 * @return A handle with additional pause and resume methods; the listener will never fire when paused
 */
export function pausable(target: Window | Document | Node, type: string | string[], listener: EventListener, capture?: boolean): IPausableHandle {
	let paused: boolean;

	const handle = on(target, type, (evt: Event) => {
		if (!paused) {
			listener(evt);
		}
	}, capture) as IPausableHandle;

	handle.pause = () => {
		paused = true;
	};

	handle.resume = () => {
		paused = false;
	};

	return handle;
}

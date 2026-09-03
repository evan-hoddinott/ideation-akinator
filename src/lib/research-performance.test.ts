import { describe, expect, it, vi } from 'vitest';
import {
	DEMO_RESEARCH_DURATION_MS,
	researchSceneOrder,
	startVisibleTimer
} from '$lib/research-performance';

describe('research workstation performance', () => {
	it('assigns each pass five deterministic nonrepeating scenes', () => {
		const broad = researchSceneOrder('project-1', 'broad');
		const focused = researchSceneOrder('project-1', 'focused');
		expect(broad).toHaveLength(5);
		expect(focused).toHaveLength(5);
		expect(new Set(broad).size).toBe(5);
		expect(new Set(focused).size).toBe(5);
		expect(new Set([...broad, ...focused]).size).toBe(10);
		expect(researchSceneOrder('project-1', 'broad')).toEqual(broad);
	});

	it('uses a longer broad demo wait than the focused pass', () => {
		expect(DEMO_RESEARCH_DURATION_MS.broad).toBeGreaterThan(DEMO_RESEARCH_DURATION_MS.focused);
		expect(DEMO_RESEARCH_DURATION_MS.focused).toBeGreaterThanOrEqual(10_000);
	});

	it('pauses the demo clock while the page is hidden', () => {
		vi.useFakeTimers();
		let visibilityState: DocumentVisibilityState = 'visible';
		const listeners = new Set<EventListenerOrEventListenerObject>();
		const fakeDocument = {
			get visibilityState() {
				return visibilityState;
			},
			addEventListener: (_name: string, listener: EventListenerOrEventListenerObject) =>
				listeners.add(listener),
			removeEventListener: (_name: string, listener: EventListenerOrEventListenerObject) =>
				listeners.delete(listener)
		} as Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
		const fireVisibility = () =>
			listeners.forEach((listener) =>
				typeof listener === 'function' ? listener(new Event('visibilitychange')) : undefined
			);
		const complete = vi.fn();
		const stop = startVisibleTimer(10_000, complete, fakeDocument);
		vi.advanceTimersByTime(4_000);
		visibilityState = 'hidden';
		fireVisibility();
		vi.advanceTimersByTime(20_000);
		expect(complete).not.toHaveBeenCalled();
		visibilityState = 'visible';
		fireVisibility();
		vi.advanceTimersByTime(6_000);
		expect(complete).toHaveBeenCalledOnce();
		stop();
		vi.useRealTimers();
	});
});

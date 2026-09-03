export type ResearchTask = 'broad' | 'focused';

export type ResearchScene =
	| 'minecraft'
	| 'cats'
	| 'mines'
	| 'search'
	| 'desktop'
	| 'forums'
	| 'cable'
	| 'sleep'
	| 'advert'
	| 'files';

export const RESEARCH_SCENES: ResearchScene[] = [
	'minecraft',
	'cats',
	'mines',
	'search',
	'desktop',
	'forums',
	'cable',
	'sleep',
	'advert',
	'files'
];

export const DEMO_RESEARCH_DURATION_MS: Record<ResearchTask, number> = {
	broad: 18_000,
	focused: 14_000
};

export function researchSceneOrder(projectId: string, task: ResearchTask): ResearchScene[] {
	const shuffled = [...RESEARCH_SCENES];
	let state = seededNumber(projectId);
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		state = (state * 1_664_525 + 1_013_904_223) >>> 0;
		const target = state % (index + 1);
		[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
	}
	const half = shuffled.length / 2;
	return task === 'broad' ? shuffled.slice(0, half) : shuffled.slice(half);
}

export function seededNumber(value: string): number {
	let hash = 2_166_136_261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16_777_619);
	}
	return hash >>> 0;
}

export function startVisibleTimer(
	durationMs: number,
	callback: () => void,
	documentTarget: Pick<
		Document,
		'visibilityState' | 'addEventListener' | 'removeEventListener'
	> = document
): () => void {
	let remaining = Math.max(0, durationMs);
	let startedAt = 0;
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let stopped = false;

	const clear = () => {
		if (timeout !== null) clearTimeout(timeout);
		timeout = null;
	};
	const schedule = () => {
		clear();
		if (stopped || documentTarget.visibilityState !== 'visible') return;
		startedAt = Date.now();
		timeout = setTimeout(() => {
			remaining = 0;
			stopped = true;
			documentTarget.removeEventListener('visibilitychange', onVisibility);
			callback();
		}, remaining);
	};
	const onVisibility = () => {
		if (documentTarget.visibilityState === 'hidden') {
			if (timeout !== null) remaining = Math.max(0, remaining - (Date.now() - startedAt));
			clear();
			return;
		}
		schedule();
	};

	documentTarget.addEventListener('visibilitychange', onVisibility);
	schedule();
	return () => {
		stopped = true;
		clear();
		documentTarget.removeEventListener('visibilitychange', onVisibility);
	};
}

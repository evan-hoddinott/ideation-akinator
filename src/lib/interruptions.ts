import type { StorageLike, WorkflowStage } from '$lib/project-state';

export const POPUP_DEFINITIONS = [
	{
		id: 'antivirus',
		title: 'WIZARD DEFENDER 98',
		icon: 'warning',
		body: '3 curses found in System32. One is unionized.',
		action: 'PANIC'
	},
	{
		id: 'aim',
		title: 'INSTANT MESSAGER',
		icon: 'mail',
		body: 'xX_DarkSysop_Xx: u there??? the prophecy leaked',
		action: 'AWAY'
	},
	{
		id: 'weather',
		title: 'WEATHERBUG BUT WORSE',
		icon: 'warning',
		body: 'Forecast: 80% chance of toolbar. Feels like malware.',
		action: 'DRESS ME'
	},
	{
		id: 'forum',
		title: 'WIZARD FORUM DRAMA',
		icon: 'folder',
		body: 'Thread locked: Divination is NOT a substitute for user research.',
		action: 'REPLY ALL'
	},
	{
		id: 'chain-mail',
		title: 'FWD: FWD: ANCIENT WARNING',
		icon: 'mail',
		body: 'Send this to 12 founders or your MVP gains blockchain.',
		action: 'FORWARD'
	},
	{
		id: 'accelerator',
		title: 'DOWNLOAD ACCELERATOR',
		icon: 'drive-harddisk',
		body: 'Your idea is downloading at 114%. Please insert more internet.',
		action: 'TURBO'
	},
	{
		id: 'desktop-pet',
		title: 'FREE DESKTOP FAMILIAR',
		icon: 'folder',
		body: 'This cat requires administrator access and one tuna.',
		action: 'INSTALL CAT'
	},
	{
		id: 'error',
		title: 'A PROBLEM HAS OCCURRED',
		icon: 'error',
		body: 'Error 0xBEEF: Success completed unsuccessfully.',
		action: 'DETAILS'
	},
	{
		id: 'hot-wizards',
		title: 'TOTALLY LOCAL AD',
		icon: 'warning',
		body: 'HOT SINGLE WIZARDS in your subnet. Scry now!',
		action: 'SCRY'
	},
	{
		id: 'guestbook',
		title: 'GUESTBOOK NOTIFICATION',
		icon: 'mail',
		body: 'cool site. needs more skull gifs. — xXPurlXx',
		action: 'SIGN BACK'
	}
] as const;

export const PURL_EVENTS = [
	{ id: 'walkthrough', message: '🐈 ≋≋ MY KEYBOARD NOW ≋≋', useful: false },
	{ id: 'research-cat', message: '🐈⌨ ✧ alt+cat ✧', useful: false },
	{ id: 'router-nap', message: '🐈☁ zzz on warm router zzz', useful: false },
	{ id: 'cable-help', message: '🐈✂ ≋ “fixed cable” ≋', useful: false },
	{ id: 'popup-cleaner', message: '🐈✨ ⌫⌫ JUNK VANISHED ⌫⌫', useful: true },
	{ id: 'admin-cat', message: '🐈⚿ ≋ i am root ≋', useful: false }
] as const;

export interface ChaosRunState {
	seenPopupIds: string[];
	seenPurlIds: string[];
	usefulPurlUsed: boolean;
	dismissedPopups: number;
}

export function createChaosRunState(): ChaosRunState {
	return { seenPopupIds: [], seenPurlIds: [], usefulPurlUsed: false, dismissedPopups: 0 };
}

export function chaosStorageKey(projectId: string): string {
	return `ideation-akinator:chaos:${projectId}`;
}

export function loadChaosRun(storage: StorageLike, projectId: string): ChaosRunState {
	try {
		const value: unknown = JSON.parse(storage.getItem(chaosStorageKey(projectId)) ?? 'null');
		if (!value || typeof value !== 'object') return createChaosRunState();
		const candidate = value as Partial<ChaosRunState>;
		if (
			!Array.isArray(candidate.seenPopupIds) ||
			!candidate.seenPopupIds.every((id) => typeof id === 'string') ||
			!Array.isArray(candidate.seenPurlIds) ||
			!candidate.seenPurlIds.every((id) => typeof id === 'string') ||
			typeof candidate.usefulPurlUsed !== 'boolean' ||
			typeof candidate.dismissedPopups !== 'number'
		)
			return createChaosRunState();
		return {
			seenPopupIds: candidate.seenPopupIds,
			seenPurlIds: candidate.seenPurlIds,
			usefulPurlUsed: candidate.usefulPurlUsed,
			dismissedPopups: Math.max(0, Math.floor(candidate.dismissedPopups))
		};
	} catch {
		return createChaosRunState();
	}
}

export function saveChaosRun(storage: StorageLike, projectId: string, state: ChaosRunState): void {
	storage.setItem(chaosStorageKey(projectId), JSON.stringify(state));
}

export function clearChaosRun(storage: StorageLike, projectId: string): void {
	storage.removeItem(chaosStorageKey(projectId));
}

export function nextUnseenId(
	ids: readonly string[],
	seen: readonly string[],
	projectId: string,
	turn: number
): string | null {
	const available = ids.filter((id) => !seen.includes(id));
	if (available.length === 0) return null;
	return available[stableHash(`${projectId}:${turn}`) % available.length];
}

export function shouldUseHelpfulPurl(stage: WorkflowStage, state: ChaosRunState): boolean {
	return !state.usefulPurlUsed && (stage === 'concepts' || stage === 'focused');
}

function stableHash(value: string): number {
	let hash = 2_166_136_261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16_777_619);
	}
	return hash >>> 0;
}

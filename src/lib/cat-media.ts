import sources from '../../static/media/cats/sources.json';

export const CAT_CLIPS = sources;
export type CatClip = (typeof CAT_CLIPS)[number];

/** A saved run gets one reproducible order, including after refresh. */
export function catPlaylist(runId: string): CatClip[] {
	let state = 2166136261;
	for (const character of runId) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
	const random = () => {
		state += 0x6d2b79f5;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
	const clips = [...CAT_CLIPS];
	for (let i = clips.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[clips[i], clips[j]] = [clips[j], clips[i]];
	}
	return clips;
}

export function clipDuration(seconds: number) {
	return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

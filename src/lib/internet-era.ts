export const INTERNET_ERAS = [
	'dos-bbs',
	'personal-web',
	'geocities',
	'aol-98',
	'dot-com',
	'windows-xp',
	'flash-games',
	'myspace',
	'early-video',
	'forums',
	'social-mobile',
	'algorithmic',
	'ai-slop',
	'cosmic'
] as const;

export type InternetEra = (typeof INTERNET_ERAS)[number];

export function internetEraIndex(altitude: number): number {
	const safeAltitude = Math.max(0, Math.min(0.999_999, altitude));
	return Math.min(INTERNET_ERAS.length - 1, Math.floor(safeAltitude * INTERNET_ERAS.length));
}

export function internetEraForAltitude(altitude: number): InternetEra {
	return INTERNET_ERAS[internetEraIndex(altitude)];
}

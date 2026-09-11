export function pixelViewport(width: number, height: number, viewportHeight: number, target = 360) {
	const scale = Math.max(1, Math.round(viewportHeight / target));
	return {
		width: Math.max(1, Math.round(width / scale)),
		height: Math.max(1, Math.round(height / scale)),
		scale
	};
}

export const cozyMaterialColors: Record<string, number> = {
	robe_navy: 0x76739b,
	robe_violet: 0x9e8bac,
	hat_indigo: 0x665e8a,
	hat_band: 0xb18b9b,
	boot_dark: 0x73607a,
	crt_case: 0xe3cfa6,
	crt_case_dark: 0x8e8069,
	glove: 0xffedc9,
	chair_shell: 0x9388a8,
	chair_pad: 0x667a79,
	chair_trim: 0xacc9ab,
	chair_metal: 0x827c72
};

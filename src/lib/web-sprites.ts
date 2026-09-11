export const webSprites = {
	cat: {
		url: '/images/internet/cat-frames.png',
		durations: [100, 100, 100, 100, 100, 100, 100, 100, 100],
		tile: 96,
		columns: 8
	},
	globe: {
		url: '/images/internet/globe-frames.png',
		durations: [
			50, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
			100, 50
		],
		tile: 96,
		columns: 8
	},
	star: {
		url: '/images/internet/star-frames.png',
		durations: [
			40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40
		],
		tile: 96,
		columns: 8
	},
	hello: {
		url: '/images/internet/hello-frames.png',
		durations: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 1000],
		tile: 96,
		columns: 8
	},
	email: {
		url: '/images/internet/email-frames.png',
		durations: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
		tile: 96,
		columns: 8
	}
} as const;

import * as THREE from 'three';

/** Draw at native 320 x 180: hard pixel clusters, stepped hills, and sparse era motifs. */
export function createEraBackdrop(index: number, sky: number) {
	const canvas = document.createElement('canvas');
	canvas.width = 320;
	canvas.height = 180;
	const c = canvas.getContext('2d')!;
	c.imageSmoothingEnabled = false;
	const palettes = [
		'#b2c9ac',
		'#c4d6bf',
		'#b8afce',
		'#a9ccdc',
		'#cabfa4',
		'#81bce0',
		'#9ba2c5',
		'#c3a2bf',
		'#b7c8d2',
		'#a1c8c3',
		'#b1d4dd',
		'#c2bd99',
		'#c4b6d4',
		'#677395'
	];
	c.fillStyle = '#' + sky.toString(16).padStart(6, '0');
	c.fillRect(0, 0, 320, 180);
	c.fillStyle = palettes[index];
	c.fillRect(0, 40, 320, 140);
	// Stippled horizon rather than a smooth modern gradient.
	for (let y = 26; y < 48; y += 2)
		for (let x = 0; x < 320; x += 2) if ((x / 2 + y / 2) % 4 < (y - 26) / 6) c.fillRect(x, y, 2, 2);
	c.fillStyle = index === 13 ? '#f5e6b9' : '#fff0cb';
	c.fillRect(246, 22, 16, 16);
	c.fillRect(250, 18, 8, 24);
	if (index === 0 || index === 2 || index === 7 || index === 13) {
		c.fillStyle = '#f7e9cb';
		for (let i = 0; i < 40; i++) {
			const x = (i * 73 + 19) % 320,
				y = (i * 37 + 7) % 96;
			c.fillRect(x, y, 2, 2);
			if (i % 6 === 0) {
				c.fillRect(x - 2, y + 1, 6, 1);
				c.fillRect(x, y - 2, 1, 6);
			}
		}
	}
	const hills = index === 5 ? ['#7caf70', '#91c879', '#aad18a'] : ['#93aaa0', '#a2b6a2', '#bbc7a7'];
	for (let layer = 0; layer < 3; layer++) {
		c.fillStyle = index === 13 ? ['#737e9e', '#8991ad', '#a2a7bc'][layer] : hills[layer];
		for (let x = 0; x < 320; x += 4) {
			const y =
				103 +
				layer * 18 +
				Math.round((Math.sin(x / (35 + layer * 12) + index + layer) * (14 - layer * 3)) / 3) * 3;
			c.fillRect(x, y, 4, 180 - y);
		}
	}
	// Era-specific distant skylines are silhouettes, leaving the center quiet.
	for (const x of [12, 48, 268, 304]) {
		c.fillStyle = index === 13 ? '#53647e' : '#7c9290';
		if (index === 0) {
			c.fillRect(x, 65, 2, 65);
			for (let y = 72; y < 115; y += 10) c.fillRect(x - 7, y, 16, 2);
		} else if ([4, 10, 11, 12].includes(index)) {
			c.fillRect(x - 8, 73, 16, 61);
			c.fillStyle = '#dce3be';
			for (let y = 80; y < 126; y += 9) c.fillRect(x - 4, y, 3, 3);
		} else if ([6, 8, 9].includes(index)) {
			c.fillRect(x - 8, 82, 16, 30);
			c.fillStyle = '#c7dfca';
			c.fillRect(x - 5, 86, 10, 17);
		}
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
	let disposed = false;
	const cloud = new Image();
	cloud.onload = () => {
		if (disposed) return;
		const sprite = document.createElement('canvas');
		sprite.width = 24;
		sprite.height = 24;
		const sc = sprite.getContext('2d')!;
		sc.imageSmoothingEnabled = false;
		sc.beginPath();
		sc.rect(4, 4, 16, 12);
		sc.rect(0, 8, 24, 8);
		sc.clip();
		sc.drawImage(cloud, 0, 0);
		for (const [x, y] of [
			[22, 25],
			[98, 48],
			[182, 19],
			[276, 58]
		])
			c.drawImage(sprite, x, y, 24, 24);
		texture.needsUpdate = true;
	};
	if (index !== 13) cloud.src = '/images/era-collection/kenney-tile_0008.png';
	return {
		texture,
		dispose() {
			disposed = true;
			cloud.onload = null;
			texture.dispose();
		}
	};
}

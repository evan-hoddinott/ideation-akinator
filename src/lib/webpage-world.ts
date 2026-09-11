import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { INTERNET_ERAS } from './internet-era';
import { ERA_HEIGHT } from './era-journey';

/** Page controls have thickness, side faces, contact shadows and their own local motion. */
export function createWebpageWorld() {
	const root = new THREE.Group();
	let disposed = false;
	const geometries: THREE.BufferGeometry[] = [];
	const materials: THREE.Material[] = [];
	const textures: THREE.Texture[] = [];
	const animated: { object: THREE.Object3D; kind: string; base: number }[] = [];
	const mat = (color: number) => {
		const m = new THREE.MeshLambertMaterial({ color, flatShading: true });
		materials.push(m);
		return m;
	};
	const cream = mat(0xe4d6b5),
		ink = mat(0x4c4b52),
		purple = mat(0x9281b0),
		gold = mat(0xdab76d),
		green = mat(0xa2bb8a),
		red = mat(0xb85c5e);
	const mesh = (
		g: THREE.Object3D,
		geometry: THREE.BufferGeometry,
		m: THREE.Material,
		x: number,
		y: number,
		z: number,
		name: string
	) => {
		geometries.push(geometry);
		const o = new THREE.Mesh(geometry, m);
		o.position.set(x, y, z);
		o.name = name;
		g.add(o);
		return o;
	};
	const box = (
		g: THREE.Group,
		x: number,
		y: number,
		z: number,
		w: number,
		h: number,
		d: number,
		m: THREE.Material,
		name: string
	) => mesh(g, new THREE.BoxGeometry(w, h, d), m, x, y, z, name);
	const text = (
		g: THREE.Group,
		label: string,
		x: number,
		y: number,
		z: number,
		w: number,
		h: number,
		color = '#4b4350',
		bg = '#eee3c8'
	) => {
		const c = document.createElement('canvas');
		c.width = Math.max(32, Math.round((64 * w) / h));
		c.height = 64;
		const ctx = c.getContext('2d')!;
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, c.width, c.height);
		ctx.fillStyle = color;
		const fontSize = Math.min(48, (c.width - 8) / Math.max(1, label.length * 0.64));
		ctx.font = `bold ${fontSize}px monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(label, c.width / 2, 32);
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		t.magFilter = THREE.NearestFilter;
		t.minFilter = THREE.NearestFilter;
		textures.push(t);
		const m = new THREE.MeshBasicMaterial({ map: t });
		materials.push(m);
		return mesh(g, new THREE.PlaneGeometry(w, h), m, x, y, z, label);
	};
	// The first atlas cell supplies still artwork on dimensional page controls.
	// Animated versions remain in the surrounding page, with the same calm fallback.
	const catTexture = new THREE.TextureLoader().load(
		'/images/internet/cat-frames.png',
		(texture) => {
			if (disposed) texture.dispose();
		}
	);
	catTexture.colorSpace = THREE.SRGBColorSpace;
	catTexture.magFilter = THREE.NearestFilter;
	catTexture.minFilter = THREE.NearestFilter;
	catTexture.repeat.set(1 / 8, 1 / 2);
	catTexture.offset.set(0, 1 / 2);
	textures.push(catTexture);
	const catMaterial = new THREE.MeshBasicMaterial({
		map: catTexture,
		transparent: true,
		alphaTest: 0.1
	});
	materials.push(catMaterial);
	const catPicture = (
		parent: THREE.Object3D,
		x: number,
		y: number,
		z: number,
		width: number,
		height: number
	) =>
		mesh(
			parent,
			new THREE.PlaneGeometry(width, height),
			catMaterial,
			x,
			y,
			z,
			'Sourced cat picture'
		);
	const zones = INTERNET_ERAS.map((era, index) => {
		const g = new THREE.Group();
		g.name = era;
		g.position.y = index * ERA_HEIGHT;
		root.add(g);
		if (index === 0) {
			for (const x of [-5, 5]) box(g, x, 2, -2, 0.22, 10, 0.5, green, 'ASCII doorway upright');
			box(g, 0, 7, -2, 10.2, 0.22, 0.5, green, 'ASCII doorway header');
			const modem = box(g, 10, 1, 0, 5, 1.4, 2.5, cream, 'Modem');
			modem.rotation.y = -0.25;
			modem.rotation.x = 0.15;
			for (let i = 0; i < 4; i++) {
				const led = box(
					g,
					8.6 + i * 0.85,
					1.1,
					1.35,
					0.26,
					0.18,
					0.1,
					i % 2 ? gold : green,
					'Modem activity light'
				);
				animated.push({ object: led, kind: 'blink', base: i });
			}
			const points = [
				new THREE.Vector3(11.8, 0.7, 0),
				new THREE.Vector3(13, -0.5, 0),
				new THREE.Vector3(12, -1.4, 0),
				new THREE.Vector3(14, -0.7, -2),
				new THREE.Vector3(15, -4, -2)
			];
			mesh(
				g,
				new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 22, 0.12, 5, false),
				ink,
				0,
				0,
				0,
				'Telephone cable'
			);
			const cursor = box(g, -9, -0.7, 0, 1.1, 0.2, 0.8, gold, 'Command cursor');
			animated.push({ object: cursor, kind: 'blink', base: 0 });
		}
		if (index === 2) {
			const globe = mesh(
				g,
				new THREE.IcosahedronGeometry(1.2, 1),
				purple,
				10,
				2,
				1,
				'Spinning globe'
			);
			const blue = mat(0x729bae);
			globe.material = blue;
			for (let i = 0; i < 7; i++) {
				const land = mesh(
					g,
					new THREE.IcosahedronGeometry(0.4, 0),
					green,
					0,
					0,
					0,
					'Globe continent'
				);
				globe.add(land);
				land.position.set(Math.cos(i * 2) * 0.9, Math.sin(i * 3) * 0.8, Math.sin(i * 2) * 0.8);
			}
			animated.push({ object: globe, kind: 'rotate', base: 0 });
			for (let i = 0; i < 6; i++) {
				const x = 7.4 + i * 0.85;
				box(g, x, -0.9, 1, 0.75, 1.1, 0.8, ink, 'Visitor counter wheel');
				text(g, '000042'[i], x, -0.9, 1.42, 0.65, 0.75, '#ead489', '#3c3746');
			}
			box(g, -10, 0.4, 1, 5, 0.85, 0.65, gold, 'Construction barricade');
			for (let i = 0; i < 6; i++) {
				const stripe = box(g, -12 + i * 0.8, 0.4, 1.36, 0.24, 0.84, 0.05, ink, 'Hazard stripe');
				stripe.rotation.z = -0.35;
			}
			for (const x of [-11.7, -8.3])
				box(g, x, -0.5, 0.8, 0.2, 1.9, 0.35, cream, 'Barricade support');
			const envelope = box(g, -10, 2.2, 1, 2.5, 1.7, 0.35, cream, 'Rotating email envelope');
			envelope.rotation.z = 0.1;
			animated.push({ object: envelope, kind: 'sway', base: 0.1 });
			text(g, 'EMAIL', -10, 2.2, 1.2, 2, 0.55);
			box(g, -10, -1.35, 0.5, 4.3, 0.75, 1.3, purple, 'ENTER button');
			text(g, 'ENTER', -10, -1.35, 1.17, 3.8, 0.5, '#f5e7b7', '#706089');
		}
		if (index === 8) {
			// The Sage is inside the large player; related videos sit outside its right border.
			box(g, -15.1, 2.6, -1, 0.22, 5.7, 0.8, cream, 'Video player left edge');
			box(g, 5.95, 2.6, -1, 0.22, 5.7, 0.8, cream, 'Video player right edge');
			box(g, -4.5, -0.8, 0, 21, 0.65, 1, cream, 'Player control bar');
			box(g, -2, -0.7, 0.6, 10, 0.09, 0.12, ink, 'Scrubber rail');
			const playhead = box(g, -6, -0.7, 0.75, 0.3, 0.6, 0.3, red, 'Video playhead');
			animated.push({ object: playhead, kind: 'scrub', base: -6 });
			const tri = mesh(
				g,
				new THREE.CylinderGeometry(0.37, 0.37, 0.2, 3),
				ink,
				-12.3,
				-0.7,
				0.8,
				'Play button'
			);
			tri.rotation.x = Math.PI / 2;
			tri.rotation.z = -Math.PI / 2;
			for (const x of [-11.3, -10.9]) box(g, x, -0.7, 0.8, 0.15, 0.5, 0.2, ink, 'Pause button');
			for (let i = 0; i < 5; i++) {
				const shape = new THREE.Shape();
				for (let p = 0; p < 10; p++) {
					const a = (p * Math.PI) / 5,
						r = p % 2 ? 0.2 : 0.45;
					const x = Math.sin(a) * r,
						y = Math.cos(a) * r;
					if (p === 0) shape.moveTo(x, y);
					else shape.lineTo(x, y);
				}
				shape.closePath();
				mesh(
					g,
					new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false }),
					gold,
					-12 + i * 1.15,
					-1.55,
					0.5,
					'Rating star'
				);
			}
			const lens = mesh(
				g,
				new THREE.CylinderGeometry(0.55, 0.65, 0.6, 8),
				ink,
				-11.3,
				4.6,
				0.5,
				'Webcam lens'
			);
			lens.rotation.x = Math.PI / 2;
			box(g, -11.3, 4.2, 0.2, 1.8, 1.5, 0.75, cream, 'Webcam');
			box(g, 11, 1.2, 0.5, 3, 1.8, 2, mat(0xb69670), 'Purl cardboard box');
			for (const side of [-1, 1]) {
				const flap = box(g, 11 + side * 1.2, 2.15, 0.5, 1.2, 0.12, 2, cream, 'Cardboard flap');
				flap.rotation.z = side * 0.6;
			}
		}
		if (index === 1) {
			for (let i = 0; i < 3; i++) {
				box(g, -10, 3 - i * 1.15, 0.4, 5, 0.18, 1.1, purple, 'Hyperlink step');
				text(
					g,
					['ABOUT ME', 'COOL LINKS', 'MY FILES'][i],
					-10,
					3.3 - i * 1.15,
					1,
					4,
					0.45,
					'#6467a5'
				);
			}
			box(g, 10, 1.8, 0.3, 4, 2.7, 0.6, cream, 'Broken image block');
			text(g, '[ X ]', 10, 1.8, 0.66, 3, 1, '#7c8585');
			box(g, 10, -0.6, 0.4, 5, 0.16, 1.8, ink, 'Horizontal rule ledge');
			const book = box(g, -9.5, -0.5, 0.8, 4.5, 0.35, 3, purple, 'Guestbook spine');
			book.rotation.x = 0.25;
			for (const side of [-1, 1]) {
				const page = box(
					g,
					-9.5 + side * 1.07,
					-0.23,
					0.8,
					2.1,
					0.08,
					2.8,
					cream,
					'Guestbook page'
				);
				page.rotation.z = side * 0.1;
			}
		}
		if (index === 3) {
			box(g, -10.8, 2.2, 0.2, 4.9, 5.2, 0.85, cream, 'Buddy list tower');
			text(g, 'BUDDY LIST', -10.8, 4.25, 0.67, 4.5, 0.65, '#f5ead1', '#5579a7');
			for (let i = 0; i < 4; i++) {
				box(g, -12.3, 3.2 - i * 0.8, 0.68, 0.27, 0.27, 0.2, green, 'Online status');
				text(g, ['SAGE', 'PURL', 'MOM', 'FROG'][i], -10.7, 3.2 - i * 0.8, 0.69, 2.7, 0.5);
			}
			box(g, 10.3, 1.7, 0.3, 3, 2, 2, purple, 'Mailbox');
			const lid = box(g, 10.3, 2.8, -0.5, 3.15, 0.15, 2.1, cream, 'Opening mailbox lid');
			animated.push({ object: lid, kind: 'lid', base: 0 });
			text(g, 'AWAY :(', 10.3, 4.1, 0.2, 4, 0.85, '#867095');
			box(g, 10.3, 4.1, 0, 4.2, 1, 0.3, cream, 'Away message sign');
			for (let i = 0; i < 2; i++) {
				box(g, 8 + i * 3, -0.35, 0.5, 2.6, 0.9, 0.45, i ? green : cream, 'Chat bubble');
				text(g, i ? 'brb' : 'u there?', 8 + i * 3, -0.35, 0.75, 2.4, 0.5);
			}
			for (let i = 0; i < 3; i++)
				box(g, 12 + i * 0.7, 7.4, 0.2, 0.6, 0.6, 0.35, cream, 'Window button');
		}
		if (index === 4) {
			box(g, -10.3, 3.1, 0.2, 5.5, 1.25, 2.3, purple, 'Search box tunnel');
			box(g, -10.3, 3.1, 1.4, 4.8, 0.78, 0.05, cream, 'Search field');
			text(g, 'SEARCH', -10.3, 3.1, 1.45, 4, 0.6);
			const ring = mesh(
				g,
				new THREE.TorusGeometry(0.65, 0.16, 6, 12),
				gold,
				-8.1,
				1.4,
				1,
				'Magnifying glass'
			);
			ring.rotation.y = 0.25;
			const handle = box(g, -7.5, 0.6, 1, 0.23, 1.2, 0.23, gold, 'Magnifier handle');
			handle.rotation.z = 0.5;
			for (let i = 0; i < 3; i++) {
				box(g, -11.3, 1.1 - i * 0.9, 0.1, 3.3, 0.18, 1.6, cream, 'Tab shelf');
				text(g, ['WEB', 'IMAGES', 'NEWS'][i], -11.3, 1.4 - i * 0.9, 0.94, 2.6, 0.42);
			}
			for (let i = 0; i < 3; i++) {
				const shutter = box(
					g,
					9 + i * 1.15,
					3,
					0.4,
					1.1,
					2.1,
					0.2,
					i % 2 ? purple : gold,
					'Banner ad shutter'
				);
				animated.push({ object: shutter, kind: 'sway', base: i });
			}
			for (let i = 0; i < 2; i++) {
				box(g, 10.3, 0.7 - i * 1.15, 0, 4, 1, 2, cream, 'Folder drawer');
				box(g, 10.3, 0.7 - i * 1.15, 1.1, 0.8, 0.18, 0.2, ink, 'Drawer handle');
			}
		}
		if (index === 5) {
			for (const x of [-12.7, 13.7]) box(g, x, 3.4, -1, 0.2, 7.7, 0.7, purple, 'XP browser frame');
			box(g, -10, -0.7, 0.8, 4, 1, 1.4, green, 'Start button platform');
			text(g, 'start', -10, -0.7, 1.52, 3.3, 0.7, '#f5efd7', '#7f9d63');
			box(g, 10.5, 3.1, 0.2, 5, 0.8, 1.3, cream, 'Download progress trough');
			box(g, 9.8, 3.1, 0.94, 3.2, 0.4, 0.08, green, 'Download progress fill');
			const bin = mesh(
				g,
				new THREE.CylinderGeometry(0.85, 0.7, 1.8, 8, 1, true),
				purple,
				10.6,
				0.5,
				0.7,
				'Recycle bin'
			);
			bin.rotation.x = 0.1;
			box(g, 7.7, 0.1, 0.2, 0.16, 2.7, 0.16, ink, 'CD spindle');
			for (let i = 0; i < 4; i++)
				mesh(
					g,
					new THREE.CylinderGeometry(0.8, 0.8, 0.11, 12),
					cream,
					7.7,
					-0.6 + i * 0.3,
					0.2,
					'CD disc'
				);
		}
		if (index === 6) {
			box(g, -10, 3, 0.8, 4.2, 1.6, 1.3, gold, 'PLAY button');
			text(g, 'PLAY', -10, 3, 1.48, 3.5, 1, '#66556e', '#e8c981');
			box(g, -9, -0.6, 0.7, 6, 0.55, 2, ink, 'Loading bar bridge');
			for (let i = 0; i < 5; i++)
				box(g, -11 + i * 0.85, -0.5, 1.76, 0.72, 0.28, 0.08, green, 'Loading segment');
			for (let i = 0; i < 3; i++) {
				const token = mesh(
					g,
					new THREE.CylinderGeometry(0.48, 0.48, 0.17, 8),
					gold,
					8.2 + i * 1.3,
					3.1,
					1,
					'Game token'
				);
				token.rotation.x = Math.PI / 2;
				animated.push({ object: token, kind: 'coin', base: 0 });
			}
			text(g, '999999', 10.2, 1.3, 0.5, 4, 0.9, '#eed298', '#554d69');
			box(g, 10.2, 1.3, 0.1, 4.3, 1.2, 0.7, purple, 'Spring score digits');
			const mallet = new THREE.Group();
			mallet.name = 'Cartoon mallet';
			g.add(mallet);
			mallet.position.set(11.5, -0.25, 1);
			box(mallet, 0, 0, 0, 0.3, 2, 0.3, cream, 'Mallet handle');
			mesh(
				mallet,
				new THREE.CylinderGeometry(0.65, 0.65, 1.7, 8),
				red,
				0,
				1,
				0,
				'Mallet head'
			).rotation.z = Math.PI / 2;
			mallet.rotation.z = -0.6;
		}
		if (index === 7) {
			for (let i = 0; i < 8; i++) {
				const x = 8.3 + (i % 4) * 1.9,
					y = 3.55 - Math.floor(i / 4) * 2.95;
				box(g, x, y, 0.3, 1.6, 1.7, 0.7, purple, 'Top eight friend frame');
				box(g, x, y, 0.68, 1.35, 1.45, 0.06, i % 2 ? green : cream, 'Recessed friend portrait');
				catPicture(g, x, y, 0.73, 1.25, 1.25);
			}
			box(g, -10, 1.1, 0.3, 5.3, 1.3, 1, purple, 'Music player');
			text(g, '<<  >  >>', -10, 1.1, 0.85, 4.5, 0.7);
			for (const x of [-12.6, -7.4]) {
				box(g, x, 2.7, 0.3, 1.1, 2.4, 1, cream, 'Speaker cabinet');
				const speaker = mesh(
					g,
					new THREE.CylinderGeometry(0.4, 0.4, 0.16, 8),
					ink,
					x,
					2.8,
					0.9,
					'Speaker cone'
				);
				speaker.rotation.x = Math.PI / 2;
			}
			const charm = mesh(g, new THREE.IcosahedronGeometry(0.6, 0), gold, -10, 4, 0.8, 'Mood charm');
			animated.push({ object: charm, kind: 'rotate', base: 0 });
			box(g, 10, -1.45, 0.2, 5, 0.45, 1, purple, 'Profile panel');
			text(g, 'ADD FRIEND', 10, -1.45, 0.73, 4, 0.35);
		}
		if (index === 9) {
			for (let i = 0; i < 3; i++) {
				const x = i % 2 ? -10 : 10,
					y = 4 - i * 1.7;
				box(g, x, y, 0.15, 5.4, 1.1, 1.6, cream, 'Nested quote box balcony');
				text(g, i ? 'RE: RE: HELP' : '[ QUOTE ]', x, y, 0.98, 4.9, 0.65, '#607993');
			}
			box(g, -10.4, 3.8, 0.5, 2.2, 2.2, 0.5, purple, 'Avatar frame');
			text(g, ':3', -10.4, 3.8, 0.8, 1.7, 1.2);
			text(g, 'POSTS: 0042', -10.2, 1.8, 0.7, 4.8, 0.6);
			box(g, -10.2, 1.8, 0.25, 5, 0.8, 0.8, cream, 'Post count digits');
			box(g, -9.9, -0.4, 0.2, 5.5, 0.8, 0.6, purple, 'Signature banner');
			text(g, '~ epic signature ~', -9.9, -0.4, 0.55, 5.1, 0.5);
			box(g, 11.8, 2.1, 0.8, 1.5, 1.5, 0.65, gold, 'Thread lock padlock');
			mesh(
				g,
				new THREE.TorusGeometry(0.58, 0.16, 6, 10, Math.PI),
				ink,
				11.8,
				2.8,
				0.8,
				'Padlock shackle'
			);
		}
		if (index === 10) {
			for (const x of [-5.2, 5.2]) box(g, x, 3, -1, 0.3, 9, 0.6, ink, 'Phone doorway side');
			box(g, 0, 7.5, -1, 10.7, 0.3, 0.6, ink, 'Phone doorway top');
			box(g, -10.5, 3.4, 0.2, 5.2, 1.4, 0.8, cream, 'Notification drawer');
			text(g, 'NEW PHOTO', -10.5, 3.4, 0.65, 4.5, 0.7);
			for (let i = 0; i < 6; i++)
				box(
					g,
					-12 + (i % 3) * 1.5,
					1.4 - Math.floor(i / 3) * 1.5,
					0.5,
					1.15,
					1.15,
					0.55,
					[purple, green, gold][i % 3],
					'App icon tile'
				);
			for (let i = 0; i < 3; i++) {
				const card = box(
					g,
					8.4 + i * 1.3,
					2.7 + i * 0.2,
					0.4,
					2.1,
					2.8,
					0.25,
					[purple, green, gold][i],
					'Photo filter carousel card'
				);
				card.rotation.y = (i - 1) * 0.3;
				catPicture(card, 0, 0, 0.14, 1.95, 1.95);
			}
			const lens = mesh(
				g,
				new THREE.CylinderGeometry(0.85, 1, 0.5, 10),
				ink,
				10,
				0,
				1,
				'Camera lens'
			);
			lens.rotation.x = Math.PI / 2;
		}
		if (index === 11) {
			for (const side of [-1, 1]) {
				box(g, side * 10.3, 2, 0.1, 4.8, 6.3, 0.45, ink, 'Video card conveyor');
				for (let i = 0; i < 3; i++) {
					const card = box(
						g,
						side * 10.3,
						4 - i * 1.8,
						0.6,
						4.3,
						1.5,
						0.55,
						i % 2 ? purple : green,
						'Recommended video card'
					);
					catPicture(card, 0, 0, 0.29, 2.1, 1.4);
					animated.push({ object: card, kind: 'feed', base: 4 - i * 1.8 });
				}
			}
			const ring = mesh(
				g,
				new THREE.TorusGeometry(0.7, 0.14, 5, 10, Math.PI * 1.6),
				cream,
				10.3,
				-0.5,
				1.2,
				'Looping loading ring'
			);
			animated.push({ object: ring, kind: 'coin', base: 0 });
			text(g, '99+', -8.5, 5, 0.7, 1.8, 0.8, '#f9eacb', '#b96d76');
			box(g, -8.5, 5, 0.4, 2, 1, 0.5, red, 'Notification counter');
			for (const x of [-12.8, 12.8]) box(g, x, 1.5, 1, 1.1, 1.4, 0.7, gold, 'Reaction button');
			for (const side of [-1, 1]) {
				const rail = box(
					g,
					side * 7,
					5.4,
					-0.4,
					0.12,
					3,
					0.12,
					purple,
					'Branching recommendation track'
				);
				rail.rotation.z = side * 0.8;
			}
		}
		if (index === 12) {
			box(g, 0, -0.9, 0.1, 10, 1, 1.5, cream, 'Prompt box platform');
			text(g, 'MESSAGE THE INTERNET...', 0, -0.9, 0.87, 8.9, 0.6);
			for (let i = 0; i < 3; i++) {
				const bubble = box(
					g,
					-10,
					1 + i * 1.5,
					0.5,
					4.4,
					1.1,
					0.7,
					i % 2 ? green : purple,
					'Rising chat bubble'
				);
				animated.push({ object: bubble, kind: 'float', base: 1 + i * 1.5 });
			}
			box(g, 10, 2.4, 0.3, 4.2, 3, 2, purple, 'Generation machine');
			text(g, 'GENERATING', 10, 3.1, 1.35, 3.7, 0.7);
			box(g, 10, 1.8, 1.37, 3.4, 0.18, 0.1, ink, 'Image card printer slot');
			const sheet = box(g, 10, 0.7, 1.5, 2.6, 1.7, 0.12, cream, 'Printed image card');
			sheet.rotation.x = 0.2;
			catPicture(sheet, 0, 0, 0.07, 1.8, 1.5);
			const odd = mesh(
				g,
				new THREE.IcosahedronGeometry(0.9, 0),
				green,
				8.2,
				4.8,
				0.9,
				'Lopsided generated object'
			);
			odd.scale.set(1.4, 0.8, 1);
			animated.push({ object: odd, kind: 'rotate', base: 0 });
			const cup = mesh(
				g,
				new THREE.CylinderGeometry(0.6, 0.38, 0.85, 5),
				gold,
				11.1,
				4.8,
				0.9,
				'Generated three-handled cup'
			);
			cup.rotation.z = -0.22;
			for (const [x, y] of [
				[-0.65, 0],
				[0.65, 0.2],
				[0.45, -0.45]
			])
				mesh(
					cup,
					new THREE.TorusGeometry(0.28, 0.1, 4, 6),
					cream,
					x,
					y,
					0,
					'Extra generated handle'
				);
			animated.push({ object: cup, kind: 'float', base: 4.8 });
		}
		if (index === 13) {
			for (const x of [-13, 13]) box(g, x, 3.3, -1, 0.15, 8.7, 0.5, purple, 'Empty tab frame');
			box(g, 0, 7.7, -1, 26, 0.15, 0.5, purple, 'Empty tab header');
			for (let i = 0; i < 5; i++) {
				const chain = mesh(
					g,
					new THREE.TorusGeometry(0.4, 0.09, 5, 8),
					cream,
					-11 + i * 0.7,
					2.7 - i * 0.5,
					0.4,
					'Disconnected hyperlink chain'
				);
				chain.rotation.y = i % 2 ? 1 : 0;
			}
			const satellite = mesh(
				g,
				new THREE.BoxGeometry(1.2, 1.3, 1),
				cream,
				10,
				3,
				0.2,
				'Satellite body'
			);
			for (const side of [-1, 1])
				box(g, 10 + side * 1.9, 3, 0.2, 2.2, 1.5, 0.13, purple, 'Satellite solar panel');
			mesh(g, new THREE.ConeGeometry(0.8, 0.5, 8, 1, true), gold, 10, 4.1, 0.2, 'Satellite dish');
			satellite.rotation.z = 0.2;
			for (let i = 0; i < 3; i++) {
				const fragment = box(
					g,
					-10 + i * 0.9,
					-0.2 + i * 0.4,
					0.5,
					1.2,
					0.7,
					0.3,
					[green, gold, purple][i],
					'Old button fragment'
				);
				fragment.rotation.z = i * 0.3;
			}
			const cursor = box(g, 9, -0.2, 0.7, 0.4, 1, 0.4, gold, 'Final blinking cursor');
			animated.push({ object: cursor, kind: 'blink', base: 0 });
		}

		return g;
	});
	const loader = new GLTFLoader();
	const addModel = (
		index: number,
		file: string,
		x: number,
		y: number,
		z: number,
		size: number,
		replace: string[]
	) => {
		loader.load(
			'/models/internet/' + file + '.glb',
			(gltf) => {
				const object = gltf.scene;
				object.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						geometries.push(child.geometry);
						const mats = Array.isArray(child.material) ? child.material : [child.material];
						mats.forEach((m) => {
							materials.push(m);
							if (m instanceof THREE.MeshStandardMaterial) {
								m.metalness = Math.min(m.metalness, 0.06);
								m.roughness = Math.max(m.roughness, 0.85);
							}
							if ('map' in m && m.map) textures.push(m.map as THREE.Texture);
						});
					}
				});
				if (disposed) {
					object.traverse((child) => {
						if (child instanceof THREE.Mesh) {
							child.geometry.dispose();
							const mats = Array.isArray(child.material) ? child.material : [child.material];
							mats.forEach((m) => {
								if ('map' in m && m.map) (m.map as THREE.Texture).dispose();
								m.dispose();
							});
						}
					});
					return;
				}
				const bounds = new THREE.Box3().setFromObject(object),
					dimensions = bounds.getSize(new THREE.Vector3()),
					center = bounds.getCenter(new THREE.Vector3());
				object.position.sub(center);
				const holder = new THREE.Group();
				holder.name = 'Sourced ' + file;
				holder.add(object);
				holder.scale.setScalar(size / Math.max(dimensions.x, dimensions.y, dimensions.z));
				holder.position.set(x, y, z);
				holder.rotation.y = -0.2;
				holder.rotation.x = 0.12;
				zones[index].children
					.filter((c) => replace.includes(c.name))
					.forEach((c) => zones[index].remove(c));
				zones[index].add(holder);
			},
			undefined,
			(error) =>
				console.warn('Environmental model retained its original geometry fallback:', file, error)
		);
	};
	addModel(8, 'cardboardBoxOpen', 11, 1.2, 0.5, 3.3, ['Purl cardboard box', 'Cardboard flap']);
	addModel(7, 'speaker', -12.6, 2.7, 0.3, 2.4, []);
	addModel(7, 'speaker', -7.4, 2.7, 0.3, 2.4, ['Speaker cabinet', 'Speaker cone']);
	addModel(13, 'satelliteDish', 10, 3, 0.3, 3.8, ['Satellite dish']);
	return {
		root,
		zones,
		animate(time: number, calm: boolean) {
			for (const a of animated) {
				if (a.kind === 'blink') a.object.visible = calm || Math.floor(time * 2 + a.base) % 3 !== 0;
				if (a.kind === 'lid')
					a.object.rotation.x = calm ? -0.2 : -0.25 - Math.max(0, Math.sin(time * 0.7)) * 0.65;
				if (a.kind === 'coin') a.object.rotation.z = calm ? 0 : time * 0.5;
				if (a.kind === 'float')
					a.object.position.y = a.base + (calm ? 0 : Math.sin(time * 0.8) * 0.15);
				if (a.kind === 'feed')
					a.object.position.y = a.base + (calm ? 0 : Math.sin(time * 0.4) * 0.3);
				if (a.kind === 'rotate') a.object.rotation.y = calm ? 0 : time * 0.3;
				if (a.kind === 'sway') a.object.rotation.y = calm ? 0 : Math.sin(time * 0.8) * 0.4;
				if (a.kind === 'scrub') a.object.position.x = a.base + (calm ? 0 : (time * 0.2) % 8);
			}
		},
		dispose() {
			disposed = true;
			geometries.forEach((g) => g.dispose());
			materials.forEach((m) => m.dispose());
			textures.forEach((t) => t.dispose());
		}
	};
}

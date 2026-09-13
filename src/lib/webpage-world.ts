import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CAT_CLIPS } from './cat-media';
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
	let pictureIndex = 0;
	const catMaterials = CAT_CLIPS.map((clip) => {
		const texture = new THREE.TextureLoader().load(clip.thumbnail, (loaded) => {
			if (disposed) loaded.dispose();
		});
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.LinearFilter;
		textures.push(texture);
		const material = new THREE.MeshBasicMaterial({ map: texture });
		materials.push(material);
		return material;
	});
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
			catMaterials[pictureIndex++ % catMaterials.length],
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

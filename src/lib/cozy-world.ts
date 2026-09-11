import * as THREE from 'three';
import { INTERNET_ERAS } from './internet-era';
import { ERA_HEIGHT } from './era-journey';
import { eraArtAssets } from './era-art-assets';

export const eraWorlds = [
	['BULLETIN GROVE', 0xb9cab0, 0x8eaa80, 0xcfaa81],
	['HOMEPAGE HOLLOW', 0xc9d8bc, 0x9ab783, 0xd9a28f],
	['GEOCITIES GARDEN', 0xc9c5dc, 0xa9b785, 0xc792a3],
	['YOU HAVE MAIL', 0xb8cfdb, 0x9bb4a3, 0xe0b986],
	['BROWSER TOWN', 0xd9cfb6, 0xa3b596, 0xb19cb8],
	['DESKTOP MEADOW', 0xb7d6db, 0x93b77c, 0xd9c79a],
	['ARCADE CAMPSITE', 0xc7c3d6, 0xa5bba0, 0xc99491],
	['PROFILE PICNIC', 0xdcc7d2, 0xacba93, 0xa397ba],
	['VIDEO VILLAGE', 0xd6cfbd, 0x96b1a2, 0xc69a84],
	['POCKET PARK', 0xbdd2ce, 0xa7bd99, 0xa5b3c4],
	['CLOUD GARDENS', 0xcad9df, 0xa9bdb0, 0xa5a3c7],
	['ALGORITHM ORCHARD', 0xd7cbaa, 0xacb18b, 0xc7a38c],
	['ODD LITTLE FACTORY', 0xd8c9d3, 0xb0bc9e, 0xbba2b8],
	['STARLIGHT LOOKOUT', 0x929bb6, 0x9ba5b4, 0xc2b4ce]
] as const;

/** Fourteen connected, authored low-poly islands; one camera travels between them. */
export function createCozyWorld() {
	const root = new THREE.Group();
	const materials: THREE.Material[] = [];
	const geometries: THREE.BufferGeometry[] = [];
	const textures: THREE.Texture[] = [];
	const material = (color: number) => {
		const m = new THREE.MeshLambertMaterial({ color, flatShading: true });
		materials.push(m);
		return m;
	};
	const wood = material(0x94735c),
		cream = material(0xf5e5c5),
		ink = material(0x626b79);
	const leaves = [material(0x91ad83), material(0xafbe8b), material(0x7f9e90)];
	const mesh = (
		group: THREE.Group,
		geometry: THREE.BufferGeometry,
		mat: THREE.Material,
		x: number,
		y: number,
		z: number
	) => {
		geometries.push(geometry);
		const object = new THREE.Mesh(geometry, mat);
		object.position.set(x, y, z);
		group.add(object);
		return object;
	};
	const box = (
		g: THREE.Group,
		x: number,
		y: number,
		z: number,
		w: number,
		h: number,
		d: number,
		m: THREE.Material
	) => mesh(g, new THREE.BoxGeometry(w, h, d), m, x, y, z);
	const tree = (g: THREE.Group, x: number, z: number, n: number) => {
		box(g, x, -0.8, z, 0.35, 2.8, 0.35, wood);
		mesh(g, new THREE.IcosahedronGeometry(1.45, 0), leaves[n % 3], x, 1.2, z).scale.set(1, 1.25, 1);
	};
	const house = (g: THREE.Group, x: number, z: number, m: THREE.Material) => {
		box(g, x, -0.25, z, 3, 3.5, 2.6, cream);
		const roof = mesh(g, new THREE.ConeGeometry(2.65, 1.7, 4), m, x, 2.3, z);
		roof.rotation.y = Math.PI / 4;
		box(g, x, -0.85, z + 1.33, 0.85, 2.2, 0.08, wood);
		for (const side of [-1, 1]) box(g, x + side * 0.95, 0.2, z + 1.35, 0.5, 0.6, 0.1, ink);
	};
	const terminal = (g: THREE.Group, x: number, z: number, m: THREE.Material, tall = false) => {
		box(g, x, -0.5, z, 2.3, tall ? 4.4 : 2.8, 1.5, m);
		box(g, x, tall ? 0.6 : -0.1, z + 0.8, 1.85, 1.5, 0.12, ink);
		box(g, x, tall ? -0.7 : -1.2, z + 1, 2.15, 0.25, 1.2, cream);
		box(g, x - 0.45, tall ? 0.6 : -0.1, z + 0.89, 0.7, 0.12, 0.02, cream);
	};
	const zones = INTERNET_ERAS.map((era, index) => {
		const g = new THREE.Group();
		g.name = era;
		g.position.y = index * ERA_HEIGHT;
		root.add(g);
		const [, , grassColor, accentColor] = eraWorlds[index];
		const grass = material(grassColor),
			accent = material(accentColor);
		const island = mesh(g, new THREE.CylinderGeometry(11, 8.7, 2.4, 9), wood, 0, -4, -1);
		island.scale.z = 0.72;
		mesh(g, new THREE.CylinderGeometry(11.1, 11, 0.3, 9), grass, 0, -2.65, -1).scale.z = 0.72;
		// Pale path through the center keeps the hero silhouette easy to read.
		box(g, 0, -2.45, 0, 4.6, 0.12, 8, cream);
		for (let t = 0; t < 5; t++)
			tree(g, (t % 2 ? -1 : 1) * (8 + t * 0.35), -4 + (t % 3) * 2.2, t + index);
		for (const side of [-1, 1]) {
			box(g, side * 10, 20, -4, 0.12, 48, 0.12, wood);
			for (let rung = 0; rung < 36; rung++)
				box(g, side * 10, -2 + rung * 1.3, -3.95, 0.65, 0.12, 0.2, cream);
		}

		// Each silhouette carries the period before the player reads a label.
		const disk = (x: number) => {
			box(g, x, 0, -1, 3.2, 3.4, 0.45, ink);
			box(g, x, 1, -0.75, 1.8, 1, 0.08, cream);
			box(g, x, -0.7, -0.75, 2.4, 1.2, 0.08, accent);
		};
		const screen = (x: number, w: number, h: number, m = accent) => {
			box(g, x, 0.1, -2, w, h, 0.65, m);
			box(g, x, 0.1, -1.65, w - 0.4, h - 0.65, 0.1, ink);
			box(g, x, -2, -2, 0.3, 1, 0.3, wood);
		};
		switch (index) {
			case 0:
				terminal(g, -6, -2, cream);
				disk(6);
				box(g, -6, -1.5, 0, 3, 0.5, 1, cream);
				for (let n = 0; n < 5; n++) box(g, -7 + n * 0.4, -1.48, 0.55, 0.15, 0.12, 0.06, leaves[0]);
				break;
			case 1:
				house(g, -6, -2, accent);
				box(g, 6, -0.5, -1, 3.6, 0.3, 2.4, wood);
				box(g, 5.2, -0.2, -1, 1.5, 0.15, 2, cream);
				box(g, 6.8, -0.2, -1, 1.5, 0.15, 2, cream);
				for (let n = 0; n < 4; n++) box(g, 6, -0.08, -1.65 + n * 0.4, 2.5, 0.05, 0.05, ink);
				break;
			case 2:
				house(g, -6, -2, accent);
				for (const x of [5, 7]) {
					mesh(g, new THREE.ConeGeometry(0.65, 1.6, 4), accent, x, -1.6, 0);
					box(g, x, -2.35, 0, 1.4, 0.15, 1.4, cream);
				}
				box(g, 6, 0, -2, 4, 0.9, 0.3, cream);
				for (let n = 0; n < 6; n++)
					box(g, 4.4 + n * 0.65, 0, -1.8, 0.3, 0.9, 0.05, ink).rotation.z = -0.35;
				break;
			case 3:
				for (const x of [-6, 6]) {
					box(g, x, -1.5, -1, 0.3, 2, 0.3, wood);
					box(g, x, 0.1, -1, 3, 2, 1.5, accent);
					box(g, x, 0.1, -0.2, 2.3, 1.2, 0.05, cream);
				}
				break;
			case 4:
				screen(-6, 4.3, 3.6);
				screen(6, 4.3, 3.6, cream);
				for (const x of [-6, 6]) box(g, x, 1.15, -1.55, 3.5, 0.45, 0.08, cream);
				break;
			case 5:
				terminal(g, -6, -2, cream);
				mesh(g, new THREE.CylinderGeometry(1.25, 1, 2.5, 6), accent, 6, -1, -1);
				for (let n = 0; n < 4; n++) box(g, 5.4 + n * 0.4, -0.9, 0.05, 0.12, 1.5, 0.08, cream);
				break;
			case 6:
				for (const x of [-6, 6]) {
					terminal(g, x, -2, accent, true);
					box(g, x, 2, -1.2, 2.3, 0.7, 0.2, cream);
					mesh(g, new THREE.SphereGeometry(0.18, 6, 4), wood, x - 0.6, -0.45, -0.3);
					box(g, x + 0.5, -0.65, -0.2, 0.25, 0.18, 0.25, leaves[0]);
				}
				break;
			case 7:
				screen(-6, 4.3, 4.4, cream);
				for (let n = 0; n < 8; n++)
					box(
						g,
						-7.2 + (n % 4) * 0.8,
						-0.9 + Math.floor(n / 4) * 0.8,
						-1.5,
						0.55,
						0.55,
						0.08,
						n % 2 ? accent : cream
					);
				for (const x of [5.3, 7.3]) {
					box(g, x, 0, -1, 1.4, 4, 1.3, wood);
					mesh(g, new THREE.CylinderGeometry(0.48, 0.48, 0.1, 8), ink, x, 0, -0.28).rotation.x =
						Math.PI / 2;
				}
				break;
			case 8:
				screen(-6, 4.6, 3.6, cream);
				screen(6, 4.6, 3.6, cream);
				for (const x of [-6, 6]) {
					mesh(g, new THREE.ConeGeometry(0.7, 0.18, 3), accent, x, 0.2, -1.4).rotation.x =
						Math.PI / 2;
					box(g, x, -1.25, -1.5, 3.7, 0.18, 0.1, accent);
				}
				break;
			case 9:
				for (const x of [-6, 6]) {
					screen(x, 2.8, 5.2, cream);
					for (let n = 0; n < 9; n++)
						box(
							g,
							x - 0.7 + (n % 3) * 0.7,
							-0.8 + Math.floor(n / 3) * 0.8,
							-1.5,
							0.5,
							0.5,
							0.08,
							n % 2 ? accent : leaves[0]
						);
				}
				break;
			case 10:
				for (const x of [-6, 6])
					for (let n = 0; n < 4; n++) {
						box(g, x, -1.6 + n * 1.1, -2, 2.7, 1, 1.7, cream);
						box(g, x + 0.8, -1.6 + n * 1.1, -1.1, 0.2, 0.2, 0.08, leaves[0]);
					}
				break;
			case 11:
				for (const x of [-6, 6]) {
					screen(x, 3.2, 5.4, cream);
					for (let n = 0; n < 3; n++)
						box(g, x, -1.3 + n * 1.4, -1.5, 2.5, 1, 0.08, n % 2 ? accent : leaves[1]);
				}
				break;
			case 12:
				for (const x of [-6, 6]) {
					box(g, x, -1.4, -2, 3, 2, 2, accent);
					box(g, x, 0.8, -2, 2.8, 2, 2, cream);
					for (const d of [-0.6, 0.6]) box(g, x + d, 1, -0.95, 0.4, 0.4, 0.1, ink);
					box(g, x, 2.3, -2, 0.2, 1, 0.2, wood);
					mesh(g, new THREE.IcosahedronGeometry(0.35, 0), accent, x, 2.9, -2);
				}
				break;
			case 13:
				for (const x of [-6, 6]) {
					box(g, x, -1, -2, 0.4, 3, 0.4, cream);
					const dish = mesh(g, new THREE.ConeGeometry(1.8, 0.7, 8, 1, true), accent, x, 1, -2);
					dish.rotation.z = x < 0 ? 0.7 : -0.7;
					mesh(g, new THREE.TorusGeometry(1.8, 0.12, 4, 12), cream, x, 2, -3);
				}
		}
		if (typeof document !== 'undefined') {
			if ([0, 4, 5, 6, 7, 8, 9, 11].includes(index)) {
				const face = document.createElement('canvas');
				face.width = 96;
				face.height = 72;
				const c = face.getContext('2d')!;
				c.imageSmoothingEnabled = false;
				c.fillStyle = index === 0 ? '#18392e' : index === 6 ? '#393c58' : '#ece8d3';
				c.fillRect(0, 0, 96, 72);
				c.font = '8px monospace';
				if (index === 0) {
					c.fillStyle = '#b8d98e';
					['SAGE BBS', 'CONNECT 2400', '1. MESSAGES', '2. FILES', 'C:> _'].forEach((line, n) =>
						c.fillText(line, 5, 12 + n * 12)
					);
				} else if (index === 5) {
					c.fillStyle = '#80bada';
					c.fillRect(0, 0, 96, 60);
					c.fillStyle = '#8ebc6b';
					c.fillRect(0, 35, 96, 25);
					c.fillRect(8, 29, 46, 10);
					c.fillStyle = '#436ca4';
					c.fillRect(0, 60, 96, 12);
					c.fillStyle = '#81ac69';
					c.fillRect(0, 60, 25, 12);
				} else if (index === 6) {
					c.fillStyle = '#e8c581';
					c.fillText('HIGH SCORE', 6, 12);
					const rows = ['00100100', '00011000', '00111100', '01111110', '11011011', '10000001'];
					rows.forEach((row, y) =>
						[...row].forEach((v, x) => {
							if (v === '1') c.fillRect(20 + x * 7, 23 + y * 6, 6, 5);
						})
					);
				} else {
					c.fillStyle = index === 7 ? '#b389a8' : '#6f8ea8';
					c.fillRect(0, 0, 96, 12);
					c.fillStyle = '#f5e9cb';
					c.fillRect(80, 3, 5, 5);
					c.fillRect(88, 3, 5, 5);
					if (index === 4) {
						c.fillStyle = '#7b6393';
						c.fillText('SEARCH THE WEB', 8, 30);
						c.strokeStyle = '#9aa49e';
						c.strokeRect(7, 39, 80, 13);
						c.fillStyle = '#748eab';
						c.fillRect(8, 60, 55, 2);
					}
					if (index === 7 || index === 9) {
						for (let n = 0; n < 8; n++) {
							c.fillStyle = ['#91b398', '#ba97b4', '#d3b37a'][n % 3];
							c.fillRect(6 + (n % 4) * 23, 20 + Math.floor(n / 4) * 25, 17, 19);
						}
					}
					if (index === 8) {
						c.fillStyle = '#719b97';
						c.fillRect(6, 16, 84, 38);
						c.fillStyle = '#f4e8c7';
						c.beginPath();
						c.moveTo(41, 22);
						c.lineTo(41, 47);
						c.lineTo(59, 35);
						c.fill();
						c.fillStyle = '#b77670';
						c.fillRect(6, 58, 61, 3);
						c.fillStyle = '#a99154';
						c.fillText('* * * * *', 10, 71);
					}
					if (index === 11) {
						for (let n = 0; n < 3; n++) {
							c.fillStyle = n % 2 ? '#b19bb7' : '#8caf9e';
							c.fillRect(5, 16 + n * 19, 62, 15);
							c.fillStyle = '#9d8573';
							c.fillRect(72, 20 + n * 19, 16, 3);
						}
					}
				}
				const tex = new THREE.CanvasTexture(face);
				tex.colorSpace = THREE.SRGBColorSpace;
				tex.magFilter = THREE.NearestFilter;
				tex.minFilter = THREE.NearestFilter;
				textures.push(tex);
				const mat = new THREE.MeshBasicMaterial({ map: tex });
				materials.push(mat);
				const terminalScreen = [0, 5, 6].includes(index);
				const w = terminalScreen
					? 1.7
					: index === 9
						? 2.3
						: index === 11
							? 2.7
							: index === 8
								? 4.1
								: 3.8;
				const h = terminalScreen
					? 1.35
					: index === 9
						? 4.45
						: index === 11
							? 4.65
							: index === 7
								? 3.65
								: 2.85;
				for (const x of [4, 6, 8, 9, 11].includes(index) ? [-6, 6] : [-6])
					mesh(
						g,
						new THREE.PlaneGeometry(w, h),
						mat,
						x,
						index === 6 ? 0.6 : terminalScreen ? -0.1 : 0.1,
						terminalScreen ? -1.09 : -1.49
					);
			}

			for (let n = 0; n < 2; n++) {
				const x = n === 0 ? -6 : 6;
				const tex = new THREE.TextureLoader().load(
					'/images/era-collection/' + eraArtAssets[index][n]
				);
				tex.colorSpace = THREE.SRGBColorSpace;
				tex.magFilter = THREE.NearestFilter;
				tex.minFilter = THREE.NearestFilter;
				textures.push(tex);
				const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
				materials.push(mat);
				box(g, x, 0.05, -1.6, 0.16, 5.3, 0.16, wood);
				box(g, x, 3.7, -1.4, 2, 2, 0.22, cream);
				mesh(g, new THREE.PlaneGeometry(1.65, 1.65), mat, x, 3.7, -1.26);
			}
		}

		// Little flowers and stones belong to the island, rather than floating HUD decorations.
		for (let i = 0; i < 12; i++) {
			const side = i % 2 ? -1 : 1,
				x = side * (3.3 + (i % 4) * 1.6),
				z = 1 + (i % 3) * 1.4;
			mesh(
				g,
				new THREE.IcosahedronGeometry(i % 3 === 0 ? 0.3 : 0.15, 0),
				i % 3 ? accent : cream,
				x,
				-2.3,
				z
			);
		}

		return g;
	});
	return {
		root,
		zones,
		dispose() {
			geometries.forEach((g) => g.dispose());
			materials.forEach((m) => m.dispose());
			textures.forEach((t) => t.dispose());
		}
	};
}

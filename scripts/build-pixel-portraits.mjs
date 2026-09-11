import { mkdirSync, writeFileSync } from 'node:fs';

// Original pixel drawings on a 64 × 64 grid. Every contour follows whole pixels;
// the palette and silhouettes are authored here, without filtering a painted source.
const colors = {
	ink: '#100d20',
	shadow: '#231931',
	chair: '#442951',
	trim: '#82709c',
	violet: '#513c85',
	hat: '#35285f',
	hatLight: '#6d53a1',
	band: '#b47ba9',
	gold: '#e9bc6d',
	cream: '#fce3a0',
	case: '#c2b39a',
	caseLight: '#e5d6b6',
	caseDark: '#867c71',
	glass: '#10252a',
	glassLight: '#203a3c',
	robe: '#334468',
	robeLight: '#4a5e84',
	cyan: '#80cfc2'
};
const path = (fill, d) => `<path fill="${colors[fill] ?? fill}" d="${d}"/>`;
const rect = (fill, x, y, w, h) =>
	`<rect fill="${colors[fill] ?? fill}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const moods = {
	neutral: { eyes: 'M22 31h7v3h-7z M36 31h7v3h-7z', mouth: 'M26 40h13v2H26z' },
	thinking: { eyes: 'M22 32h7v2h-7z M36 30h6v4h-6z', mouth: 'M31 40h7v2h-7z', mark: '?' },
	suspicious: {
		eyes: 'M22 32h7v2h-7z M36 31h7v3h-7z',
		mouth: 'M28 41h10v1H28z',
		brow: 'M21 29h4v1h5v2h-5v-1h-4z M35 31v-2h9v2z'
	},
	delighted: {
		eyes: 'M22 31h2v-2h4v2h2v3h-2v-2h-4v2h-2z M35 31h2v-2h4v2h2v3h-2v-2h-4v2h-2z',
		mouth: 'M26 39h14v3h-2v2h-10v-2h-2z',
		tint: '#80cfc2'
	},
	irritated: {
		eyes: 'M22 32h7v2h-7z M36 32h7v2h-7z',
		mouth: 'M27 41h12v2H27z',
		brow: 'M21 28h4v2h5v2h-5v-2h-4z M35 30h5v-2h4v2h-4v2h-5z',
		tint: '#f29b75'
	},
	shocked: { eyes: 'M23 28h5v8h-5z M37 28h5v8h-5z', mouth: 'M29 39h7v7h-7z', mark: '!' },
	smug: {
		eyes: 'M22 32h8v2h-8z M36 32h8v2h-8z',
		mouth: 'M26 40h11v-2h3v4h-3v1H26z',
		brow: 'M21 29h9v1h-9z M36 29h9v1h-9z'
	},
	defeated: {
		eyes: 'M22 34h7v2h-7z M36 34h7v2h-7z',
		mouth: 'M27 42h2v-2h9v2h2v2h-2v-2h-9v2h-2z',
		tint: '#9fa8bb'
	},
	forbidden: {
		eyes: 'M24 28h3v3h3v3h-3v3h-3v-3h-3v-3h3z M38 28h3v3h3v3h-3v3h-3v-3h-3v-3h3z',
		mouth: 'M25 40h16v2h-2v2H27v-2h-2z',
		tint: '#c5a1ee',
		mark: '*'
	}
};
mkdirSync('static/images/sage-pixel', { recursive: true });
for (const [mood, face] of Object.entries(moods)) {
	const tint = face.tint ?? colors.gold;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" shape-rendering="crispEdges"><title>Signal Sage, ${mood}</title>
${rect('ink', 0, 0, 64, 64)}
${path('shadow', 'M7 27h50v32H7z M14 17h36v42H14z')}
${path('trim', 'M8 26h8v28h-8z M49 26h8v28h-8z M18 16h29v7H18z')}
${path('chair', 'M9 28h6v25H9z M50 28h6v25h-6z M13 47h39v12H13z')}
${path('robe', 'M23 44h18v4h5v7h4v6H14v-6h5v-7h4z')}
${path('robeLight', 'M24 46h5v6h-5v5h-4v-7h4z M34 48h6v10h-6z')}
${path('violet', 'M29 46h5v13h-5z')}
${path('cyan', 'M11 30h2v18h-2z M52 30h2v18h-2z M18 60h29v2H18z')}
${path('ink', 'M17 22h30v2h3v21h-3v3H17v-3h-2V24h2z')}
${path('caseDark', 'M19 24h28v3h2v16h-3v4H19z')}
${path('case', 'M17 24h29v21H17z')}
${rect('caseLight', 18, 24, 27, 2)}
${rect('glass', 20, 27, 24, 16)}
${rect('glassLight', 21, 28, 22, 1)}
${rect('glassLight', 21, 29, 1, 12)}
${path(tint, face.eyes)}
${face.brow ? path(tint, face.brow) : ''}
${path(tint, face.mouth)}
${rect('cream', 39, 44, 3, 1)}${rect('caseDark', 22, 44, 10, 1)}
${path('ink', 'M12 22h7v-5h4v-5h4V7h4V3h9v4h-3v5h3v5h5v4h7v5H12z')}
${path('hat', 'M16 22h7v-5h4v-5h4V7h3V5h4v2h-3v5h3v5h4v5h7v2H16z')}
${path('violet', 'M25 18h3v-5h4V8h2v7h3v7H25z')}
${path('hatLight', 'M29 13h2V8h2v6h-2v4h-3v3h-2v-4h3z')}
${path('band', 'M21 21h23v2H21z')}
${path('gold', 'M35 15h2v-2h2v2h2v2h-2v2h-2v-2h-2z')}
${path('caseDark', 'M14 51h7v7h-7z M43 51h7v7h-7z')}
${path('caseLight', 'M14 50h5v2h2v4h-7v-2h-2v-2h2z M45 50h4v2h2v4h-7v-4h1z')}
${face.mark === '?' ? path('gold', 'M52 9h6v2h2v4h-2v2h-2v2h-2v-4h3v-4h-3v2h-2z M54 21h2v2h-2z') : ''}
${face.mark === '!' ? path('gold', 'M54 9h3v10h-3z M54 21h3v3h-3z') : ''}
${face.mark === '*' ? path('#c5a1ee', 'M54 9h2v3h3v2h-3v3h-2v-3h-3v-2h3z M6 17h2v2h2v2H8v2H6v-2H4v-2h2z') : ''}
</svg>`;
	writeFileSync(`static/images/sage-pixel/${mood}.svg`, svg);
}
console.log('Wrote nine original 64 × 64 pixel portraits.');

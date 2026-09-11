import { internetEraIndex } from './internet-era';

export const ERA_HEIGHT = 48;
export const ERA_DWELL_SECONDS = 12;
export const ERA_MERGE_SECONDS = 12;
export const eraExhibits = [
	[
		'1980s–1991',
		'DIAL-UP / BBS',
		'BBS • MODEMS • FLOPPY DISKS',
		'CONNECT 2400',
		'The sysop is out feeding the modem. Leave a message after the screech.'
	],
	[
		'1991–1995',
		'PERSONAL WEBPAGE',
		'HTML • GUESTBOOKS • WEB RINGS',
		'WELCOME TO MY HOMEPAGE',
		'You are visitor 000042. Please sign the guestbook. My cat checks it.'
	],
	[
		'1995–1999',
		'GEOCITIES',
		'UNDER CONSTRUCTION • GIFS • TILED SKIES',
		'THIS SITE IS UNDER CONSTRUCTION',
		'The little road crew has been working on this homepage since 1996.'
	],
	[
		'1997–2001',
		'YOU HAVE MAIL',
		'BUDDY LISTS • CHAT ROOMS • MAIL',
		'YOU HAVE ONE NEW MESSAGE',
		'xX_Sage_Xx: brb. someone picked up the telephone.'
	],
	[
		'1998–2002',
		'WEB PORTAL',
		'PORTALS • SEARCH • .COM EVERYTHING',
		'WELCOME TO THE PORTAL',
		'We bought a domain. The business plan is coming later.'
	],
	[
		'2001–2006',
		'WINDOWS XP',
		'BLUE TASKBARS • GREEN HILLS • DESKTOP PETS',
		'DESKTOP CLEANUP WIZARD',
		'These shortcuts have formed a small village. May we leave them alone?'
	],
	[
		'2002–2008',
		'FLASH ARCADE',
		'BROWSER GAMES • LOADING BARS • HIGH SCORES',
		'CLICK TO PLAY',
		'Loading: 99%. The last percent is where the wizard lives.'
	],
	[
		'2003–2009',
		'MYSPACE PROFILE',
		'TOP EIGHT • PROFILE SONGS • CUSTOM THEMES',
		'YOUR PROFILE SONG IS PLAYING',
		'Purl moved you out of her top eight. It was probably an accident.'
	],
	[
		'2005–2010',
		'CAT YOUTUBE',
		'VIDEO RESPONSES • FIVE STARS • 301 VIEWS',
		'VIDEO IS BUFFERING',
		'A fourteen-second cat video. An evening of anticipation.'
	],
	[
		'2000s',
		'THE FORUMS',
		'THREADS / QUOTES / SIGNATURES',
		'NEW REPLY TO YOUR THREAD',
		'Purl replied: have you tried turning the internet off and on?'
	],
	[
		'SMARTPHONE YEARS',
		'MOBILE FEED',
		'PHOTOS / APPS / NOTIFICATIONS',
		'NEW PHOTO FROM PURL',
		'Purl posted the same photo for the seventeenth time. It is still a good photo.'
	],
	[
		'2016–2022',
		'INFINITE SCROLL',
		'ENDLESS FEEDS • RECOMMENDATIONS • SHORT VIDEOS',
		'PICKED JUST FOR YOU',
		'You watched one frog. Here are thirty-seven more frogs.'
	],
	[
		'2022–NOW',
		'GENERATION STATION',
		'PROMPTS • CHATBOTS • SYNTHETIC EVERYTHING',
		'GENERATING SOMETHING',
		'The machine drew a cat with seven thumbs. Purl is reviewing it.'
	],
	[
		'BEYOND THE FEED',
		'BEYOND THE LAST WEBPAGE',
		'DEEP SPACE • QUIET SIGNALS • WHAT COMES NEXT',
		'A SIGNAL FROM FAR AWAY',
		'No ads out here. Just you, the stars, and one very lost modem.'
	]
] as const;

/** Travel visits adjacent eras and gives each a settled view, even after a large workflow jump. */
export class EraJourney {
	current: number;
	next: number;
	mix = 0;
	private elapsed = 0;
	private traveling = false;
	constructor(altitude: number) {
		this.current = this.next = internetEraIndex(altitude);
	}
	advance(delta: number, altitude: number, instant = false) {
		const target = internetEraIndex(altitude);
		if (instant) {
			this.current = this.next = target;
			this.mix = this.elapsed = 0;
			this.traveling = false;
			return;
		}
		this.elapsed += Math.min(delta, 0.1);
		if (!this.traveling) {
			if (target !== this.current && this.elapsed >= ERA_DWELL_SECONDS) {
				this.next = this.current + Math.sign(target - this.current);
				this.elapsed = 0;
				this.traveling = true;
			}
			return;
		}
		const t = Math.min(1, this.elapsed / ERA_MERGE_SECONDS);
		this.mix = t * t * (3 - 2 * t);
		if (t === 1) {
			this.current = this.next;
			this.mix = this.elapsed = 0;
			this.traveling = false;
		}
	}
}

/** Scenery advances at workflow milestones, never from word counts, budget edits or tag counts. */
export function projectSceneryAltitude(project: import('./project-state').ProjectSession): number {
	let era = 0;
	switch (project.stage) {
		case 'welcome':
			era = 0;
			break;
		case 'problem':
			era = 1;
			break;
		case 'preferences':
			era = 3;
			break;
		case 'research':
			era = 5;
			break;
		case 'questions':
			era = 6 + Math.min(2, Math.floor(project.interview.answers.length / 3));
			break;
		case 'concepts':
			era = project.featureWorkshop.status === 'confirmed' ? 10 : 9;
			break;
		case 'focused':
			era = project.finalization.plan ? 13 : project.finalization.research.result ? 12 : 11;
			break;
	}
	return (era + 0.5) / 14;
}

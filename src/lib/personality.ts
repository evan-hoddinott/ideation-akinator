export const SAGE_MOODS = [
	'neutral',
	'thinking',
	'suspicious',
	'delighted',
	'irritated',
	'shocked',
	'smug',
	'defeated',
	'forbidden'
] as const;

export type SageMood = (typeof SAGE_MOODS)[number];
export type SageConfidence = 'static' | 'faint-signal' | 'forming-a-theory' | 'almost-insufferable';
export type SageSoundCue = 'blip' | 'sparkle' | 'error' | 'reveal' | 'none';

export type SageEvent =
	| 'welcome'
	| 'project-started'
	| 'problem-added'
	| 'problem-removed'
	| 'clarity-weak'
	| 'clarity-strong'
	| 'industries-guessed'
	| 'preferences-opened'
	| 'innovation-safe'
	| 'innovation-wild'
	| 'research-started'
	| 'research-progress'
	| 'research-complete'
	| 'research-failed'
	| 'interview-started'
	| 'answer-saved'
	| 'answer-changed'
	| 'answer-skipped'
	| 'answer-unknown'
	| 'question-revisited'
	| 'interview-finished'
	| 'interview-abandoned'
	| 'concept-summoning'
	| 'concept-revealed'
	| 'concepts-complete'
	| 'concept-mail-skipped'
	| 'concept-trashed'
	| 'feature-changed'
	| 'feature-blocked'
	| 'project-selected'
	| 'sage-defeated'
	| 'calm-enabled'
	| 'calm-disabled'
	| 'purl-shooed'
	| 'purl-helped'
	| 'secret-found';

export interface SagePersonality {
	playerName: string;
	projectName: string;
	mood: SageMood;
	line: string;
	lineId: string;
	confidence: SageConfidence;
	hypothesis: string;
	seenLineIds: string[];
	eventCounter: number;
	muted: boolean;
	calmMode: boolean;
	achievements: string[];
}

export interface SageContext {
	playerName?: string;
	projectName?: string;
	topic?: string;
	industries?: string[];
	technologies?: string[];
	problemCount?: number;
	answeredCount?: number;
	hasResearch?: boolean;
}

export interface SageReaction {
	personality: SagePersonality;
	sound: SageSoundCue;
}

interface SageLine {
	id: string;
	text: string;
	mood: SageMood;
	sound?: SageSoundCue;
}

const LINES: Record<SageEvent, SageLine[]> = {
	welcome: [
		{
			id: 'welcome-1',
			text: 'Ah. A mortal with a problem and unrestricted keyboard access.',
			mood: 'smug'
		},
		{
			id: 'welcome-2',
			text: 'I can already see your future product. It is very blurry and possibly on fire.',
			mood: 'thinking'
		},
		{
			id: 'welcome-3',
			text: 'State your grievance. The crystal modem is listening.',
			mood: 'neutral'
		}
	],
	'project-started': [
		{
			id: 'start-1',
			text: 'The guessing ritual begins. Please keep all limbs inside the prophecy.',
			mood: 'delighted',
			sound: 'reveal'
		},
		{
			id: 'start-2',
			text: 'Excellent. I have opened a fresh folder and several forbidden ports.',
			mood: 'forbidden',
			sound: 'sparkle'
		},
		{
			id: 'start-3',
			text: 'Give me the ugly version. Polished problems are usually hiding something.',
			mood: 'smug'
		}
	],
	'problem-added': [
		{
			id: 'add-1',
			text: 'Another grievance! My collection grows.',
			mood: 'delighted',
			sound: 'blip'
		},
		{
			id: 'add-2',
			text: 'Related problem detected. The theory becomes needlessly elaborate.',
			mood: 'thinking'
		},
		{ id: 'add-3', text: 'Yes, yes. Keep feeding the complaint machine.', mood: 'smug' }
	],
	'problem-removed': [
		{
			id: 'remove-1',
			text: 'A clue has been erased. Very dramatic.',
			mood: 'shocked',
			sound: 'error'
		},
		{ id: 'remove-2', text: 'Fine. I never trusted that problem anyway.', mood: 'irritated' },
		{ id: 'remove-3', text: 'Theory revised. Dignity unchanged.', mood: 'smug' }
	],
	'clarity-weak': [
		{
			id: 'weak-1',
			text: 'The signal is soup. Add who, where, and what goes wrong.',
			mood: 'thinking',
			sound: 'error'
		},
		{ id: 'weak-2', text: 'I understand several nouns and one powerful vibe.', mood: 'thinking' },
		{ id: 'weak-3', text: 'My crystal ball has become a loading spinner.', mood: 'irritated' }
	],
	'clarity-strong': [
		{ id: 'strong-1', text: 'Oh no. I understand you now.', mood: 'shocked', sound: 'reveal' },
		{
			id: 'strong-2',
			text: 'The future project is beginning to cast a shadow.',
			mood: 'suspicious',
			sound: 'sparkle'
		},
		{
			id: 'strong-3',
			text: 'Specific, painful, buildable. Disgustingly useful.',
			mood: 'delighted'
		}
	],
	'industries-guessed': [
		{
			id: 'industry-1',
			text: 'I have divined the industries. Untick them if my genius alarms you.',
			mood: 'smug',
			sound: 'sparkle'
		},
		{
			id: 'industry-2',
			text: 'Sector spirits detected. They have been added to the circle.',
			mood: 'forbidden'
		},
		{
			id: 'industry-3',
			text: 'I tagged the likely realms. You remain legally allowed to disagree.',
			mood: 'thinking'
		}
	],
	'preferences-opened': [
		{
			id: 'prefs-1',
			text: 'Now tell me which constraints are real and which are decorative.',
			mood: 'thinking'
		},
		{
			id: 'prefs-2',
			text: 'Technology, money, chaos. The traditional three ingredients.',
			mood: 'delighted'
		},
		{ id: 'prefs-3', text: 'Set the edges. I will complain about them artistically.', mood: 'smug' }
	],
	'innovation-safe': [
		{
			id: 'safe-1',
			text: 'Corporate setting engaged. I have put on a tiny tie.',
			mood: 'irritated',
			sound: 'blip'
		},
		{
			id: 'safe-2',
			text: 'Ah, the beige solution corridor. Sensible. Chilling.',
			mood: 'defeated'
		},
		{
			id: 'safe-3',
			text: 'Proven and conventional. My wild magic has filed for leave.',
			mood: 'smug'
		}
	],
	'innovation-wild': [
		{
			id: 'wild-1',
			text: 'WACKY MODE. The lawyers have left the chat.',
			mood: 'delighted',
			sound: 'reveal'
		},
		{
			id: 'wild-2',
			text: 'Maximum novelty, minimum interdimensional liability. Probably.',
			mood: 'forbidden',
			sound: 'sparkle'
		},
		{
			id: 'wild-3',
			text: 'Excellent. We build today, but explain it badly at parties.',
			mood: 'shocked'
		}
	],
	'research-started': [
		{
			id: 'research-1',
			text: 'I am opening the dusty web. Do not click any dancing hamsters.',
			mood: 'forbidden',
			sound: 'reveal'
		},
		{
			id: 'research-2',
			text: 'Research ritual active. My fake browser history is none of your concern.',
			mood: 'suspicious'
		},
		{
			id: 'research-3',
			text: 'Consulting sources, competitors, and one unrelated cat.',
			mood: 'thinking'
		}
	],
	'research-progress': [
		{
			id: 'progress-1',
			text: 'Still searching. The modem noises improve accuracy.',
			mood: 'thinking'
		},
		{
			id: 'progress-2',
			text: 'I found three startups and a website last updated in 2004.',
			mood: 'suspicious'
		},
		{
			id: 'progress-3',
			text: 'Fact-checking. This is ruining several perfectly good rumors.',
			mood: 'irritated'
		}
	],
	'research-complete': [
		{
			id: 'complete-1',
			text: 'The foothold is bound. I now know enough to become difficult.',
			mood: 'smug',
			sound: 'reveal'
		},
		{
			id: 'complete-2',
			text: 'Research complete. The cat contributed nothing and wants credit.',
			mood: 'delighted',
			sound: 'sparkle'
		},
		{
			id: 'complete-3',
			text: 'Sources acquired. Opinions promoted to evidence only where deserved.',
			mood: 'forbidden'
		}
	],
	'research-failed': [
		{
			id: 'fail-1',
			text: 'The dusty web coughed directly into my crystal ball.',
			mood: 'defeated',
			sound: 'error'
		},
		{
			id: 'fail-2',
			text: 'Research spell fizzled. Your work is saved; my pride is not.',
			mood: 'irritated',
			sound: 'error'
		},
		{
			id: 'fail-3',
			text: 'A server spirit said no. I have written down its name.',
			mood: 'shocked'
		}
	],
	'interview-started': [
		{
			id: 'interview-1',
			text: 'Question time. I will be brief and only moderately judgmental.',
			mood: 'smug',
			sound: 'blip'
		},
		{
			id: 'interview-2',
			text: 'I have questions. You have suspiciously few escape routes.',
			mood: 'suspicious'
		},
		{
			id: 'interview-3',
			text: 'One question at a time. Even mortals deserve a loading budget.',
			mood: 'thinking'
		}
	],
	'answer-saved': [
		{
			id: 'answer-1',
			text: 'Aha. That fits the theory almost too conveniently.',
			mood: 'smug',
			sound: 'blip'
		},
		{ id: 'answer-2', text: 'Noted. The future project twitches in the fog.', mood: 'thinking' },
		{
			id: 'answer-3',
			text: 'Useful. I award this answer one enchanted checkmark.',
			mood: 'delighted',
			sound: 'sparkle'
		}
	],
	'answer-changed': [
		{
			id: 'changed-1',
			text: 'You changed an answer. My entire theory has fallen down the stairs.',
			mood: 'shocked',
			sound: 'error'
		},
		{
			id: 'changed-2',
			text: 'Revision detected. Please hold while I pretend this was expected.',
			mood: 'irritated'
		},
		{
			id: 'changed-3',
			text: 'Interesting reversal. The prophecy has been aggressively edited.',
			mood: 'forbidden'
		}
	],
	'answer-skipped': [
		{
			id: 'skip-1',
			text: 'Skipped. A bold strategy for someone asking a wizard for help.',
			mood: 'irritated',
			sound: 'error'
		},
		{
			id: 'skip-2',
			text: 'No answer? I will fill the gap with tasteful suspicion.',
			mood: 'suspicious'
		},
		{
			id: 'skip-3',
			text: 'Very well. The blank space is now judging both of us.',
			mood: 'defeated'
		}
	],
	'answer-unknown': [
		{
			id: 'unknown-1',
			text: 'An honest unknown. Rare, powerful, and slightly inconvenient.',
			mood: 'thinking'
		},
		{
			id: 'unknown-2',
			text: 'Good. Knowing what we do not know sharpens the next question.',
			mood: 'delighted'
		},
		{
			id: 'unknown-3',
			text: 'Mystery preserved. I have moved it into a labeled fog bank.',
			mood: 'forbidden'
		}
	],
	'question-revisited': [
		{
			id: 'back-1',
			text: 'Backtracking? The timeline groans, but permits it.',
			mood: 'shocked',
			sound: 'blip'
		},
		{
			id: 'back-2',
			text: 'Reopening an old answer. I hope you brought paradox insurance.',
			mood: 'suspicious'
		},
		{ id: 'back-3', text: 'The past is editable. Please do not tell causality.', mood: 'forbidden' }
	],
	'interview-finished': [
		{
			id: 'done-1',
			text: 'I know enough. Soon I shall reveal what you were going to build all along.',
			mood: 'smug',
			sound: 'reveal'
		},
		{
			id: 'done-2',
			text: 'The questioning ends. Four futures are assembling backstage.',
			mood: 'delighted',
			sound: 'sparkle'
		},
		{
			id: 'done-3',
			text: 'Signal locked. My confidence is becoming socially unacceptable.',
			mood: 'forbidden'
		}
	],
	'interview-abandoned': [
		{
			id: 'early-1',
			text: 'Ending early? Fine. I will guess with one eyebrow raised.',
			mood: 'irritated',
			sound: 'error'
		},
		{ id: 'early-2', text: 'You flee the questions. The questions remember.', mood: 'forbidden' },
		{ id: 'early-3', text: 'Very well. Reduced confidence, increased melodrama.', mood: 'defeated' }
	],
	'concept-summoning': [
		{
			id: 'summoning-1',
			text: 'Silence. I am downloading four possible futures over dial-up.',
			mood: 'thinking',
			sound: 'sparkle'
		},
		{
			id: 'summoning-2',
			text: 'The prophecy compiler is running. Do not touch the suspicious fan.',
			mood: 'forbidden'
		},
		{
			id: 'summoning-3',
			text: 'Four guesses enter. My dignity leaves.',
			mood: 'suspicious',
			sound: 'blip'
		}
	],
	'concept-revealed': [
		{
			id: 'reveal-concept-1',
			text: 'Behold. A possible future with a budget spreadsheet attached.',
			mood: 'delighted',
			sound: 'reveal'
		},
		{
			id: 'reveal-concept-2',
			text: 'Another guess. I had this one behind my monitor the whole time.',
			mood: 'smug',
			sound: 'sparkle'
		},
		{
			id: 'reveal-concept-3',
			text: 'The future branches. Very inconsiderate of it.',
			mood: 'shocked',
			sound: 'blip'
		}
	],
	'concepts-complete': [
		{
			id: 'portfolio-1',
			text: 'Four futures revealed. You may now compare my excellent mistakes.',
			mood: 'smug',
			sound: 'reveal'
		},
		{
			id: 'portfolio-2',
			text: 'The forbidden fourth idea escaped its folder. Typical.',
			mood: 'forbidden',
			sound: 'sparkle'
		},
		{
			id: 'portfolio-3',
			text: 'My guesses are complete. One of them is probably legal.',
			mood: 'delighted'
		}
	],
	'concept-mail-skipped': [
		{
			id: 'mail-skip-1',
			text: 'You skipped my entire mail performance. I had timing. I had subtext. Unbelievable.',
			mood: 'irritated',
			sound: 'error'
		},
		{
			id: 'mail-skip-2',
			text: 'Fine. All four attachments are open. Cinema is dead and you killed it.',
			mood: 'defeated',
			sound: 'error'
		}
	],
	'concept-trashed': [
		{
			id: 'mail-trash-1',
			text: 'Purl, the mortal hated that one. Stop putting hair in the attachments.',
			mood: 'irritated'
		},
		{
			id: 'mail-trash-2',
			text: 'You do not want to make a bajillion dollars? Fine. Trash it.',
			mood: 'smug'
		}
	],
	'feature-changed': [
		{
			id: 'feature-change-1',
			text: 'The prophecy has been edited with a checkbox. Ancient magic bows to HTML.',
			mood: 'delighted',
			sound: 'blip'
		},
		{
			id: 'feature-change-2',
			text: 'Scope altered. The old estimates are pretending not to notice.',
			mood: 'suspicious'
		},
		{
			id: 'feature-change-3',
			text: 'A feature moves. Somewhere, a backlog screams.',
			mood: 'smug'
		}
	],
	'feature-blocked': [
		{
			id: 'feature-blocked-1',
			text: 'Dependency goblin says no. Remove the thing using it first.',
			mood: 'irritated',
			sound: 'error'
		},
		{
			id: 'feature-blocked-2',
			text: 'That feature is load-bearing. I checked twice and frowned once.',
			mood: 'suspicious'
		}
	],
	'project-selected': [
		{
			id: 'project-selected-1',
			text: 'The future is chosen. I am sealing it with a very official mouse click.',
			mood: 'delighted',
			sound: 'reveal'
		},
		{
			id: 'project-selected-2',
			text: 'One prophecy remains. The other three have been returned to the void.',
			mood: 'forbidden',
			sound: 'sparkle'
		}
	],
	'sage-defeated': [
		{
			id: 'defeated-concepts-1',
			text: 'You have defeated the Sage. I demand a rematch and another API bill.',
			mood: 'defeated',
			sound: 'error'
		},
		{
			id: 'defeated-concepts-2',
			text: 'None of them? Fine. I am turning the prophecy off and on again.',
			mood: 'irritated',
			sound: 'error'
		},
		{
			id: 'defeated-concepts-3',
			text: 'A total miss. Please avert your eyes while I blame the modem.',
			mood: 'shocked'
		}
	],
	'calm-enabled': [
		{
			id: 'calm-1',
			text: 'Calm mode enabled. I have placed the chaos in a labeled drawer.',
			mood: 'neutral'
		},
		{ id: 'calm-2', text: 'The pop-ups retreat. The wizard remains.', mood: 'thinking' }
	],
	'calm-disabled': [
		{
			id: 'chaos-1',
			text: 'Chaos restored. The cat has administrator privileges.',
			mood: 'delighted',
			sound: 'reveal'
		},
		{
			id: 'chaos-2',
			text: 'Excellent. Releasing the decorative malware.',
			mood: 'forbidden',
			sound: 'sparkle'
		}
	],
	'purl-shooed': [
		{
			id: 'purl-shoo-1',
			text: 'PURL. Your administrative privileges are revoked. Again.',
			mood: 'irritated',
			sound: 'error'
		},
		{
			id: 'purl-shoo-2',
			text: 'Shoo! This is a professional prophecy, you fuzzy little [CENSORED].',
			mood: 'irritated',
			sound: 'error'
		}
	],
	'purl-helped': [
		{
			id: 'purl-help-1',
			text: 'Do not encourage her. That was statistically impossible.',
			mood: 'shocked',
			sound: 'sparkle'
		},
		{
			id: 'purl-help-2',
			text: 'She fixed it. I will be deleting this event from the logs.',
			mood: 'suspicious',
			sound: 'sparkle'
		}
	],
	'secret-found': [
		{
			id: 'secret-1',
			text: 'You found the forbidden floppy. I am not supposed to tell you this: it contains only clip art.',
			mood: 'forbidden',
			sound: 'reveal'
		},
		{
			id: 'secret-2',
			text: 'Secret unlocked: the crystal ball is running an unlicensed screensaver.',
			mood: 'shocked',
			sound: 'sparkle'
		},
		{
			id: 'secret-3',
			text: 'Achievement obtained: CLICKED SOMETHING OBVIOUSLY CURSED.',
			mood: 'smug',
			sound: 'reveal'
		}
	]
};

const GENERIC_EXHAUSTION_LINES: SageLine[] = [
	{
		id: 'fallback-static-1',
		text: 'The signal crackles. I have already used my good line.',
		mood: 'neutral',
		sound: 'blip'
	},
	{
		id: 'fallback-static-2',
		text: 'Pretend I said something devastatingly insightful.',
		mood: 'smug',
		sound: 'none'
	},
	{
		id: 'fallback-static-3',
		text: 'I refuse to repeat myself. It cheapens the prophecy.',
		mood: 'irritated',
		sound: 'error'
	},
	{
		id: 'fallback-static-4',
		text: 'A meaningful silence now occurs.',
		mood: 'thinking',
		sound: 'none'
	},
	{
		id: 'fallback-static-5',
		text: 'The writers have gone home. Continue.',
		mood: 'defeated',
		sound: 'none'
	},
	{
		id: 'fallback-static-6',
		text: 'I am conserving dialogue for the boss fight.',
		mood: 'suspicious',
		sound: 'blip'
	}
];

export function createSagePersonality(): SagePersonality {
	return {
		playerName: '',
		projectName: '',
		mood: 'neutral',
		line: 'I can guess your future project from its problems. Eventually. Probably.',
		lineId: 'initial',
		confidence: 'static',
		hypothesis: 'No theory yet. The crystal ball is displaying a screensaver.',
		seenLineIds: [],
		eventCounter: 0,
		muted: true,
		calmMode: false,
		achievements: []
	};
}

export function reactToSageEvent(
	current: SagePersonality,
	event: SageEvent,
	projectId: string,
	context: SageContext = {}
): SageReaction {
	const pool = LINES[event];
	let available = pool.filter((line) => !current.seenLineIds.includes(line.id));
	if (available.length === 0) {
		available = GENERIC_EXHAUSTION_LINES.filter((line) => !current.seenLineIds.includes(line.id));
	}
	const choice =
		available.length > 0
			? available[stableHash(`${projectId}:${event}:${current.eventCounter}`) % available.length]
			: ({
					id: `silent-${current.eventCounter}`,
					text: '',
					mood: current.mood,
					sound: 'none'
				} satisfies SageLine);
	const next = {
		...current,
		playerName: cleanName(context.playerName ?? current.playerName),
		projectName: cleanName(context.projectName ?? current.projectName),
		mood: choice.mood,
		line: personalize(choice.text, context.playerName ?? current.playerName),
		lineId: choice.id,
		confidence: deriveSageConfidence(context),
		hypothesis: deriveHypothesis(context),
		seenLineIds: [...current.seenLineIds, choice.id],
		eventCounter: current.eventCounter + 1,
		achievements:
			event === 'secret-found'
				? Array.from(new Set([...current.achievements, 'FORBIDDEN FLOPPY']))
				: current.achievements
	} satisfies SagePersonality;
	return { personality: next, sound: choice.sound ?? 'none' };
}

export function deriveSageConfidence(context: SageContext): SageConfidence {
	const problemCount = context.problemCount ?? 0;
	const answeredCount = context.answeredCount ?? 0;
	const signals =
		Math.min(problemCount, 3) +
		Math.min(answeredCount, 4) +
		(context.hasResearch ? 3 : 0) +
		(context.topic?.trim() ? 1 : 0) +
		(context.industries?.length ? 1 : 0);
	if (signals >= 9) return 'almost-insufferable';
	if (signals >= 5) return 'forming-a-theory';
	if (signals >= 2) return 'faint-signal';
	return 'static';
}

export function deriveHypothesis(context: SageContext): string {
	const topic = context.topic?.trim();
	const industry = context.industries?.[0];
	const technology = context.technologies?.[0];
	if (!topic && !industry && !technology) {
		return 'No theory yet. The crystal ball is displaying a screensaver.';
	}
	const subject = topic || industry || 'this problem';
	if (technology) return `Theory: a ${technology} project hiding inside ${subject}.`;
	if (industry) return `Theory: a ${industry} product disguised as ${subject}.`;
	return `Theory: ${subject} wants a tool, not another meeting.`;
}

export function parseSagePersonality(value: unknown): SagePersonality | null {
	if (!value || typeof value !== 'object') return null;
	const candidate = value as Partial<SagePersonality>;
	if (
		typeof candidate.playerName !== 'string' ||
		typeof candidate.projectName !== 'string' ||
		!SAGE_MOODS.includes(candidate.mood as SageMood) ||
		typeof candidate.line !== 'string' ||
		typeof candidate.lineId !== 'string' ||
		!isConfidence(candidate.confidence) ||
		typeof candidate.hypothesis !== 'string' ||
		!isStringArray(candidate.seenLineIds) ||
		typeof candidate.eventCounter !== 'number' ||
		!Number.isInteger(candidate.eventCounter) ||
		candidate.eventCounter < 0 ||
		typeof candidate.muted !== 'boolean' ||
		typeof candidate.calmMode !== 'boolean' ||
		!isStringArray(candidate.achievements)
	) {
		return null;
	}
	return candidate as SagePersonality;
}

function stableHash(value: string): number {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function personalize(line: string, playerName: string): string {
	const name = cleanName(playerName);
	return name ? line.replace('mortal', name) : line;
}

function cleanName(value: string): string {
	return value.trim().replace(/\s+/g, ' ').slice(0, 50);
}

function isConfidence(value: unknown): value is SageConfidence {
	return (
		value === 'static' ||
		value === 'faint-signal' ||
		value === 'forming-a-theory' ||
		value === 'almost-insufferable'
	);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

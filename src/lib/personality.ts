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
	| 'final-plan-ready'
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
	'final-plan-ready': [
		{
			id: 'final-plan-ready-1',
			text: 'The final plan is saved. One print coming up. Nobody make eye contact with the paper tray.',
			mood: 'delighted',
			sound: 'reveal'
		}
	],
	welcome: [
		{
			id: 'welcome-1',
			text: 'Bring me one stubborn problem. I will research it, question you, and propose four ways to solve it.',
			mood: 'smug'
		},
		{
			id: 'welcome-2',
			text: 'I cannot read your mind yet. A specific problem usually fixes that.',
			mood: 'thinking'
		},
		{
			id: 'welcome-3',
			text: 'Start with what keeps going wrong. The polished project pitch can wait.',
			mood: 'neutral'
		}
	],
	'project-started': [
		{
			id: 'start-1',
			text: 'The project is saved in this browser. First, tell me what keeps going wrong.',
			mood: 'delighted',
			sound: 'reveal'
		},
		{
			id: 'start-2',
			text: 'Fresh project opened. Now give me the real problem, not the pitch-deck version.',
			mood: 'forbidden',
			sound: 'sparkle'
		},
		{
			id: 'start-3',
			text: 'Give me the ugly version. Who is affected, what happens, and why does it matter?',
			mood: 'smug'
		}
	],
	'problem-added': [
		{
			id: 'add-1',
			text: 'That problem is saved. Add another only if it belongs to the same situation.',
			mood: 'delighted',
			sound: 'blip'
		},
		{
			id: 'add-2',
			text: 'Another related problem helps. Unrelated problems deserve their own project.',
			mood: 'thinking'
		},
		{
			id: 'add-3',
			text: 'Clue saved. Continue when this problem set tells the whole story.',
			mood: 'smug'
		}
	],
	'problem-removed': [
		{
			id: 'remove-1',
			text: 'That problem was removed. I will build the theory from what remains.',
			mood: 'shocked',
			sound: 'error'
		},
		{
			id: 'remove-2',
			text: 'Problem removed. The remaining clues now carry the case.',
			mood: 'irritated'
		},
		{
			id: 'remove-3',
			text: 'Theory revised. Check that the remaining problems still describe one topic.',
			mood: 'smug'
		}
	],
	'clarity-weak': [
		{
			id: 'weak-1',
			text: 'The signal is soup. Add who, where, and what goes wrong.',
			mood: 'thinking',
			sound: 'error'
		},
		{
			id: 'weak-2',
			text: 'I have the topic, but not the pain. Add a person, a situation, and a consequence.',
			mood: 'thinking'
		},
		{
			id: 'weak-3',
			text: 'The signal is still fuzzy. One concrete example would rescue it.',
			mood: 'irritated'
		}
	],
	'clarity-strong': [
		{
			id: 'strong-1',
			text: 'Oh no. I understand you now. The problem is specific enough to research.',
			mood: 'shocked',
			sound: 'reveal'
		},
		{
			id: 'strong-2',
			text: 'Clear problem detected. I can now compare possible solutions against it.',
			mood: 'suspicious',
			sound: 'sparkle'
		},
		{
			id: 'strong-3',
			text: 'Specific, painful, and possible to test. Disgustingly useful.',
			mood: 'delighted'
		}
	],
	'industries-guessed': [
		{
			id: 'industry-1',
			text: 'I suggested likely industries. Remove any bad guesses and add anything I missed.',
			mood: 'smug',
			sound: 'sparkle'
		},
		{
			id: 'industry-2',
			text: 'Industry guesses added. These will narrow the research and concept generation.',
			mood: 'forbidden'
		},
		{
			id: 'industry-3',
			text: 'I tagged the likely industries. You remain legally allowed to disagree.',
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
			text: 'Now set the technology, originality, budget, and hard constraints for the ideas.',
			mood: 'delighted'
		},
		{
			id: 'prefs-3',
			text: 'Set the edges. Good constraints keep me from proposing expensive nonsense.',
			mood: 'smug'
		}
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
			text: 'Research started. I am checking competitors, prior attempts, evidence, and gaps.',
			mood: 'forbidden',
			sound: 'reveal'
		},
		{
			id: 'research-2',
			text: 'The search is running. You can watch the nonsense or skip the animation without stopping it.',
			mood: 'suspicious'
		},
		{
			id: 'research-3',
			text: 'I am consulting sources and competitors. The unrelated cat is decorative.',
			mood: 'thinking'
		}
	],
	'research-progress': [
		{
			id: 'progress-1',
			text: 'Still searching. I am separating useful evidence from very confident marketing copy.',
			mood: 'thinking'
		},
		{
			id: 'progress-2',
			text: 'The research is still running. Old attempts count too, especially the ones that failed.',
			mood: 'suspicious'
		},
		{
			id: 'progress-3',
			text: 'Fact-checking now. This is ruining several perfectly good rumors.',
			mood: 'irritated'
		}
	],
	'research-complete': [
		{
			id: 'complete-1',
			text: 'Research complete. The findings and their sources are ready for you to inspect.',
			mood: 'smug',
			sound: 'reveal'
		},
		{
			id: 'complete-2',
			text: 'Research complete. Next I will ask only the questions the evidence could not answer.',
			mood: 'delighted',
			sound: 'sparkle'
		},
		{
			id: 'complete-3',
			text: 'Sources acquired. Opinions were promoted to evidence only where deserved.',
			mood: 'forbidden'
		}
	],
	'research-failed': [
		{
			id: 'fail-1',
			text: 'The research request failed. Your problem and constraints are still saved.',
			mood: 'defeated',
			sound: 'error'
		},
		{
			id: 'fail-2',
			text: 'Research failed. Your work is saved, so you can check the constraints and try again.',
			mood: 'irritated',
			sound: 'error'
		},
		{
			id: 'fail-3',
			text: 'The research service said no. Nothing was erased, including my complaint.',
			mood: 'shocked'
		}
	],
	'interview-started': [
		{
			id: 'interview-1',
			text: 'Question time. I will ask one useful follow-up at a time and stop when the signal is clear.',
			mood: 'smug',
			sound: 'blip'
		},
		{
			id: 'interview-2',
			text: 'I have a few follow-up questions. You may skip one, say you do not know, or end early.',
			mood: 'suspicious'
		},
		{
			id: 'interview-3',
			text: 'One question at a time. Rough answers are enough, and you can revise the previous one.',
			mood: 'thinking'
		}
	],
	'answer-saved': [
		{
			id: 'answer-1',
			text: 'Answer saved. I will use it to narrow the next question and the final concepts.',
			mood: 'smug',
			sound: 'blip'
		},
		{
			id: 'answer-2',
			text: 'Noted. That answer narrows the kind of project that will fit.',
			mood: 'thinking'
		},
		{
			id: 'answer-3',
			text: 'Useful. One enchanted checkmark, and one fewer assumption for me to make.',
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
			text: 'Skipped. I will leave that uncertainty visible instead of inventing an answer.',
			mood: 'irritated',
			sound: 'error'
		},
		{
			id: 'skip-2',
			text: 'No answer recorded. The final concepts may carry a little more uncertainty here.',
			mood: 'suspicious'
		},
		{
			id: 'skip-3',
			text: 'Very well. I will keep the blank visible and move to the next useful question.',
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
			text: 'I know enough. Next I will generate four distinct project concepts for you to compare.',
			mood: 'smug',
			sound: 'reveal'
		},
		{
			id: 'done-2',
			text: 'The interview is complete. Four project concepts are assembling backstage.',
			mood: 'delighted',
			sound: 'sparkle'
		},
		{
			id: 'done-3',
			text: 'Signal locked. Your problem, research, constraints, and answers are ready for concept generation.',
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
			text: 'I am generating four different approaches, each tied to your evidence and constraints.',
			mood: 'thinking',
			sound: 'sparkle'
		},
		{
			id: 'summoning-2',
			text: 'The concept generator is running. Budgets, timelines, and source links are included.',
			mood: 'forbidden'
		},
		{
			id: 'summoning-3',
			text: 'Four guesses enter. You will compare them, edit the features, and choose one.',
			mood: 'suspicious',
			sound: 'blip'
		}
	],
	'concept-revealed': [
		{
			id: 'reveal-concept-1',
			text: 'One concept opened. Read its fit, budget, timeline, features, and evidence before moving on.',
			mood: 'delighted',
			sound: 'reveal'
		},
		{
			id: 'reveal-concept-2',
			text: 'Another concept opened. The differences matter more than my attachment filenames.',
			mood: 'smug',
			sound: 'sparkle'
		},
		{
			id: 'reveal-concept-3',
			text: 'Another branch revealed. Open all four before choosing which one to configure.',
			mood: 'shocked',
			sound: 'blip'
		}
	],
	'concepts-complete': [
		{
			id: 'portfolio-1',
			text: 'All four concepts are open. Compare them, then choose one and edit its feature set.',
			mood: 'smug',
			sound: 'reveal'
		},
		{
			id: 'portfolio-2',
			text: 'The fourth concept is the stretch option. Compare its risk as carefully as its novelty.',
			mood: 'forbidden',
			sound: 'sparkle'
		},
		{
			id: 'portfolio-3',
			text: 'My guesses are complete. Open Project Files to choose a concept and the features you want.',
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
			text: 'Feature set updated. Ancient magic bows to a well-labeled checkbox.',
			mood: 'delighted',
			sound: 'blip'
		},
		{
			id: 'feature-change-2',
			text: 'Scope updated. I will recalculate the estimates after you confirm the concept.',
			mood: 'suspicious'
		},
		{
			id: 'feature-change-3',
			text: 'Feature updated. Keep only what belongs in the version you would actually prototype.',
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
			text: 'Concept selected. Next I will research this exact feature set before writing the final plan.',
			mood: 'delighted',
			sound: 'reveal'
		},
		{
			id: 'project-selected-2',
			text: 'One concept is selected. The other three remain available if you go back and change your mind.',
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
		id: 'fallback-useful-1',
		text: 'Noted. Continue with the current step when you are ready.',
		mood: 'neutral',
		sound: 'blip'
	},
	{
		id: 'fallback-useful-2',
		text: 'The project record is updated. I will use the new information from here on.',
		mood: 'thinking',
		sound: 'none'
	},
	{
		id: 'fallback-useful-3',
		text: 'Change recorded. The next prompt tells you what I still need.',
		mood: 'smug',
		sound: 'blip'
	},
	{
		id: 'fallback-useful-4',
		text: 'That is saved. You may continue, revise it, or use the menu to start over.',
		mood: 'neutral',
		sound: 'none'
	},
	{
		id: 'fallback-useful-5',
		text: 'The signal changed. I have adjusted the project without pretending it was destiny.',
		mood: 'suspicious',
		sound: 'blip'
	},
	{
		id: 'fallback-useful-6',
		text: 'Update complete. Keep going and I will explain the next decision.',
		mood: 'delighted',
		sound: 'none'
	}
];

export function createSagePersonality(): SagePersonality {
	return {
		playerName: '',
		projectName: '',
		mood: 'neutral',
		line: 'Give me a real problem. I will research it and turn it into four project concepts.',
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

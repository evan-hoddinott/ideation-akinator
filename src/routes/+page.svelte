<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ConceptRoom from '$lib/components/ConceptRoom.svelte';
	import ChaosLayer from '$lib/components/ChaosLayer.svelte';
	import FinalizationRoom from '$lib/components/FinalizationRoom.svelte';
	import ResearchWorkstation from '$lib/components/ResearchWorkstation.svelte';
	import SageDialogue from '$lib/components/SageDialogue.svelte';
	import SageStage from '$lib/components/SageStage.svelte';
	import SummonedScroll from '$lib/components/SummonedScroll.svelte';
	import VerticalWorld from '$lib/components/VerticalWorld.svelte';
	import {
		createConceptState,
		parseConceptGenerationResult,
		type ConceptGenerationRequest,
		type RejectedConceptSummary
	} from '$lib/concepts';
	import {
		createDemoPortfolio,
		createDemoProject,
		createDemoFinalPlan,
		createDemoFocusedResearchJob,
		createDemoResearchJob,
		demoIntakeInsights,
		isDemoProject,
		nextDemoInterview
	} from '$lib/demo';
	import {
		createProjectFinalization,
		finalizationFingerprint,
		parseFinalProjectPlan,
		parseFocusedResearchJobView,
		type FinalRecalculationRequest,
		type FocusedResearchJobView,
		type FocusedResearchRequest,
		type SelectedConceptInput,
		type SelectedFeatureInput
	} from '$lib/finalization';
	import { createFeatureWorkshop, type FeatureWorkshopState } from '$lib/feature-workshop';
	import {
		CLARITY_LABELS,
		mergeIndustrySuggestions,
		parseIntakeInsights,
		type IntakeInsights,
		type IntakeInsightsRequest
	} from '$lib/intake-insights';
	import { clearChaosRun } from '$lib/interruptions';
	import {
		createInterview,
		makeInterviewAnswer,
		parseInterviewNextResult,
		type InterviewAnswer,
		type InterviewAnswerStatus,
		type InterviewNextResult,
		type InterviewNextRequest,
		type InterviewQuestion
	} from '$lib/interview';
	import { OracleAudio } from '$lib/oracle-audio';
	import {
		reactToSageEvent,
		type SageContext,
		type SageEvent,
		type SageSoundCue
	} from '$lib/personality';
	import {
		clearProject,
		createProject,
		createProblemCard,
		loadProject,
		saveProject,
		type InnovationLevel,
		type ProjectConstraints,
		type ProjectSession
	} from '$lib/project-state';
	import { buildProjectReport, safeReportFilename } from '$lib/report';
	import type { SageVoiceProfile } from '$lib/rpg-dialogue';
	import { DEMO_RESEARCH_DURATION_MS, startVisibleTimer } from '$lib/research-performance';
	import { internetEraForAltitude, internetEraIndex } from '$lib/internet-era';
	import { projectAltitude } from '$lib/sage-stage';
	import {
		RESEARCH_CATEGORIES,
		parseResearchJobView,
		type BroadResearchRequest,
		type ResearchCategory,
		type ResearchJobView,
		type ResearchSource
	} from '$lib/research';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data, form } = $props();
	let project = $state<ProjectSession | null>(null);
	let stateReady = $state(false);
	let stateNotice = $state('');
	let submitting = $state(false);
	let resetDialog = $state<HTMLDialogElement>();
	let technologyTagDraft = $state('');
	let industryTagDraft = $state('');
	let preferenceError = $state('');
	let preferencesSealed = $state(false);
	let insightStatus = $state<'idle' | 'waiting' | 'loading' | 'ready' | 'error' | 'unavailable'>(
		'idle'
	);
	let insightMessage = $state('');
	let insightRetryNonce = $state(0);
	let insightRequestSequence = 0;
	let completedInsightSignature = '';
	let researchBusy = $state(false);
	let researchMessage = $state('');
	let interviewBusy = $state(false);
	let interviewMessage = $state('');
	let interviewDialog = $state<HTMLDialogElement>();
	let conceptBusy = $state(false);
	let conceptMessage = $state('');
	let focusedResearchBusy = $state(false);
	let finalPlanBusy = $state(false);
	let finalizationMessage = $state('');
	let pdfBusy = $state(false);
	let pdfMessage = $state('');
	let textAnswer = $state('');
	let numberAnswer = $state('');
	let singleAnswer = $state('');
	let multipleAnswer = $state<string[]>([]);
	let yesNoAnswer = $state<boolean | null>(null);
	let customAnswer = $state('');
	let customAnswerOpen = $state(false);
	let loadedAnswerSignature = '';
	let playerNameDraft = $state('');
	let projectNameDraft = $state('');
	let problemReviewOpen = $state(false);
	let preferenceReviewOpen = $state(false);
	let researchScrollOpen = $state(false);
	let broadResearchPerformanceOpen = $state(false);
	let broadResearchSkipped = $state(false);
	let preferenceStep = $state(0);
	let pauseMenuOpen = $state(false);
	let sageSpeaking = $state(false);
	let sageVoicePulse = $state(0);
	let sageVoiceEnergy = $state(0.5);
	let previewMuted = $state(true);
	let previewCalm = $state(false);
	let resetWorldSignal = $state(0);
	let oracleAudio: OracleAudio | null = null;
	let reducedMotionApplied = false;
	const stagePreview = createProject(new Date(0), 'stage-preview');
	const visualProject = $derived(
		project ?? {
			...stagePreview,
			personality: {
				...stagePreview.personality,
				muted: previewMuted,
				calmMode: previewCalm
			}
		}
	);
	const demoMode = $derived(isDemoProject(project));
	const sageAltitude = $derived(project ? projectAltitude(project) : 0.04);
	const worldEra = $derived(internetEraForAltitude(sageAltitude));
	const worldEraIndex = $derived(internetEraIndex(sageAltitude));
	const finalReport = $derived(project ? buildProjectReport(project) : null);

	const insightSignature = $derived(
		project
			? JSON.stringify({
					topic: project.problemInput.topic,
					problems: project.problemInput.cards
						.map((card) => card.text)
						.filter((text) => text.trim())
				})
			: ''
	);
	const clarityPosition = $derived(
		project?.problemInput.clarityLabel
			? CLARITY_LABELS.indexOf(project.problemInput.clarityLabel) + 1
			: 0
	);
	const broadResearchIsActive = $derived(
		project?.research.status === 'queued' || project?.research.status === 'running'
	);
	const focusedResearchIsActive = $derived(
		project?.finalization.research.status === 'queued' ||
			project?.finalization.research.status === 'running'
	);
	const researchIsActive = $derived(broadResearchIsActive || focusedResearchIsActive);
	const currentQuestion = $derived(
		project?.interview.questions[project.interview.currentQuestionIndex] ?? null
	);
	const currentAnswer = $derived(
		currentQuestion
			? (project?.interview.answers.find((answer) => answer.questionId === currentQuestion.id) ??
					null)
			: null
	);
	const answeredQuestionCount = $derived(project?.interview.answers.length ?? 0);
	const activeProblemCard = $derived(project?.problemInput.cards.at(-1) ?? null);
	const filledProblemCount = $derived(
		project?.problemInput.cards.filter((card) => card.text.trim()).length ?? 0
	);
	const researchSourceCount = $derived(project?.research.result?.sources.length ?? 0);
	const preferencePrompts = [
		'What technology should I favor, if any?',
		'I implicated these industries. Have I embarrassed myself?',
		'How dangerous may the idea become?',
		'How much money may I incinerate?',
		'Any final limitations before I open the terrible web?'
	];

	const innovationLabels = [
		'Proven and conventional',
		'Familiar with a small twist',
		'Meaningfully different',
		'Experimental',
		'Wild but buildable today'
	];
	const researchCategoryLabels: Record<ResearchCategory, string> = {
		competitors: 'Direct competitors',
		'adjacent-solutions': 'Adjacent solutions',
		'failed-products': 'Failed or discontinued products',
		'academic-work': 'Academic work',
		'prior-art': 'Patents and prior art',
		market: 'Market signals',
		'customer-frustrations': 'Customer frustrations',
		'regulations-standards': 'Regulations and standards',
		'technical-building-blocks': 'Technical building blocks'
	};
	const constraintFields: Array<{
		key: keyof ProjectConstraints;
		label: string;
		placeholder: string;
		wide?: boolean;
	}> = [
		{
			key: 'targetPlatform',
			label: 'Target platform',
			placeholder: 'Web, mobile, physical device...'
		},
		{ key: 'deadline', label: 'Deadline', placeholder: 'No deadline, 3 months...' },
		{ key: 'teamSize', label: 'Team size', placeholder: 'Solo, 3 people...' },
		{ key: 'teamSkills', label: 'Team skills', placeholder: 'CAD, Python, electronics...' },
		{
			key: 'regulatory',
			label: 'Regulatory constraints',
			placeholder: 'HIPAA, food safety, none known',
			wide: true
		},
		{
			key: 'accessibility',
			label: 'Accessibility needs',
			placeholder: 'Screen reader support, one-handed use...',
			wide: true
		},
		{
			key: 'existingSystems',
			label: 'Existing systems or data',
			placeholder: 'APIs, spreadsheets, equipment...',
			wide: true
		},
		{
			key: 'revenueModel',
			label: 'Preferred revenue model',
			placeholder: 'One-time purchase, subscription, open source...'
		},
		{
			key: 'other',
			label: 'Other constraints',
			placeholder: 'Anything else the ideas must respect',
			wide: true
		}
	];

	$effect(() => {
		if (!data.authenticated || stateReady) return;

		const result = loadProject(window.localStorage);
		project = result.project;
		playerNameDraft = result.project?.personality.playerName ?? '';
		projectNameDraft = result.project?.personality.projectName ?? '';
		stateReady = true;

		if (result.status === 'recovered') {
			stateNotice = 'An unreadable old project was cleared. Nothing else in this browser changed.';
		} else if (result.status === 'migrated') {
			stateNotice = 'Your saved project was upgraded and restored in this browser.';
		} else if (result.status === 'ready') {
			stateNotice = 'Your unfinished project was restored from this browser.';
		}
	});

	$effect(() => {
		if (!stateReady || reducedMotionApplied || !project) return;
		reducedMotionApplied = true;
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (project.personality.calmMode) return;
		project = saveProject(window.localStorage, {
			...project,
			personality: { ...project.personality, calmMode: true }
		});
	});

	$effect(() => {
		oracleAudio?.setEra(worldEraIndex);
	});

	$effect(() => {
		if (!stateReady) return;
		const onVisibility = () => {
			if (!oracleAudio || visualProject.personality.muted) return;
			void oracleAudio.setEnabled(document.visibilityState === 'visible');
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	});

	$effect(() => {
		const signature = insightSignature;
		const retryNonce = insightRetryNonce;
		if (
			!stateReady ||
			!signature ||
			project?.stage === 'research' ||
			project?.stage === 'questions' ||
			project?.stage === 'concepts' ||
			project?.stage === 'focused'
		)
			return;

		const input = JSON.parse(signature) as IntakeInsightsRequest;
		if (input.problems.length === 0) {
			insightStatus = 'idle';
			insightMessage = '';
			return;
		}
		if (signature === completedInsightSignature) return;

		void retryNonce;
		insightStatus = 'waiting';
		insightMessage = 'Listening for a pause...';
		const controller = new AbortController();
		const sequence = ++insightRequestSequence;
		const timer = window.setTimeout(() => {
			void requestIntakeInsights(input, signature, sequence, controller.signal);
		}, 900);

		return () => {
			window.clearTimeout(timer);
			controller.abort();
		};
	});

	$effect(() => {
		const jobId = project?.stage === 'research' ? project.research.jobId : null;
		const status = project?.research.status;
		if (!jobId || (status !== 'queued' && status !== 'running')) return;
		if (isDemoProject(project)) {
			return startVisibleTimer(DEMO_RESEARCH_DURATION_MS.broad, () => completeDemoResearch(jobId));
		}

		const timer = window.setInterval(() => void pollResearchJob(jobId), 1_500);
		return () => window.clearInterval(timer);
	});

	$effect(() => {
		const jobId = project?.stage === 'focused' ? project.finalization.research.jobId : null;
		const status = project?.finalization.research.status;
		if (!jobId || (status !== 'queued' && status !== 'running')) return;
		if (isDemoProject(project)) {
			return startVisibleTimer(DEMO_RESEARCH_DURATION_MS.focused, () =>
				completeDemoFocusedResearch(jobId)
			);
		}
		const timer = window.setInterval(() => void pollFocusedResearchJob(jobId), 1_500);
		return () => window.clearInterval(timer);
	});

	$effect(() => {
		const question = currentQuestion;
		const answer = currentAnswer;
		const signature = question ? `${question.id}:${JSON.stringify(answer)}` : '';
		if (signature === loadedAnswerSignature) return;
		loadedAnswerSignature = signature;
		textAnswer = question?.type === 'text' && typeof answer?.value === 'string' ? answer.value : '';
		numberAnswer =
			(question?.type === 'number' || question?.type === 'budget') &&
			typeof answer?.value === 'number'
				? String(answer.value)
				: '';
		singleAnswer =
			question?.type === 'single-choice' && typeof answer?.value === 'string' ? answer.value : '';
		multipleAnswer =
			question?.type === 'multiple-choice' && Array.isArray(answer?.value) ? [...answer.value] : [];
		yesNoAnswer =
			question?.type === 'yes-no' && typeof answer?.value === 'boolean' ? answer.value : null;
		customAnswer = answer?.customText ?? '';
		customAnswerOpen = !!answer?.customText;
	});

	const enhanceLogin: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	};

	function beginProject() {
		const nextProject = project ?? createProject();
		const namedProject = {
			...nextProject,
			stage: 'problem' as const,
			personality: {
				...nextProject.personality,
				muted: project ? nextProject.personality.muted : previewMuted,
				calmMode: project ? nextProject.personality.calmMode : previewCalm,
				playerName: playerNameDraft.trim().slice(0, 50),
				projectName: projectNameDraft.trim().slice(0, 50)
			}
		};
		const reaction = reactToSageEvent(
			namedProject.personality,
			'project-started',
			namedProject.id,
			sageContext(namedProject)
		);
		project = saveProject(window.localStorage, {
			...namedProject,
			personality: reaction.personality
		});
		playSageCue(reaction.sound);
		stateNotice = 'Project started. Your progress now stays in this browser.';
	}

	function beginDemo() {
		const createdDemo = createDemoProject();
		const demo = {
			...createdDemo,
			personality: {
				...createdDemo.personality,
				muted: previewMuted,
				calmMode: previewCalm
			}
		};
		const reaction = reactToSageEvent(
			demo.personality,
			'project-started',
			demo.id,
			sageContext(demo)
		);
		project = saveProject(window.localStorage, {
			...demo,
			personality: reaction.personality
		});
		playerNameDraft = demo.personality.playerName;
		projectNameDraft = demo.personality.projectName;
		insightStatus = 'ready';
		insightMessage = 'Canned demo reading. No model call occurred.';
		completedInsightSignature = insightSignature;
		stateNotice = 'Token-free visual demo. Every research result, question, and idea is canned.';
		playSageCue(reaction.sound);
	}

	function restartDemo() {
		if (!demoMode) return;
		startOver();
		beginDemo();
	}

	function sageContext(session: ProjectSession): SageContext {
		return {
			playerName: session.personality.playerName,
			projectName: session.personality.projectName,
			topic: session.problemInput.topic,
			industries: session.preferences.selectedIndustryTags,
			technologies: session.preferences.technologyTags,
			problemCount: session.problemInput.cards.filter((card) => card.text.trim()).length,
			answeredCount: session.interview.answers.length,
			hasResearch: !!session.research.result
		};
	}

	function performSageEvent(
		event: SageEvent,
		session: ProjectSession | null = project,
		context: SageContext = {}
	) {
		if (!session) return;
		const reaction = reactToSageEvent(session.personality, event, session.id, {
			...sageContext(session),
			...context
		});
		project = saveProject(window.localStorage, { ...session, personality: reaction.personality });
		playSageCue(reaction.sound);
	}

	function grantAchievement(achievement: string) {
		if (!project || project.personality.achievements.includes(achievement)) return;
		project = saveProject(window.localStorage, {
			...project,
			personality: {
				...project.personality,
				achievements: [...project.personality.achievements, achievement]
			}
		});
	}

	function playSageCue(cue: SageSoundCue) {
		if (!project || project.personality.muted) return;
		oracleAudio ??= new OracleAudio();
		oracleAudio.setEra(worldEraIndex);
		oracleAudio.playCue(cue);
	}

	function playSageVoice(profile: SageVoiceProfile) {
		sageVoicePulse += 1;
		sageVoiceEnergy = Math.min(1, Math.max(0.15, profile.volume / 0.05));
		if (visualProject.personality.muted) return;
		oracleAudio ??= new OracleAudio();
		oracleAudio.setEra(worldEraIndex);
		oracleAudio.playVoice(profile);
	}

	function setSageSpeaking(speaking: boolean) {
		sageSpeaking = speaking;
	}

	function toggleSageAudio() {
		if (!project) {
			previewMuted = !previewMuted;
			oracleAudio ??= new OracleAudio();
			oracleAudio.setEra(worldEraIndex);
			void oracleAudio.setEnabled(!previewMuted);
			if (!previewMuted) oracleAudio.playCue('reveal');
			return;
		}
		const muted = !project.personality.muted;
		project = saveProject(window.localStorage, {
			...project,
			personality: { ...project.personality, muted }
		});
		oracleAudio ??= new OracleAudio();
		oracleAudio.setEra(worldEraIndex);
		void oracleAudio.setEnabled(!muted);
		if (!muted) oracleAudio.playCue('reveal');
	}

	function toggleCalmMode() {
		if (!project) {
			previewCalm = !previewCalm;
			if (previewCalm) {
				previewMuted = true;
				void oracleAudio?.setEnabled(false);
			}
			return;
		}
		const calmMode = !project.personality.calmMode;
		const nextProject = {
			...project,
			personality: {
				...project.personality,
				calmMode,
				muted: calmMode ? true : project.personality.muted
			}
		};
		if (calmMode) void oracleAudio?.setEnabled(false);
		performSageEvent(calmMode ? 'calm-enabled' : 'calm-disabled', nextProject);
	}

	function findForbiddenFloppy() {
		performSageEvent('secret-found');
	}

	function togglePauseMenu() {
		pauseMenuOpen = !pauseMenuOpen;
	}

	function handleAppKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('dialog[open]')) return;
		event.preventDefault();
		togglePauseMenu();
	}

	function persist(nextProject: ProjectSession) {
		const invalidatesResearch =
			project && intakeFingerprint(project) !== intakeFingerprint(nextProject);
		project = saveProject(
			window.localStorage,
			invalidatesResearch
				? {
						...nextProject,
						research: { jobId: null, status: 'idle', result: null },
						interview: createInterview(),
						concepts: createConceptState(),
						featureWorkshop: createFeatureWorkshop(null),
						finalization: createProjectFinalization(),
						completedStages: nextProject.completedStages.filter(
							(stage) =>
								stage !== 'research' &&
								stage !== 'questions' &&
								stage !== 'concepts' &&
								stage !== 'focused'
						)
					}
				: nextProject
		);
		preferencesSealed = false;
	}

	function persistResearch(job: ResearchJobView) {
		if (!project) return;
		const previousStatus = project.research.status;
		if (
			(job.status === 'completed' || job.status === 'partial') &&
			(previousStatus === 'queued' || previousStatus === 'running') &&
			!broadResearchSkipped
		) {
			broadResearchPerformanceOpen = true;
		}
		project = saveProject(window.localStorage, {
			...project,
			completedStages:
				job.status === 'completed' || job.status === 'partial'
					? Array.from(new Set([...project.completedStages, 'research']))
					: project.completedStages.filter((stage) => stage !== 'research'),
			research: { jobId: job.id, status: job.status, result: job.result }
		});
		researchMessage = job.message ?? progressMessage(job);
		if (job.status !== previousStatus) {
			if (job.status === 'completed' || job.status === 'partial') {
				performSageEvent('research-complete', project);
			} else if (job.status === 'failed' || job.status === 'cancelled') {
				performSageEvent('research-failed', project);
			} else if (job.status === 'running') {
				performSageEvent('research-progress', project);
			}
		}
	}

	function setTopic(topic: string) {
		if (!project) return;
		persist({
			...project,
			problemInput: clearProblemReading({ ...project.problemInput, topic })
		});
	}

	function setProblemText(id: string, text: string) {
		if (!project) return;
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: project.problemInput.cards.map((card) => (card.id === id ? { ...card, text } : card))
			}
		});
	}

	function addProblem() {
		if (!project) return;
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: [...project.problemInput.cards, createProblemCard()]
			}
		});
		performSageEvent('problem-added', project);
	}

	function removeProblem(id: string) {
		if (!project) return;
		const cards = project.problemInput.cards.filter((card) => card.id !== id);
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: cards.length > 0 ? cards : [createProblemCard()]
			}
		});
		performSageEvent('problem-removed', project);
	}

	function moveProblem(index: number, direction: -1 | 1) {
		if (!project) return;
		const target = index + direction;
		if (target < 0 || target >= project.problemInput.cards.length) return;
		const cards = [...project.problemInput.cards];
		[cards[index], cards[target]] = [cards[target], cards[index]];
		persist({
			...project,
			problemInput: { ...clearProblemReading(project.problemInput), cards }
		});
	}

	function clearProblemReading(problemInput: ProjectSession['problemInput']) {
		return {
			...problemInput,
			clarityLabel: null,
			clarityReasons: [],
			topicCoherenceWarning: null
		};
	}

	async function requestIntakeInsights(
		input: IntakeInsightsRequest,
		signature: string,
		sequence: number,
		signal: AbortSignal
	) {
		insightStatus = 'loading';
		insightMessage = isDemoProject(project)
			? 'Playing a canned clarity reading...'
			: 'Reading the signal...';
		try {
			if (isDemoProject(project)) {
				await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 180));
				if (signal.aborted) return;
				applyIntakeInsights(demoIntakeInsights(), signature, sequence);
				return;
			}
			const response = await fetch(resolve('/api/intake-insights'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input),
				signal
			});
			const body: unknown = await response.json();
			if (!response.ok) {
				const errorBody = body as { message?: unknown };
				insightStatus = response.status === 503 ? 'unavailable' : 'error';
				insightMessage =
					typeof errorBody.message === 'string'
						? errorBody.message
						: 'The reading flickered out. Your notes are still saved.';
				return;
			}

			const insights = parseIntakeInsights(body);
			if (!insights) throw new Error('Invalid intake insight response');
			applyIntakeInsights(insights, signature, sequence);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			if (sequence !== insightRequestSequence) return;
			insightStatus = 'error';
			insightMessage = 'The reading flickered out. Your notes are safe, and you can try again.';
		}
	}

	function applyIntakeInsights(insights: IntakeInsights, signature: string, sequence: number) {
		if (sequence !== insightRequestSequence || signature !== insightSignature || !project) return;
		completedInsightSignature = signature;

		const mergedIndustries = mergeIndustrySuggestions(
			project.preferences.selectedIndustryTags,
			project.preferences.dismissedIndustryTags,
			project.preferences.suggestedIndustryTags,
			insights.suggestedIndustryTags
		);
		const previousClarity = project.problemInput.clarityLabel;
		const previousIndustryCount = project.preferences.selectedIndustryTags.length;
		persist({
			...project,
			problemInput: {
				...project.problemInput,
				clarityLabel: insights.clarityLabel,
				clarityReasons: insights.clarityReasons,
				topicCoherenceWarning: insights.topicCoherenceWarning
			},
			preferences: {
				...project.preferences,
				selectedIndustryTags: mergedIndustries.selected,
				suggestedIndustryTags: mergedIndustries.suggested
			}
		});
		if (project && mergedIndustries.selected.length > previousIndustryCount) {
			performSageEvent('industries-guessed', project);
		} else if (project && insights.clarityLabel !== previousClarity) {
			const strong = CLARITY_LABELS.indexOf(insights.clarityLabel) >= 3;
			performSageEvent(strong ? 'clarity-strong' : 'clarity-weak', project);
		}
		insightStatus = 'ready';
		insightMessage = isDemoProject(project)
			? 'Canned demo reading. No model call occurred.'
			: 'Reading updated.';
	}

	function retryIntakeInsights() {
		completedInsightSignature = '';
		insightRetryNonce += 1;
	}

	function goToPreferences() {
		if (!project) return;
		if (filledProblemCount === 0) {
			stateNotice = 'The Sage needs at least one actual problem before setting limitations.';
			return;
		}
		persist({
			...project,
			stage: 'preferences',
			completedStages: Array.from(new Set([...project.completedStages, 'problem']))
		});
		stateNotice = 'Problem notes saved. Preferences are up next.';
		preferenceStep = 0;
		performSageEvent('preferences-opened', project);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function goToProblem() {
		if (!project) return;
		persist({ ...project, stage: 'problem' });
		preferenceError = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function nextPreferenceStep() {
		if (!project) return;
		preferenceError = '';
		if (preferenceStep === 0 && project.preferences.technologyTags.length === 0) {
			preferenceError = 'Add a technology preference. "Open to anything" counts.';
			return;
		}
		if (preferenceStep === 1 && project.preferences.selectedIndustryTags.length === 0) {
			preferenceError = 'Keep or add at least one industry.';
			return;
		}
		if (preferenceStep === 3) {
			if (project.preferences.prototypeBudgetUsd === null) {
				preferenceError = 'Enter a prototype budget. Zero is allowed.';
				return;
			}
			if (
				project.preferences.includeProductionPlanning &&
				project.preferences.productionBudgetUsd === null
			) {
				preferenceError = 'Enter a production budget or turn production planning off.';
				return;
			}
		}
		preferenceStep = Math.min(4, preferenceStep + 1);
	}

	function previousPreferenceStep() {
		if (preferenceStep === 0) {
			goToProblem();
			return;
		}
		preferenceError = '';
		preferenceStep -= 1;
	}

	function addTag(kind: 'technology' | 'industry') {
		if (!project) return;
		const draft = kind === 'technology' ? technologyTagDraft : industryTagDraft;
		const tag = draft.trim().replace(/\s+/g, ' ');
		if (!tag) return;
		const key = kind === 'technology' ? 'technologyTags' : 'selectedIndustryTags';
		const current = project.preferences[key];
		if (!current.some((entry) => entry.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
			persist({
				...project,
				preferences: {
					...project.preferences,
					[key]: [...current, tag],
					dismissedIndustryTags:
						kind === 'industry'
							? project.preferences.dismissedIndustryTags.filter(
									(entry) => entry.toLocaleLowerCase() !== tag.toLocaleLowerCase()
								)
							: project.preferences.dismissedIndustryTags,
					suggestedIndustryTags:
						kind === 'industry'
							? project.preferences.suggestedIndustryTags.filter(
									(entry) => entry.toLocaleLowerCase() !== tag.toLocaleLowerCase()
								)
							: project.preferences.suggestedIndustryTags
				}
			});
		}
		if (kind === 'technology') technologyTagDraft = '';
		else industryTagDraft = '';
		preferenceError = '';
	}

	function tagKeydown(event: KeyboardEvent, kind: 'technology' | 'industry') {
		if (event.key !== 'Enter' && event.key !== ',') return;
		event.preventDefault();
		addTag(kind);
	}

	function removeTag(kind: 'technology' | 'industry', tag: string) {
		if (!project) return;
		if (kind === 'technology') {
			persist({
				...project,
				preferences: {
					...project.preferences,
					technologyTags: project.preferences.technologyTags.filter((entry) => entry !== tag)
				}
			});
			return;
		}
		persist({
			...project,
			preferences: {
				...project.preferences,
				selectedIndustryTags: project.preferences.selectedIndustryTags.filter(
					(entry) => entry !== tag
				),
				dismissedIndustryTags: Array.from(
					new Set([...project.preferences.dismissedIndustryTags, tag])
				),
				suggestedIndustryTags: project.preferences.suggestedIndustryTags.filter(
					(entry) => entry !== tag
				)
			}
		});
	}

	function setInnovationLevel(level: number) {
		if (!project) return;
		persist({
			...project,
			preferences: { ...project.preferences, innovationLevel: level as InnovationLevel }
		});
		if (level === 1) performSageEvent('innovation-safe', project);
		if (level === 5) performSageEvent('innovation-wild', project);
	}

	function setBudget(kind: 'prototype' | 'production', input: HTMLInputElement) {
		if (!project) return;
		const value = input.value === '' ? null : Math.max(0, input.valueAsNumber);
		persist({
			...project,
			preferences: {
				...project.preferences,
				[kind === 'prototype' ? 'prototypeBudgetUsd' : 'productionBudgetUsd']: value
			}
		});
		preferenceError = '';
	}

	function budgetMeterPercent(value: number | null): number {
		if (value === null || value <= 0) return 0;
		return Math.min(100, (Math.log10(value + 1) / 5) * 100);
	}

	function setProductionPlanning(includeProductionPlanning: boolean) {
		if (!project) return;
		persist({
			...project,
			preferences: { ...project.preferences, includeProductionPlanning }
		});
		preferenceError = '';
	}

	function setConstraint(key: keyof ProjectConstraints, value: string) {
		if (!project) return;
		persist({
			...project,
			preferences: {
				...project.preferences,
				constraints: { ...project.preferences.constraints, [key]: value }
			}
		});
	}

	function sealPreferences() {
		if (!project) return;
		const preferences = project.preferences;
		if (preferences.technologyTags.length === 0) {
			preferenceError = 'Add a technology preference. "Open to anything" is a valid answer.';
			return;
		}
		if (preferences.selectedIndustryTags.length === 0) {
			preferenceError = 'Add at least one industry. The Sage can suggest them from your problems.';
			return;
		}
		if (preferences.prototypeBudgetUsd === null) {
			preferenceError = 'Enter the total prototype budget. Zero is allowed.';
			return;
		}
		if (preferences.includeProductionPlanning && preferences.productionBudgetUsd === null) {
			preferenceError = 'Enter a production budget, or turn off production planning.';
			return;
		}

		project = saveProject(window.localStorage, {
			...project,
			stage: 'research',
			completedStages: Array.from(new Set([...project.completedStages, 'preferences']))
		});
		preferenceError = '';
		preferencesSealed = false;
		stateNotice = 'Intake complete. Review it once, then begin the broad research pass.';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function startBroadResearch() {
		if (!project || researchBusy || broadResearchIsActive) return;
		const input = broadResearchRequest(project);
		if (!input) {
			researchMessage = 'The intake is missing a required budget or preference.';
			return;
		}

		researchBusy = true;
		broadResearchPerformanceOpen = true;
		broadResearchSkipped = false;
		researchMessage = 'Opening the research room...';
		project = saveProject(window.localStorage, {
			...project,
			interview: createInterview(),
			concepts: createConceptState(),
			featureWorkshop: createFeatureWorkshop(null),
			finalization: createProjectFinalization(),
			completedStages: project.completedStages.filter(
				(stage) =>
					stage !== 'research' &&
					stage !== 'questions' &&
					stage !== 'concepts' &&
					stage !== 'focused'
			)
		});
		performSageEvent('research-started', project);
		if (isDemoProject(project)) {
			persistResearch(createDemoResearchJob('running'));
			researchBusy = false;
			return;
		}
		try {
			const response = await fetch(resolve('/api/research/jobs'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});
			const body: unknown = await response.json();
			if (!response.ok) {
				const error = body as { message?: unknown };
				researchMessage =
					typeof error.message === 'string'
						? error.message
						: 'Research could not start. Your intake is still saved.';
				return;
			}
			const job = parseResearchJobView(body);
			if (!job) throw new Error('Invalid research job response');
			persistResearch(job);
		} catch {
			researchMessage = 'Research could not start. Your intake is still saved.';
		} finally {
			researchBusy = false;
		}
	}

	function completeDemoResearch(jobId: string) {
		if (
			!project ||
			!isDemoProject(project) ||
			project.research.jobId !== jobId ||
			(project.research.status !== 'queued' && project.research.status !== 'running')
		) {
			return;
		}
		persistResearch(createDemoResearchJob('completed'));
	}

	function skipBroadResearchPerformance() {
		if (!project) return;
		broadResearchSkipped = true;
		broadResearchPerformanceOpen = false;
		performSageEvent('answer-skipped', project);
		const jobId = project.research.jobId;
		if (jobId && isDemoProject(project)) completeDemoResearch(jobId);
	}

	function skipFocusedResearchPerformance() {
		if (!project) return;
		performSageEvent('answer-skipped', project);
		const jobId = project.finalization.research.jobId;
		if (jobId && isDemoProject(project)) completeDemoFocusedResearch(jobId);
	}

	async function pollResearchJob(jobId: string) {
		try {
			const response = await fetch(`/api/research/jobs/${encodeURIComponent(jobId)}`);
			const body: unknown = await response.json();
			if (!response.ok) {
				if (response.status === 404 && project?.research.jobId === jobId) {
					project = saveProject(window.localStorage, {
						...project,
						research: { jobId: null, status: 'failed', result: project.research.result }
					});
				}
				const error = body as { message?: unknown };
				researchMessage =
					typeof error.message === 'string'
						? error.message
						: 'The research job could not be restored.';
				return;
			}
			const job = parseResearchJobView(body);
			if (!job || project?.research.jobId !== jobId) return;
			persistResearch(job);
		} catch {
			researchMessage =
				'The status check failed. The app will keep trying while this page is open.';
		}
	}

	async function cancelResearchJob(silent = false) {
		const jobId = project?.research.jobId;
		if (!jobId || !broadResearchIsActive) return;
		if (project && isDemoProject(project)) {
			project = saveProject(window.localStorage, {
				...project,
				research: { jobId: null, status: 'cancelled', result: null }
			});
			researchMessage = silent ? '' : 'The local demo performance was cancelled.';
			return;
		}
		if (!silent) researchMessage = 'Cancelling the research pass...';
		try {
			const response = await fetch(`/api/research/jobs/${encodeURIComponent(jobId)}`, {
				method: 'DELETE'
			});
			const body: unknown = await response.json();
			const job = parseResearchJobView(body);
			if (response.ok && job && project?.research.jobId === jobId) persistResearch(job);
		} catch {
			if (!silent)
				researchMessage = 'The cancel request failed. Check the job status before retrying.';
		}
	}

	function retryBroadResearch() {
		if (!project) return;
		project = saveProject(window.localStorage, {
			...project,
			research: { jobId: null, status: 'idle', result: project.research.result }
		});
		researchMessage = '';
		void startBroadResearch();
	}

	function broadResearchRequest(session: ProjectSession): BroadResearchRequest | null {
		const preferences = session.preferences;
		if (
			preferences.prototypeBudgetUsd === null ||
			(preferences.includeProductionPlanning && preferences.productionBudgetUsd === null)
		) {
			return null;
		}
		return {
			projectId: session.id,
			topic: session.problemInput.topic,
			problems: session.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
			technologyTags: preferences.technologyTags,
			industryTags: preferences.selectedIndustryTags,
			innovationLevel: preferences.innovationLevel,
			prototypeBudgetUsd: preferences.prototypeBudgetUsd,
			includeProductionPlanning: preferences.includeProductionPlanning,
			productionBudgetUsd: preferences.productionBudgetUsd,
			constraints: { ...preferences.constraints }
		};
	}

	function intakeFingerprint(session: ProjectSession) {
		return JSON.stringify(broadResearchRequest(session));
	}

	function progressMessage(job: ResearchJobView): string {
		return {
			queued: 'Waiting for a research slot...',
			starting: 'Opening the dusty web...',
			researching: 'Checking what people built, tried, and complained about...',
			'checking-sources': 'Checking every source before it reaches the brief...',
			'retrying-structure': 'The sources arrived messy. Sorting them once more...',
			complete: 'The broad research brief is ready.'
		}[job.progress];
	}

	function sourceFor(id: string): ResearchSource | undefined {
		return project?.research.result?.sources.find((source) => source.id === id);
	}

	function goToResearch() {
		if (!project || interviewBusy) return;
		project = saveProject(window.localStorage, { ...project, stage: 'research' });
		interviewMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function enterInterview() {
		if (!project || !project.research.result || interviewBusy) return;
		project = saveProject(window.localStorage, { ...project, stage: 'questions' });
		stateNotice = 'Research saved. The Sage will ask one useful question at a time.';
		performSageEvent('interview-started', project);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (project.interview.questions.length === 0) void requestNextInterview(project);
	}

	async function requestNextInterview(session: ProjectSession | null = project) {
		if (!session || interviewBusy) return;
		const input = interviewRequest(session);
		if (!input) {
			interviewMessage = 'The saved research or budget is incomplete. Return to the research room.';
			return;
		}
		interviewBusy = true;
		interviewMessage = isDemoProject(session)
			? 'The Sage is consulting his local demo cue cards...'
			: 'The Sage is choosing the next useful question...';
		try {
			let result: InterviewNextResult | null;
			if (isDemoProject(session)) {
				await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 280));
				result = nextDemoInterview(session.interview);
			} else {
				const response = await fetch(resolve('/api/interview/next'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(input)
				});
				const body: unknown = await response.json();
				if (!response.ok) {
					const error = body as { message?: unknown };
					interviewMessage =
						typeof error.message === 'string'
							? error.message
							: 'The next question did not arrive. Your answers are still saved.';
					return;
				}
				result = parseInterviewNextResult(body);
			}
			if (!result || !project || project.id !== session.id) {
				throw new Error('Invalid interview response');
			}
			if (result.decision === 'complete') {
				project = saveProject(window.localStorage, {
					...project,
					completedStages: Array.from(new Set([...project.completedStages, 'questions'])),
					interview: {
						...project.interview,
						status: 'completed',
						completionReason: result.completionReason,
						confidence: 'normal'
					}
				});
				interviewMessage = '';
				performSageEvent('interview-finished', project);
				return;
			}
			project = saveProject(window.localStorage, {
				...project,
				interview: {
					...project.interview,
					status: 'active',
					questions: [...project.interview.questions, result.question],
					currentQuestionIndex: project.interview.questions.length,
					completionReason: null
				}
			});
			interviewMessage = '';
		} catch {
			interviewMessage =
				'The next question did not arrive. Your answers are saved, and you can retry.';
		} finally {
			interviewBusy = false;
		}
	}

	function interviewRequest(session: ProjectSession): InterviewNextRequest | null {
		const research = session.research.result;
		const preferences = session.preferences;
		if (!research || preferences.prototypeBudgetUsd === null) return null;
		return {
			projectId: session.id,
			topic: session.problemInput.topic,
			problems: session.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
			technologyTags: preferences.technologyTags,
			industryTags: preferences.selectedIndustryTags,
			innovationLevel: preferences.innovationLevel,
			prototypeBudgetUsd: preferences.prototypeBudgetUsd,
			includeProductionPlanning: preferences.includeProductionPlanning,
			productionBudgetUsd: preferences.productionBudgetUsd,
			constraints: { ...preferences.constraints },
			research: {
				summary: research.summary,
				findings: research.findings.map(({ title, claim, interpretation }) => ({
					title,
					claim,
					interpretation
				})),
				gaps: research.gaps.map(({ category, reason }) => ({ category, reason }))
			},
			questions: session.interview.questions,
			answers: session.interview.answers
		};
	}

	function submitInterviewAnswer(
		status: InterviewAnswerStatus,
		immediateValue?: InterviewAnswer['value']
	) {
		if (!project || !currentQuestion || interviewBusy) return;
		const answer = makeInterviewAnswer(
			currentQuestion,
			status,
			status === 'answered'
				? immediateValue === undefined
					? draftAnswerValue(currentQuestion)
					: immediateValue
				: null,
			status === 'answered' && customAnswerOpen ? customAnswer : null
		);
		if (!answer) {
			interviewMessage = 'Choose or enter an answer first, or use Skip or I don’t know.';
			return;
		}

		const index = project.interview.currentQuestionIndex;
		const existing = project.interview.answers.find(
			(entry) => entry.questionId === currentQuestion.id
		);
		if (
			existing &&
			JSON.stringify(existing) === JSON.stringify(answer) &&
			index < project.interview.questions.length - 1
		) {
			project = saveProject(window.localStorage, {
				...project,
				interview: { ...project.interview, currentQuestionIndex: index + 1 }
			});
			interviewMessage = '';
			return;
		}

		const keptQuestions = project.interview.questions.slice(0, index + 1);
		const keptIds = new Set(keptQuestions.map((question) => question.id));
		const answers = project.interview.answers.filter(
			(entry) => entry.questionId !== currentQuestion.id && keptIds.has(entry.questionId)
		);
		const nextProject = saveProject(window.localStorage, {
			...project,
			completedStages: project.completedStages.filter(
				(stage) => stage !== 'questions' && stage !== 'concepts' && stage !== 'focused'
			),
			concepts: createConceptState(),
			featureWorkshop: createFeatureWorkshop(null),
			finalization: createProjectFinalization(),
			interview: {
				...project.interview,
				status: 'active',
				questions: keptQuestions,
				answers: [...answers, answer],
				currentQuestionIndex: index,
				completionReason: null,
				confidence: 'normal'
			}
		});
		project = nextProject;
		performSageEvent(
			existing
				? 'answer-changed'
				: status === 'skipped'
					? 'answer-skipped'
					: status === 'unknown'
						? 'answer-unknown'
						: 'answer-saved',
			project
		);
		interviewMessage = '';
		void requestNextInterview(project);
	}

	function draftAnswerValue(question: InterviewQuestion): InterviewAnswer['value'] {
		if (question.type === 'text') return textAnswer;
		if (question.type === 'single-choice') return customAnswerOpen ? null : singleAnswer;
		if (question.type === 'multiple-choice') return multipleAnswer;
		if (question.type === 'yes-no') return yesNoAnswer;
		return numberAnswer.trim() === '' ? null : Number(numberAnswer);
	}

	function toggleMultipleAnswer(id: string, checked: boolean) {
		multipleAnswer = checked
			? Array.from(new Set([...multipleAnswer, id]))
			: multipleAnswer.filter((entry) => entry !== id);
	}

	function openCustomAnswer() {
		customAnswerOpen = true;
		singleAnswer = '';
	}

	function previousInterviewQuestion() {
		if (!project || interviewBusy || project.interview.currentQuestionIndex === 0) return;
		project = saveProject(window.localStorage, {
			...project,
			interview: {
				...project.interview,
				currentQuestionIndex: project.interview.currentQuestionIndex - 1
			}
		});
		interviewMessage = '';
		performSageEvent('question-revisited', project);
	}

	function finishInterviewEarly() {
		if (!project) return;
		project = saveProject(window.localStorage, {
			...project,
			completedStages: Array.from(new Set([...project.completedStages, 'questions'])),
			concepts: createConceptState(),
			featureWorkshop: createFeatureWorkshop(null),
			finalization: createProjectFinalization(),
			interview: {
				...project.interview,
				status: 'ended-early',
				completionReason: 'The interview ended early at your request.',
				confidence: 'reduced'
			}
		});
		interviewMessage = '';
		performSageEvent('interview-abandoned', project);
		interviewDialog?.close();
	}

	function enterConceptRoom() {
		if (
			!project ||
			conceptBusy ||
			(project.interview.status !== 'completed' && project.interview.status !== 'ended-early')
		)
			return;
		project = saveProject(window.localStorage, { ...project, stage: 'concepts' });
		conceptMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (!project.concepts.portfolio) void requestConcepts(false);
	}

	function returnToQuestions() {
		if (!project || conceptBusy) return;
		project = saveProject(window.localStorage, { ...project, stage: 'questions' });
		conceptMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function conceptRequest(
		session: ProjectSession,
		rejectedConcepts: RejectedConceptSummary[] = []
	): ConceptGenerationRequest | null {
		const research = session.research.result;
		const preferences = session.preferences;
		if (
			!research ||
			preferences.prototypeBudgetUsd === null ||
			(preferences.includeProductionPlanning && preferences.productionBudgetUsd === null) ||
			(session.interview.status !== 'completed' && session.interview.status !== 'ended-early')
		) {
			return null;
		}
		return {
			projectId: session.id,
			topic: session.problemInput.topic,
			problems: session.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
			technologyTags: preferences.technologyTags,
			industryTags: preferences.selectedIndustryTags,
			innovationLevel: preferences.innovationLevel,
			prototypeBudgetUsd: preferences.prototypeBudgetUsd,
			includeProductionPlanning: preferences.includeProductionPlanning,
			productionBudgetUsd: preferences.productionBudgetUsd,
			constraints: { ...preferences.constraints },
			research,
			interview: session.interview,
			rejectedConcepts
		};
	}

	async function requestConcepts(replacement: boolean) {
		if (!project || conceptBusy) return;
		const oldPortfolio = project.concepts.portfolio;
		const rejectedConcepts =
			replacement && oldPortfolio
				? oldPortfolio.concepts.map(({ name, pitch, distinctApproach }) => ({
						name,
						pitch,
						distinctApproach
					}))
				: [];
		const input = conceptRequest(project, rejectedConcepts);
		if (!input) {
			conceptMessage = 'The saved research, interview, or budget is incomplete.';
			return;
		}

		conceptBusy = true;
		conceptMessage = replacement
			? 'The Sage is deleting four prophecies and pretending this is normal...'
			: 'The Sage is assembling four meaningfully different futures...';
		performSageEvent(replacement ? 'sage-defeated' : 'concept-summoning', project);
		const projectId = project.id;
		try {
			if (isDemoProject(project)) {
				await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 850));
				if (!project || project.id !== projectId) return;
				const portfolio = createDemoPortfolio(
					new Date(),
					(oldPortfolio?.generationNumber ?? 0) + 1
				);
				project = saveProject(window.localStorage, {
					...project,
					stage: 'concepts',
					completedStages: Array.from(new Set([...project.completedStages, 'concepts'])),
					concepts: { status: 'ready', portfolio },
					featureWorkshop: createFeatureWorkshop(portfolio),
					finalization: createProjectFinalization()
				});
				conceptMessage = '';
				performSageEvent('concept-revealed', project);
				window.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}
			const response = await fetch(resolve('/api/concepts'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});
			const body: unknown = await response.json();
			if (!response.ok) {
				const error = body as { message?: unknown };
				conceptMessage =
					typeof error.message === 'string'
						? error.message
						: 'The four futures did not stabilize. Your earlier work is still saved.';
				return;
			}
			const result = parseConceptGenerationResult(body, input);
			if (!result || !project || project.id !== projectId) throw new Error('Invalid portfolio');
			const portfolio = {
				...result,
				generationNumber: (oldPortfolio?.generationNumber ?? 0) + 1,
				generatedAt: new Date().toISOString()
			};
			project = saveProject(window.localStorage, {
				...project,
				stage: 'concepts',
				completedStages: Array.from(new Set([...project.completedStages, 'concepts'])),
				concepts: {
					status: 'ready',
					portfolio
				},
				featureWorkshop: createFeatureWorkshop(portfolio),
				finalization: createProjectFinalization()
			});
			conceptMessage = '';
			performSageEvent('concept-revealed', project);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch {
			conceptMessage = 'The four futures did not stabilize. Your earlier work is still saved.';
		} finally {
			conceptBusy = false;
		}
	}

	function reactToConceptReveal() {
		performSageEvent('concept-revealed');
	}

	function reactToAllConcepts() {
		performSageEvent('concepts-complete');
	}

	function updateFeatureWorkshop(
		next: FeatureWorkshopState,
		event: 'changed' | 'blocked' | 'confirmed'
	) {
		if (!project) return;
		if (event !== 'blocked') {
			const candidate = { ...project, featureWorkshop: next };
			const input = focusedResearchRequest(candidate);
			const fingerprint = input
				? finalizationFingerprint(input.selectedConcept.id, input.includedFeatures)
				: null;
			project = saveProject(window.localStorage, {
				...candidate,
				completedStages: candidate.completedStages.filter((stage) => stage !== 'focused'),
				finalization:
					fingerprint && fingerprint === project.finalization.configurationFingerprint
						? project.finalization
						: createProjectFinalization()
			});
		}
		performSageEvent(
			event === 'confirmed'
				? 'project-selected'
				: event === 'blocked'
					? 'feature-blocked'
					: 'feature-changed',
			project
		);
	}

	function focusedResearchRequest(session: ProjectSession): FocusedResearchRequest | null {
		const selectedConceptId = session.featureWorkshop.selectedConceptId;
		const concept = session.concepts.portfolio?.concepts.find(
			(candidate) => candidate.id === selectedConceptId
		);
		const configuration = session.featureWorkshop.configurations.find(
			(candidate) => candidate.conceptId === selectedConceptId
		);
		const broadResearch = session.research.result;
		const preferences = session.preferences;
		if (
			session.featureWorkshop.status !== 'confirmed' ||
			!concept ||
			!configuration ||
			!broadResearch ||
			preferences.prototypeBudgetUsd === null ||
			(preferences.includeProductionPlanning && preferences.productionBudgetUsd === null)
		)
			return null;

		const included = configuration.features.filter((feature) => feature.included);
		const includedIds = new Set(included.map((feature) => feature.id));
		if (!included.length) return null;
		const selectedConcept: SelectedConceptInput = {
			id: concept.id,
			name: concept.name,
			pitch: concept.pitch,
			description: concept.description,
			targetUser: concept.targetUser,
			distinctApproach: concept.distinctApproach,
			prototypeBudget: concept.prototypeBudget,
			productionBudget: concept.productionBudget,
			prototypeTimeline: concept.prototypeTimeline
		};
		const includedFeatures: SelectedFeatureInput[] = included.map((feature) => ({
			id: feature.id,
			name: feature.name,
			description: feature.description,
			tier: feature.tier,
			dependencies: feature.dependencies.filter((id) => includedIds.has(id))
		}));
		return {
			projectId: session.id,
			topic: session.problemInput.topic,
			problems: session.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
			selectedConcept,
			includedFeatures,
			constraints: { ...preferences.constraints },
			prototypeBudgetUsd: preferences.prototypeBudgetUsd,
			includeProductionPlanning: preferences.includeProductionPlanning,
			productionBudgetUsd: preferences.productionBudgetUsd,
			broadResearch
		};
	}

	function enterFinalizationRoom() {
		if (!project) return;
		const input = focusedResearchRequest(project);
		if (!input) {
			conceptMessage = 'Seal one project with at least one feature before focused research.';
			return;
		}
		const fingerprint = finalizationFingerprint(input.selectedConcept.id, input.includedFeatures);
		project = saveProject(window.localStorage, {
			...project,
			stage: 'focused',
			finalization:
				project.finalization.configurationFingerprint === fingerprint
					? project.finalization
					: { ...createProjectFinalization(), configurationFingerprint: fingerprint }
		});
		finalizationMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function returnToWorkshop() {
		if (!project || focusedResearchIsActive || finalPlanBusy) return;
		project = saveProject(window.localStorage, { ...project, stage: 'concepts' });
		finalizationMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function persistFocusedResearchJob(job: FocusedResearchJobView) {
		if (!project) return;
		project = saveProject(window.localStorage, {
			...project,
			finalization: {
				...project.finalization,
				research: { jobId: job.id, status: job.status, result: job.result },
				plan: job.result ? project.finalization.plan : null
			}
		});
		finalizationMessage = job.message ?? '';
		if (job.status === 'completed' || job.status === 'partial')
			performSageEvent('research-complete', project);
		if (job.status === 'failed') performSageEvent('research-failed', project);
	}

	async function startFocusedResearch() {
		if (!project || focusedResearchBusy || focusedResearchIsActive) return;
		const input = focusedResearchRequest(project);
		if (!input) {
			finalizationMessage = 'The sealed project configuration is incomplete.';
			return;
		}
		focusedResearchBusy = true;
		finalizationMessage = isDemoProject(project)
			? 'Loading the canned configured-project investigation...'
			: 'The Sage is fetching the large computer again...';
		performSageEvent('research-started', project);
		try {
			if (isDemoProject(project)) {
				persistFocusedResearchJob(createDemoFocusedResearchJob(input, 'running'));
				return;
			}
			const response = await fetch(resolve('/api/focused-research/jobs'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});
			const body: unknown = await response.json();
			if (!response.ok) {
				const error = body as { message?: unknown };
				finalizationMessage =
					typeof error.message === 'string' ? error.message : 'Focused research could not start.';
				return;
			}
			const job = parseFocusedResearchJobView(body);
			if (!job) throw new Error('Invalid focused research job');
			persistFocusedResearchJob(job);
		} catch {
			finalizationMessage = 'Focused research could not start. Your chosen project is still saved.';
		} finally {
			focusedResearchBusy = false;
		}
	}

	function completeDemoFocusedResearch(jobId: string) {
		if (!project || project.finalization.research.jobId !== jobId || !isDemoProject(project))
			return;
		const input = focusedResearchRequest(project);
		if (!input) return;
		persistFocusedResearchJob(createDemoFocusedResearchJob(input, 'completed'));
	}

	async function pollFocusedResearchJob(jobId: string) {
		if (!project || !focusedResearchIsActive || project.finalization.research.jobId !== jobId)
			return;
		try {
			const response = await fetch(resolve(`/api/focused-research/jobs/${jobId}`));
			const body: unknown = await response.json();
			if (!response.ok) {
				const error = body as { message?: unknown };
				project = saveProject(window.localStorage, {
					...project,
					finalization: {
						...project.finalization,
						research: { jobId: null, status: 'failed', result: null },
						plan: null
					}
				});
				finalizationMessage =
					typeof error.message === 'string'
						? error.message
						: 'The focused research job disappeared.';
				return;
			}
			const job = parseFocusedResearchJobView(body);
			if (!job) throw new Error('Invalid focused research job');
			persistFocusedResearchJob(job);
		} catch {
			finalizationMessage =
				'The focused research status could not be refreshed. I will keep trying.';
		}
	}

	async function cancelFocusedResearch(silent = false) {
		const jobId = project?.finalization.research.jobId;
		if (!project || !jobId || !focusedResearchIsActive) return;
		if (isDemoProject(project)) {
			project = saveProject(window.localStorage, {
				...project,
				finalization: {
					...project.finalization,
					research: { jobId, status: 'cancelled', result: null },
					plan: null
				}
			});
			if (!silent) finalizationMessage = 'Canned focused research cancelled.';
			return;
		}
		try {
			const response = await fetch(resolve(`/api/focused-research/jobs/${jobId}`), {
				method: 'DELETE'
			});
			const body: unknown = await response.json();
			const job = response.ok ? parseFocusedResearchJobView(body) : null;
			if (job) persistFocusedResearchJob(job);
		} catch {
			if (!silent) finalizationMessage = 'The cancellation signal did not reach the server.';
		}
	}

	async function generateFinalPlan() {
		if (!project || finalPlanBusy || !project.finalization.research.result) return;
		const base = focusedResearchRequest(project);
		if (!base) return;
		const input: FinalRecalculationRequest = {
			...base,
			focusedResearch: project.finalization.research.result
		};
		finalPlanBusy = true;
		finalizationMessage = isDemoProject(project)
			? 'Playing the canned recalculation...'
			: 'The Sage is recalculating every frozen estimate and requirement...';
		try {
			let plan;
			if (isDemoProject(project)) {
				await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 900));
				plan = createDemoFinalPlan(input);
			} else {
				const response = await fetch(resolve('/api/final-plan'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(input)
				});
				const body: unknown = await response.json();
				if (!response.ok) {
					const error = body as { message?: unknown };
					finalizationMessage =
						typeof error.message === 'string' ? error.message : 'The recalculation failed.';
					return;
				}
				plan = parseFinalProjectPlan(body, input);
				if (!plan) throw new Error('Invalid final project plan');
			}
			if (!project) return;
			project = saveProject(window.localStorage, {
				...project,
				completedStages: Array.from(new Set([...project.completedStages, 'focused'])),
				finalization: { ...project.finalization, plan }
			});
			finalizationMessage = 'Every frozen estimate and requirement has been recalculated.';
			performSageEvent('concepts-complete', project);
		} catch {
			finalizationMessage =
				'The recalculated project file did not stabilize. Focused research is still saved.';
		} finally {
			finalPlanBusy = false;
		}
	}

	async function downloadFinalPdf() {
		if (!finalReport || pdfBusy) return;
		pdfBusy = true;
		pdfMessage = 'The Sage is feeding the finished file into the PDF forge...';
		try {
			const response = await fetch(resolve('/api/report/pdf'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(finalReport)
			});
			if (!response.ok) {
				let message = 'The PDF forge jammed. The browser report is still intact.';
				try {
					const body: unknown = await response.json();
					if (
						typeof body === 'object' &&
						body !== null &&
						'message' in body &&
						typeof body.message === 'string'
					)
						message = body.message;
				} catch {
					// Keep the stable forge error when a proxy returns a non-JSON error page.
				}
				throw new Error(message);
			}
			const blob = await response.blob();
			if (blob.type !== 'application/pdf' || blob.size < 1_000)
				throw new Error('The forge returned an empty artifact. Try the download again.');
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = safeReportFilename(finalReport.productName);
			document.body.append(link);
			link.click();
			link.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
			pdfMessage = `PDF forged. ${blob.size.toLocaleString('en-US')} bytes escaped the machine.`;
		} catch (error) {
			pdfMessage =
				error instanceof Error
					? error.message
					: 'The PDF forge jammed. The browser report is still intact.';
		} finally {
			pdfBusy = false;
		}
	}

	function startOver() {
		resetWorldSignal += 1;
		const retainedMuted = project?.personality.muted ?? previewMuted;
		const retainedCalm = project?.personality.calmMode ?? previewCalm;
		void cancelResearchJob(true);
		void cancelFocusedResearch(true);
		if (project) clearChaosRun(window.localStorage, project.id);
		clearProject(window.localStorage);
		project = null;
		stateNotice = 'The active project was cleared. The oracle is ready for a new one.';
		technologyTagDraft = '';
		industryTagDraft = '';
		preferenceError = '';
		preferencesSealed = false;
		insightStatus = 'idle';
		insightMessage = '';
		insightRequestSequence += 1;
		completedInsightSignature = '';
		researchBusy = false;
		researchMessage = '';
		interviewBusy = false;
		interviewMessage = '';
		conceptBusy = false;
		conceptMessage = '';
		focusedResearchBusy = false;
		finalPlanBusy = false;
		finalizationMessage = '';
		pdfBusy = false;
		pdfMessage = '';
		playerNameDraft = '';
		projectNameDraft = '';
		customAnswer = '';
		customAnswerOpen = false;
		problemReviewOpen = false;
		preferenceReviewOpen = false;
		researchScrollOpen = false;
		preferenceStep = 0;
		pauseMenuOpen = false;
		sageSpeaking = false;
		previewMuted = retainedMuted;
		previewCalm = retainedCalm;
		void oracleAudio?.setEnabled(false);
		resetDialog?.close();
	}
</script>

<svelte:head>
	<title>Ideation Akinator</title>
	<meta
		name="description"
		content="Turn a stubborn problem into four researched product ideas and a practical PRD."
	/>
</svelte:head>

<svelte:window onkeydown={handleAppKeydown} />

<div class="star-field" aria-hidden="true"></div>

{#if !data.authenticated}
	<main class="gate-page">
		<section class="gate-window" aria-labelledby="gate-title">
			<div class="window-bar">
				<span class="window-title">IDEA_ORACLE.EXE</span>
				<span class="window-controls" aria-hidden="true"><i></i><i></i><i></i></span>
			</div>

			<div class="gate-grid">
				<div class="sage-stage">
					<span class="spark spark-one" aria-hidden="true">+</span>
					<span class="spark spark-two" aria-hidden="true">+</span>
					<img
						class="sage-image"
						src="/images/signal-sage.png"
						alt="The Signal Sage, a friendly wizard with an old computer monitor for a head"
					/>
					<p class="character-label">THE SIGNAL SAGE</p>
				</div>

				<div class="gate-copy">
					<p class="eyebrow">A private workshop for unruly ideas</p>
					<h1 id="gate-title">Ideation<br /><span>Akinator</span></h1>
					<p class="lede">
						Bring one messy problem. Leave with four researched directions and a plan you could
						actually build.
					</p>

					{#if data.configurationReady}
						<form class="password-form" method="POST" action="?/login" use:enhance={enhanceLogin}>
							<label for="password">Speak the workshop password</label>
							<div class="password-row">
								<input
									id="password"
									name="password"
									type="password"
									autocomplete="current-password"
									required
								/>
								<button class="pixel-button" type="submit" disabled={submitting}>
									{submitting ? 'Consulting...' : 'Enter workshop'}
								</button>
							</div>
							{#if form?.message}
								<p class="form-message" role="alert">{form.message}</p>
							{/if}
						</form>
					{:else}
						<div class="setup-message" role="status">
							The workshop owner still needs to configure its password secret.
						</div>
					{/if}

					<p class="local-note">
						<span aria-hidden="true">◆</span> One shared password. No accounts.
					</p>
				</div>
			</div>
		</section>
		<p class="gate-footer">
			Best viewed on a computer with at least one questionable desktop theme.
		</p>
	</main>
{:else}
	<div
		class="app-frame vertical-game"
		class:dialogue-layout={visualProject.stage !== 'concepts'}
		class:calm-mode={visualProject.personality.calmMode}
		data-stage={visualProject.stage}
		data-era={worldEra}
	>
		<VerticalWorld
			altitude={sageAltitude}
			stage={visualProject.stage}
			calm={visualProject.personality.calmMode}
			resetSignal={resetWorldSignal}
			onInteract={() => playSageCue('blip')}
		/>
		{#if stateReady}
			<SageStage
				personality={visualProject.personality}
				altitude={sageAltitude}
				researching={researchIsActive}
				speaking={sageSpeaking}
				voicePulse={sageVoicePulse}
				voiceEnergy={sageVoiceEnergy}
				resetSignal={resetWorldSignal}
				allowPopup={!!project && project.stage !== 'welcome' && !researchIsActive}
				onSecret={findForbiddenFloppy}
			/>
		{/if}
		{#if project && project.stage !== 'welcome'}
			<ChaosLayer
				projectId={project.id}
				stage={project.stage}
				calm={project.personality.calmMode}
				researching={researchIsActive}
				tutorialComplete={project.personality.achievements.includes('FORBIDDEN FLOPPY')}
				onAchievement={grantAchievement}
				onCue={playSageCue}
				onPurlShoo={() => performSageEvent('purl-shooed')}
				onPurlHelp={() => performSageEvent('purl-helped')}
			/>
		{/if}
		<header class="game-hud">
			{#if demoMode}<span class="demo-badge token-free">NO TOKENS</span>{/if}
			<button
				class="pause-button"
				type="button"
				onclick={togglePauseMenu}
				aria-expanded={pauseMenuOpen}
				aria-controls="game-pause-menu"
			>
				<span aria-hidden="true">▮▮</span> Menu
			</button>
			{#if pauseMenuOpen}
				<section id="game-pause-menu" class="pause-menu" aria-label="Game menu">
					<header>
						<span>SAGE_OS</span><button type="button" onclick={togglePauseMenu}>×</button>
					</header>
					<p>THE RITUAL IS PAUSED</p>
					<button type="button" onclick={toggleSageAudio}>
						{visualProject.personality.muted ? 'Sound: off' : 'Sound: on'}
					</button>
					<button type="button" onclick={toggleCalmMode}>
						{visualProject.personality.calmMode ? 'Chaos: restrained' : 'Chaos: enabled'}
					</button>
					{#if demoMode}<button type="button" onclick={restartDemo}>Restart demo</button>{/if}
					{#if project}
						<button
							type="button"
							onclick={() => {
								pauseMenuOpen = false;
								resetDialog?.showModal();
							}}>Start over</button
						>
					{/if}
					<form method="POST" action="?/logout">
						<button type="submit">Lock workshop</button>
					</form>
					<small>ESC closes this extremely advanced menu.</small>
				</section>
			{/if}
		</header>

		<div class="workspace" class:has-companion={project && project.stage !== 'welcome'}>
			{#if visualProject.stage !== 'concepts'}
				<main class="dialogue-workbench">
					{#if stateNotice}
						<div class="floating-state-notice" role="status">{stateNotice}</div>
					{/if}

					{#if !stateReady}
						<SageDialogue
							altitude={sageAltitude}
							personality={visualProject.personality}
							mode="wait"
							label="RESTORING THE PROPHECY"
							prompt="Hold still. I am checking beneath the browser cushions."
							onSpeakCharacter={playSageVoice}
							onSpeakingChange={setSageSpeaking}
						>
							<div class="dialogue-loader"><i></i><span>Reading saved project...</span></div>
						</SageDialogue>
					{:else if project?.stage === 'problem'}
						<SageDialogue
							altitude={sageAltitude}
							personality={project.personality}
							label={`CLUE ${String(project.problemInput.cards.length).padStart(2, '0')}`}
							meta={`${filledProblemCount} offered · ${project.problemInput.clarityLabel ?? 'signal unread'}`}
							prompt={filledProblemCount === 0
								? 'What mortal inconvenience summoned you?'
								: 'Is there another problem from this same cursed situation?'}
							onSpeakCharacter={playSageVoice}
							onSpeakingChange={setSageSpeaking}
						>
							<div class="dialogue-form problem-response">
								<label class="compact-field">
									<span>Short topic name <small>optional</small></span>
									<input
										type="text"
										value={project.problemInput.topic}
										placeholder="Campus transit, shop inventory, meal planning..."
										oninput={(event) => setTopic(event.currentTarget.value)}
									/>
								</label>
								{#if activeProblemCard}
									<label class="compact-field main-response">
										<span>Offer the Sage a specific clue</span>
										<textarea
											rows="4"
											value={activeProblemCard.text}
											placeholder="Who is affected, what happens, and why does it keep being annoying?"
											oninput={(event) =>
												setProblemText(activeProblemCard.id, event.currentTarget.value)}></textarea>
									</label>
								{/if}

								<div class="clarity-whisper" aria-live="polite">
									<div>
										<span>UNDERSTANDING</span><b>{project.problemInput.clarityLabel ?? 'STATIC'}</b>
									</div>
									<div class="mini-reading-track">
										<i style={`width: ${(clarityPosition / CLARITY_LABELS.length) * 100}%`}></i>
									</div>
									<small
										>{insightStatus === 'idle'
											? 'The crystal wakes when you type.'
											: insightMessage}</small
									>
								</div>

								{#if project.problemInput.topicCoherenceWarning}
									<p class="dialogue-warning">{project.problemInput.topicCoherenceWarning}</p>
								{/if}

								<div class="dialogue-primary-actions">
									<button
										class="answer-button secondary"
										type="button"
										disabled={!activeProblemCard?.text.trim()}
										onclick={addProblem}>Yes, another clue</button
									>
									<button
										class="answer-button primary"
										type="button"
										disabled={filledProblemCount === 0}
										onclick={goToPreferences}>No, set the limitations</button
									>
								</div>
								<button
									class="quiet-game-action"
									type="button"
									onclick={() => (problemReviewOpen = true)}
								>
									Review my {filledProblemCount || 'empty'} clue{filledProblemCount === 1
										? ''
										: 's'}
								</button>
							</div>
						</SageDialogue>

						<SummonedScroll
							open={problemReviewOpen}
							title="Clues already offered"
							kicker="THE SAGE'S QUESTIONABLE NOTES"
							onClose={() => (problemReviewOpen = false)}
						>
							<div class="scroll-problem-list">
								{#each project.problemInput.cards as card, index (card.id)}
									<article>
										<header>
											<b>CLUE {String(index + 1).padStart(2, '0')}</b><button
												type="button"
												onclick={() => removeProblem(card.id)}>Remove</button
											>
										</header>
										<textarea
											rows="4"
											value={card.text}
											oninput={(event) => setProblemText(card.id, event.currentTarget.value)}
										></textarea>
										<div>
											<button
												type="button"
												disabled={index === 0}
												onclick={() => moveProblem(index, -1)}>Move up</button
											><button
												type="button"
												disabled={index === project.problemInput.cards.length - 1}
												onclick={() => moveProblem(index, 1)}>Move down</button
											>
										</div>
									</article>
								{/each}
							</div>
						</SummonedScroll>
					{:else if project?.stage === 'preferences'}
						<SageDialogue
							altitude={sageAltitude}
							personality={project.personality}
							label={`LIMITATION ${preferenceStep + 1} OF 5`}
							meta="one ridiculous constraint at a time"
							prompt={preferencePrompts[preferenceStep] ?? preferencePrompts[0]}
							onSpeakCharacter={playSageVoice}
							onSpeakingChange={setSageSpeaking}
						>
							<div class="dialogue-form preference-response">
								{#if preferenceStep === 0}
									<div class="tag-editor game-tag-editor">
										<div class="tag-list">
											{#each project.preferences.technologyTags as tag (tag)}<span class="tag-chip"
													>{tag}<button type="button" onclick={() => removeTag('technology', tag)}
														>×</button
													></span
												>{/each}
											<input
												bind:value={technologyTagDraft}
												onkeydown={(event) => tagKeydown(event, 'technology')}
												placeholder="Open to anything, TypeScript, Arduino..."
											/>
										</div>
										<button type="button" onclick={() => addTag('technology')}>Add</button>
									</div>
								{:else if preferenceStep === 1}
									<div class="detected-tags">
										{#each project.preferences.selectedIndustryTags as tag (tag)}
											<button type="button" onclick={() => removeTag('industry', tag)}
												><span>✓</span>{tag}<small>remove</small></button
											>
										{/each}
									</div>
									<div class="tag-editor game-tag-editor">
										<div class="tag-list">
											<input
												bind:value={industryTagDraft}
												onkeydown={(event) => tagKeydown(event, 'industry')}
												placeholder="Add another industry..."
											/>
										</div>
										<button type="button" onclick={() => addTag('industry')}>Add</button>
									</div>
								{:else if preferenceStep === 2}
									<div class="rpg-meter innovation-meter">
										<header>
											<b>{project.preferences.innovationLevel}</b>
											<span>{innovationLabels[project.preferences.innovationLevel - 1]}</span>
										</header>
										<input
											type="range"
											min="1"
											max="5"
											step="1"
											value={project.preferences.innovationLevel}
											oninput={(event) => setInnovationLevel(event.currentTarget.valueAsNumber)}
											aria-label="Innovation level"
										/>
										<div class="rpg-meter-ticks" aria-hidden="true">
											{#each innovationLabels as anchor, index (anchor)}<i
													data-label={anchor}
													class:active={index + 1 <= project.preferences.innovationLevel}
												></i>{/each}
										</div>
									</div>
								{:else if preferenceStep === 3}
									<div class="game-budget-grid">
										<label class="compact-field rpg-budget"
											><span>Prototype budget in USD</span><input
												type="number"
												min="0"
												value={project.preferences.prototypeBudgetUsd ?? ''}
												oninput={(event) => setBudget('prototype', event.currentTarget)}
												placeholder="2500"
											/><span class="budget-track" aria-hidden="true"
												><i
													style={`width: ${budgetMeterPercent(project.preferences.prototypeBudgetUsd)}%`}
												></i></span
											></label
										>
										<label class="game-toggle"
											><input
												type="checkbox"
												checked={project.preferences.includeProductionPlanning}
												onchange={(event) => setProductionPlanning(event.currentTarget.checked)}
											/><span>Also plan production costs</span></label
										>
										{#if project.preferences.includeProductionPlanning}<label
												class="compact-field rpg-budget"
												><span>Production budget in USD</span><input
													type="number"
													min="0"
													value={project.preferences.productionBudgetUsd ?? ''}
													oninput={(event) => setBudget('production', event.currentTarget)}
													placeholder="25000"
												/><span class="budget-track" aria-hidden="true"
													><i
														style={`width: ${budgetMeterPercent(project.preferences.productionBudgetUsd)}%`}
													></i></span
												></label
											>{/if}
									</div>
								{:else}
									<label class="compact-field main-response"
										><span
											>The one constraint most likely to ruin a bad idea <small>optional</small
											></span
										><textarea
											rows="3"
											value={project.preferences.constraints.other}
											oninput={(event) => setConstraint('other', event.currentTarget.value)}
											placeholder="Must be usable by one person, cannot need a subscription, has to fit in a backpack..."
										></textarea></label
									>
									<button
										class="quiet-game-action"
										type="button"
										onclick={() => (preferenceReviewOpen = true)}
										>Open the complete limitation spellbook</button
									>
								{/if}

								{#if preferenceError}<p class="dialogue-warning" role="alert">
										{preferenceError}
									</p>{/if}
								<div class="dialogue-primary-actions split">
									<button
										class="answer-button secondary"
										type="button"
										onclick={previousPreferenceStep}>Back</button
									>
									{#if preferenceStep < 4}
										<button class="answer-button primary" type="button" onclick={nextPreferenceStep}
											>That will do</button
										>
									{:else}
										<button class="answer-button primary" type="button" onclick={sealPreferences}
											>Open the terrible web</button
										>
									{/if}
								</div>
							</div>
						</SageDialogue>

						<SummonedScroll
							open={preferenceReviewOpen}
							title="The complete limitation spellbook"
							kicker="EDITING REALITY'S FINE PRINT"
							onClose={() => (preferenceReviewOpen = false)}
						>
							<div class="scroll-constraint-grid">
								{#each constraintFields as field (field.key)}
									<label class:wide={field.wide}
										><span>{field.label}</span><input
											type="text"
											value={project.preferences.constraints[field.key]}
											placeholder={field.placeholder}
											oninput={(event) => setConstraint(field.key, event.currentTarget.value)}
										/></label
									>
								{/each}
							</div>
						</SummonedScroll>
					{:else if project?.stage === 'research'}
						{#if project.research.status === 'idle'}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								label="THE TERRIBLE WEB"
								meta="one to two mortal minutes"
								prompt="Shall I fetch the large computer and investigate this properly?"
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form research-launch">
									<p>
										I will check competitors, adjacent tools, failed attempts, prior art, standards,
										customer complaints, and useful technical parts.
									</p>
									<div class="research-boundary-chips">
										<span
											>${project.preferences.prototypeBudgetUsd?.toLocaleString()} prototype</span
										>{#each project.preferences.selectedIndustryTags as tag (tag)}<span>{tag}</span
											>{/each}
									</div>
									{#if researchMessage}<p class="dialogue-warning" role="alert">
											{researchMessage}
										</p>{/if}
									<div class="dialogue-primary-actions">
										<button class="answer-button secondary" type="button" onclick={goToPreferences}
											>Reconsider limitations</button
										><button
											class="answer-button primary"
											type="button"
											disabled={researchBusy}
											onclick={startBroadResearch}
											>{researchBusy ? 'Finding the computer...' : 'Begin research'}</button
										>
									</div>
								</div>
							</SageDialogue>
						{:else if broadResearchIsActive || (project.research.result && broadResearchPerformanceOpen)}
							<ResearchWorkstation
								active={true}
								calm={project.personality.calmMode || broadResearchSkipped}
								projectId={project.id}
								task="broad"
								message={researchMessage}
								sourceCount={researchSourceCount}
								complete={!!project.research.result}
								summary={project.research.result?.summary ?? ''}
								findingCount={project.research.result?.findings.length ?? 0}
								gapCount={project.research.result?.gaps.length ?? 0}
								onCancel={() => cancelResearchJob()}
								onInspect={() => {
									broadResearchPerformanceOpen = false;
									researchScrollOpen = true;
								}}
								onContinue={() => (broadResearchPerformanceOpen = false)}
								onSkip={skipBroadResearchPerformance}
							/>
						{:else if project.research.result}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="announce"
								label="RECOVERED FILES"
								meta={`${project.research.result.sources.length} sources bound`}
								prompt="I have returned from the web. It was worse than I remembered."
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form research-complete-summary">
									<p>{project.research.result.summary}</p>
									<div class="research-result-counts">
										<span><b>{project.research.result.findings.length}</b> findings</span><span
											><b>{project.research.result.sources.length}</b> sources</span
										><span><b>{project.research.result.gaps.length}</b> gaps</span>
									</div>
									<div class="dialogue-primary-actions">
										<button
											class="answer-button secondary"
											type="button"
											onclick={() => (researchScrollOpen = true)}>Unfurl recovered files</button
										><button class="answer-button primary" type="button" onclick={enterInterview}
											>Begin interrogation</button
										>
									</div>
								</div>
							</SageDialogue>

							<SummonedScroll
								open={researchScrollOpen}
								title="Research recovered from the web"
								kicker={`${project.research.result.sources.length} SOURCES BOUND`}
								onClose={() => (researchScrollOpen = false)}
							>
								<div class="scroll-research-brief">
									<p class="scroll-summary">{project.research.result.summary}</p>
									<p>{project.research.result.disclaimer}</p>
									{#each RESEARCH_CATEGORIES as category (category)}
										{@const categoryFindings = project.research.result.findings.filter(
											(finding) => finding.category === category
										)}
										{#if categoryFindings.length}<section>
												<h3>{researchCategoryLabels[category]}</h3>
												{#each categoryFindings as finding (finding.id)}<article>
														<h4>{finding.title}</h4>
														<p>{finding.claim}</p>
														{#if finding.interpretation}<p>
																<b>Why it may matter:</b>
																{finding.interpretation}
															</p>{/if}
														<div>
															{#each finding.sourceIds as sourceId (sourceId)}{@const source =
																	sourceFor(sourceId)}{#if source}<a
																		href={source.url}
																		target="_blank"
																		rel="external noreferrer">{source.title}</a
																	>{/if}{/each}
														</div>
													</article>{/each}
											</section>{/if}
									{/each}
									{#if project.research.result.gaps.length}<section>
											<h3>Where the signal was weak</h3>
											<ul>
												{#each project.research.result.gaps as gap (`${gap.category}-${gap.reason}`)}<li
													>
														<b>{researchCategoryLabels[gap.category]}</b>
														{gap.reason}
													</li>{/each}
											</ul>
										</section>{/if}
									<details>
										<summary>Source ledger ({project.research.result.sources.length})</summary>
										<ol>
											{#each project.research.result.sources as source (source.id)}<li>
													<a href={source.url} target="_blank" rel="external noreferrer"
														>{source.title}</a
													><small
														>{source.publisher} · {source.publicationDate ?? 'date unknown'}</small
													>
													<p>{source.evidenceSummary}</p>
												</li>{/each}
										</ol>
									</details>
								</div>
							</SummonedScroll>
						{:else}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="announce"
								label="THE SIGNAL BROKE"
								prompt={researchMessage || 'The large computer has betrayed us.'}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form">
									<p>Your problems, preferences, and budget are still saved.</p>
									<div class="dialogue-primary-actions">
										<button class="answer-button secondary" type="button" onclick={goToPreferences}
											>Check limitations</button
										><button
											class="answer-button primary"
											type="button"
											onclick={retryBroadResearch}>Try a fresh pass</button
										>
									</div>
								</div>
							</SageDialogue>
						{/if}
					{:else if project?.stage === 'questions'}
						{#if project.interview.status === 'completed' || project.interview.status === 'ended-early'}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="announce"
								label="THE SIGNAL IS SHARP ENOUGH"
								meta={`${answeredQuestionCount} responses recorded`}
								prompt={project.interview.status === 'ended-early'
									? 'Fine. I will guess before wisdom arrives.'
									: 'Your future project is becoming embarrassingly obvious.'}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form">
									<p>{project.interview.completionReason}</p>
									<div class="dialogue-primary-actions">
										<button class="answer-button secondary" type="button" onclick={goToResearch}
											>Inspect research</button
										><button class="answer-button primary" type="button" onclick={enterConceptRoom}
											>{project.concepts.portfolio
												? 'Return to four futures'
												: 'Guess my future project'}</button
										>
									</div>
								</div>
							</SageDialogue>
						{:else if !currentQuestion}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="wait"
								label="FORMING THE NEXT INQUIRY"
								prompt={interviewBusy
									? 'My modem is choosing one useful question.'
									: 'The next question fell behind the desk.'}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form">
									{#if interviewMessage}<p class="dialogue-warning">
											{interviewMessage}
										</p>{/if}{#if !interviewBusy}<button
											class="answer-button primary"
											type="button"
											onclick={() => requestNextInterview()}>Try the question again</button
										>{/if}
								</div>
							</SageDialogue>
						{:else}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								label={`INQUIRY ${project.interview.currentQuestionIndex + 1}`}
								meta={`${answeredQuestionCount} answered`}
								prompt={currentQuestion.prompt}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form interview-response">
									<details class="why-whisper">
										<summary>Why are you asking?</summary>
										<p>{currentQuestion.whyItMatters}</p>
									</details>
									{#if currentQuestion.type === 'text'}
										<label class="compact-field main-response"
											><span>Your answer</span><textarea
												rows="4"
												maxlength="2000"
												bind:value={textAnswer}
												placeholder="A rough answer is enough..."></textarea></label
										>
									{:else if currentQuestion.type === 'single-choice'}
										<div class="game-choice-list">
											{#each currentQuestion.options as option (option.id)}<button
													type="button"
													disabled={interviewBusy}
													onclick={() => {
														customAnswerOpen = false;
														submitInterviewAnswer('answered', option.id);
													}}>{option.label}</button
												>{/each}<button
												class:chosen={customAnswerOpen}
												type="button"
												onclick={openCustomAnswer}>Something else...</button
											>
										</div>
									{:else if currentQuestion.type === 'multiple-choice'}
										<div class="game-choice-list multiple">
											{#each currentQuestion.options as option (option.id)}<button
													class:chosen={multipleAnswer.includes(option.id)}
													type="button"
													onclick={() =>
														toggleMultipleAnswer(option.id, !multipleAnswer.includes(option.id))}
													><span>{multipleAnswer.includes(option.id) ? '✓' : '+'}</span
													>{option.label}</button
												>{/each}<button
												class:chosen={customAnswerOpen}
												type="button"
												onclick={() => (customAnswerOpen = !customAnswerOpen)}
												>Something else...</button
											>
										</div>
									{:else if currentQuestion.type === 'yes-no'}
										<div class="game-choice-list two">
											<button
												type="button"
												disabled={interviewBusy}
												onclick={() => submitInterviewAnswer('answered', true)}>Yes</button
											><button
												type="button"
												disabled={interviewBusy}
												onclick={() => submitInterviewAnswer('answered', false)}>No</button
											>
										</div>
									{:else}
										<label class="compact-field"
											><span
												>{currentQuestion.type === 'budget'
													? 'Amount in USD'
													: (currentQuestion.unit ?? 'Number')}</span
											><input
												type="number"
												min={currentQuestion.minimum ?? undefined}
												max={currentQuestion.maximum ?? undefined}
												bind:value={numberAnswer}
												placeholder="0"
											/></label
										>
									{/if}

									{#if customAnswerOpen}<label class="compact-field custom-answer"
											><span>Type your own answer</span>
											<div>
												<input
													bind:value={customAnswer}
													maxlength="2000"
													placeholder="The option the Sage somehow missed..."
												/><button
													class="answer-button primary"
													type="button"
													disabled={!customAnswer.trim() || interviewBusy}
													onclick={() => submitInterviewAnswer('answered')}>Use this</button
												>
											</div></label
										>{/if}

									{#if interviewMessage}<p class="dialogue-warning" role="alert">
											{interviewMessage}
										</p>{/if}
									{#if currentQuestion.type === 'text' || currentQuestion.type === 'number' || currentQuestion.type === 'budget' || currentQuestion.type === 'multiple-choice'}<button
											class="answer-button primary full"
											type="button"
											disabled={interviewBusy}
											onclick={() => submitInterviewAnswer('answered')}
											>{interviewBusy ? 'Thinking...' : 'Answer and continue'}</button
										>{/if}
									<div class="minor-answer-actions">
										<button
											type="button"
											disabled={interviewBusy}
											onclick={() => submitInterviewAnswer('skipped')}>Skip this</button
										><button
											type="button"
											disabled={interviewBusy}
											onclick={() => submitInterviewAnswer('unknown')}>I do not know</button
										><button
											type="button"
											disabled={interviewBusy || project.interview.currentQuestionIndex === 0}
											onclick={previousInterviewQuestion}>Previous</button
										><button
											type="button"
											disabled={interviewBusy}
											onclick={() => interviewDialog?.showModal()}>End early</button
										>
									</div>
								</div>
							</SageDialogue>
						{/if}
					{:else if project?.stage === 'focused'}
						{@const focusedInput = focusedResearchRequest(project)}
						{#if focusedInput}
							<FinalizationRoom
								projectId={project.id}
								concept={focusedInput.selectedConcept}
								features={focusedInput.includedFeatures}
								finalization={project.finalization}
								personality={project.personality}
								altitude={sageAltitude}
								researchBusy={focusedResearchBusy}
								planBusy={finalPlanBusy}
								report={finalReport}
								{pdfBusy}
								{pdfMessage}
								message={finalizationMessage}
								onStartResearch={startFocusedResearch}
								onCancelResearch={() => cancelFocusedResearch()}
								onSkipResearch={skipFocusedResearchPerformance}
								onGeneratePlan={generateFinalPlan}
								onDownloadPdf={downloadFinalPdf}
								onBack={returnToWorkshop}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							/>
						{:else}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="announce"
								label="THE SEAL IS MISSING"
								prompt="Return to the workshop and choose one valid configuration."
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<button class="answer-button primary" type="button" onclick={returnToWorkshop}
									>Return to workshop</button
								>
							</SageDialogue>
						{/if}
					{:else}
						<SageDialogue
							altitude={sageAltitude}
							personality={visualProject.personality}
							label="WELCOME, POSSIBLE MORTAL"
							prompt="Bring me a problem. I will guess the project hiding inside it."
							onSpeakCharacter={playSageVoice}
							onSpeakingChange={setSageSpeaking}
						>
							<div class="dialogue-form welcome-response">
								<p>
									I will research what already exists, interrogate you briefly, and reveal four
									buildable futures.
								</p>
								<div class="welcome-name-grid game-name-grid">
									<label
										><span>What should I call you? <small>optional</small></span><input
											maxlength="50"
											bind:value={playerNameDraft}
											placeholder="Mortal, Evan, Captain..."
										/></label
									><label
										><span>Working project name <small>probably wrong</small></span><input
											maxlength="50"
											bind:value={projectNameDraft}
											placeholder="Operation Mystery Box"
										/></label
									>
								</div>
								<button class="answer-button primary full" type="button" onclick={beginProject}
									>Begin the divination</button
								>
								<div class="demo-launch-divider"><span>or inspect the machinery</span></div>
								<button class="answer-button demo-launch full" type="button" onclick={beginDemo}>
									Run the token-free visual demo
								</button>
								<small class="demo-launch-note">
									Uses canned research, questions, and ideas. Every screen still works.
								</small>
								<small>No account. This project stays in this browser.</small>
							</div>
						</SageDialogue>
					{/if}
				</main>
			{/if}

			<main class="workbench" class:legacy-hidden={visualProject.stage !== 'concepts'}>
				{#if stateNotice}
					<div class="state-notice" role="status">
						<span aria-hidden="true">i</span>
						{stateNotice}
					</div>
				{/if}

				{#if !stateReady}
					<section class="loading-panel" aria-live="polite">
						<div class="loading-orb" aria-hidden="true"></div>
						<p>Dusting off your last session...</p>
					</section>
				{:else if project?.stage === 'problem'}
					<section class="intake-room" aria-labelledby="problem-room-title">
						<div class="room-heading">
							<div>
								<p class="room-number">ROOM 01 / PROBLEM</p>
								<h1 id="problem-room-title">What keeps getting in the way?</h1>
								<p>
									Add several problems if they belong to the same general topic. Specific situations
									matter more than polished writing.
								</p>
							</div>
							<div class="reading-card" aria-label="Problem clarity reading">
								<span>CLARITY READING</span>
								<strong>{project.problemInput.clarityLabel ?? 'Signal not read yet'}</strong>
								<div class="reading-track" aria-hidden="true">
									<i style={`width: ${(clarityPosition / CLARITY_LABELS.length) * 100}%`}></i>
								</div>
								<p class="reading-status" aria-live="polite">
									{insightStatus === 'idle'
										? 'Describe a problem to start the live reading. It never blocks progress.'
										: insightMessage}
								</p>
								{#if project.problemInput.clarityReasons.length > 0}
									<ul class="reading-reasons">
										{#each project.problemInput.clarityReasons as reason (reason)}
											<li>{reason}</li>
										{/each}
									</ul>
								{/if}
								{#if project.problemInput.topicCoherenceWarning}
									<p class="coherence-warning" role="status">
										<span aria-hidden="true">!</span>{project.problemInput.topicCoherenceWarning}
									</p>
								{/if}
								{#if insightStatus === 'error' || insightStatus === 'unavailable'}
									<button class="reading-retry" type="button" onclick={retryIntakeInsights}
										>Try reading again</button
									>
								{/if}
							</div>
						</div>

						<label class="field-block topic-field">
							<span>Short topic name <small>optional</small></span>
							<input
								type="text"
								value={project.problemInput.topic}
								placeholder="Campus transportation, workshop inventory, meal planning..."
								oninput={(event) => setTopic(event.currentTarget.value)}
							/>
						</label>

						<div class="problem-list">
							{#each project.problemInput.cards as card, index (card.id)}
								<article class="problem-card">
									<div class="card-number">
										<span>PROBLEM</span><b>{String(index + 1).padStart(2, '0')}</b>
									</div>
									<label for={`problem-${card.id}`}
										>Describe what happens, who it affects, and why it is frustrating.</label
									>
									<textarea
										id={`problem-${card.id}`}
										rows="4"
										value={card.text}
										placeholder="Example: Students miss the last campus bus because route updates are posted in three different places..."
										oninput={(event) => setProblemText(card.id, event.currentTarget.value)}
									></textarea>
									<div class="card-tools">
										<button
											type="button"
											disabled={index === 0}
											onclick={() => moveProblem(index, -1)}
											aria-label={`Move problem ${index + 1} up`}>↑ Up</button
										>
										<button
											type="button"
											disabled={index === project.problemInput.cards.length - 1}
											onclick={() => moveProblem(index, 1)}
											aria-label={`Move problem ${index + 1} down`}>↓ Down</button
										>
										<button
											class="remove-control"
											type="button"
											onclick={() => removeProblem(card.id)}>Remove</button
										>
									</div>
								</article>
							{/each}
						</div>

						<button class="add-card-button" type="button" onclick={addProblem}>
							<span aria-hidden="true">+</span> Add another related problem
						</button>

						<div class="room-actions">
							<button class="text-button" type="button" onclick={() => resetDialog?.showModal()}
								>Start over</button
							>
							<button class="summon-button compact" type="button" onclick={goToPreferences}>
								<span>Set preferences</span><i aria-hidden="true">→</i>
							</button>
						</div>
					</section>
				{:else if project?.stage === 'preferences'}
					<section class="intake-room preferences-room" aria-labelledby="preferences-room-title">
						<div class="room-heading preferences-heading">
							<div>
								<p class="room-number">ROOM 02 / PREFERENCES</p>
								<h1 id="preferences-room-title">Set the edges of the spell.</h1>
								<p>These guide the ideas. Technology choices are preferences, not hard limits.</p>
							</div>
							<div class="problem-count-card">
								<strong
									>{project.problemInput.cards.filter((card) => card.text.trim()).length}</strong
								>
								<span>problem notes</span>
								<button type="button" onclick={goToProblem}>Edit them</button>
							</div>
						</div>

						<div class="preference-sections">
							<section class="preference-panel" aria-labelledby="technology-title">
								<div class="panel-title">
									<span>01</span>
									<div>
										<h2 id="technology-title">Preferred technology</h2>
										<p>Add a tag, then press Enter or comma.</p>
									</div>
								</div>
								<div class="tag-editor">
									<div class="tag-list">
										{#each project.preferences.technologyTags as tag (tag)}
											<span class="tag-chip"
												>{tag}<button
													type="button"
													onclick={() => removeTag('technology', tag)}
													aria-label={`Remove ${tag}`}>×</button
												></span
											>
										{/each}
										<input
											bind:value={technologyTagDraft}
											onkeydown={(event) => tagKeydown(event, 'technology')}
											placeholder="TypeScript, Arduino, open to anything..."
											aria-label="Add a technology preference"
										/>
									</div>
									<button type="button" onclick={() => addTag('technology')}>Add</button>
								</div>
							</section>

							<section class="preference-panel" aria-labelledby="industry-title">
								<div class="panel-title">
									<span>02</span>
									<div>
										<h2 id="industry-title">Industries</h2>
										<p>The Sage selects likely industries. Remove any that do not fit.</p>
									</div>
								</div>
								<div class="tag-editor">
									<div class="tag-list">
										{#each project.preferences.selectedIndustryTags as tag (tag)}
											<span class="tag-chip industry"
												>{tag}{#if project.preferences.suggestedIndustryTags.some((entry) => entry.toLocaleLowerCase() === tag.toLocaleLowerCase())}<small
														>AUTO</small
													>{/if}<button
													type="button"
													onclick={() => removeTag('industry', tag)}
													aria-label={`Remove ${tag}`}>×</button
												></span
											>
										{/each}
										<input
											bind:value={industryTagDraft}
											onkeydown={(event) => tagKeydown(event, 'industry')}
											placeholder="Education, logistics, consumer..."
											aria-label="Add an industry"
										/>
									</div>
									<button type="button" onclick={() => addTag('industry')}>Add</button>
								</div>
								{#if insightStatus === 'waiting' || insightStatus === 'loading'}
									<p class="industry-reading-note" aria-live="polite">
										<span class="status-light" aria-hidden="true"></span>{insightMessage}
									</p>
								{:else if project.preferences.dismissedIndustryTags.length > 0}
									<p class="industry-reading-note">
										Removed suggestions stay out unless you add them back yourself.
									</p>
								{/if}
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="innovation-title">
								<div class="panel-title">
									<span>03</span>
									<div>
										<h2 id="innovation-title">Innovation level</h2>
										<p>Every setting still returns at least one practical idea.</p>
									</div>
								</div>
								<div class="innovation-readout">
									<b>{project.preferences.innovationLevel}</b><strong
										>{innovationLabels[project.preferences.innovationLevel - 1]}</strong
									>
								</div>
								<input
									class="innovation-range"
									type="range"
									min="1"
									max="5"
									step="1"
									value={project.preferences.innovationLevel}
									oninput={(event) => setInnovationLevel(event.currentTarget.valueAsNumber)}
									aria-labelledby="innovation-title"
								/>
								<div class="range-labels" aria-hidden="true">
									<span>Corporate</span><span>Buildable weirdness</span>
								</div>
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="budget-title">
								<div class="panel-title">
									<span>04</span>
									<div>
										<h2 id="budget-title">Total budget</h2>
										<p>
											Include design, parts, hosting, testing, fees, and other real costs. Developer
											labor is not the only expense.
										</p>
									</div>
								</div>
								<div class="budget-grid">
									<label class="money-field"
										><span>Prototype budget</span>
										<div>
											<b>$</b><input
												type="number"
												min="0"
												step="1"
												inputmode="decimal"
												value={project.preferences.prototypeBudgetUsd ?? ''}
												oninput={(event) => setBudget('prototype', event.currentTarget)}
												placeholder="2500"
											/><i>USD</i>
										</div></label
									>
									<label class="production-toggle"
										><input
											type="checkbox"
											checked={project.preferences.includeProductionPlanning}
											onchange={(event) => setProductionPlanning(event.currentTarget.checked)}
										/><span
											><strong>Plan for production</strong><small
												>Include manufacturing, launch, or production-scale costs.</small
											></span
										></label
									>
									{#if project.preferences.includeProductionPlanning}
										<label class="money-field"
											><span>Production budget</span>
											<div>
												<b>$</b><input
													type="number"
													min="0"
													step="1"
													inputmode="decimal"
													value={project.preferences.productionBudgetUsd ?? ''}
													oninput={(event) => setBudget('production', event.currentTarget)}
													placeholder="25000"
												/><i>USD</i>
											</div></label
										>
									{/if}
								</div>
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="constraints-title">
								<div class="panel-title">
									<span>05</span>
									<div>
										<h2 id="constraints-title">Useful constraints</h2>
										<p>All optional. Add only what would change the ideas.</p>
									</div>
								</div>
								<div class="constraint-grid">
									{#each constraintFields as field (field.key)}
										<label class:wide={field.wide}
											><span>{field.label}</span><input
												type="text"
												value={project.preferences.constraints[field.key]}
												placeholder={field.placeholder}
												oninput={(event) => setConstraint(field.key, event.currentTarget.value)}
											/></label
										>
									{/each}
								</div>
							</section>
						</div>

						{#if preferenceError}<p class="intake-error" role="alert">{preferenceError}</p>{/if}
						{#if preferencesSealed}
							<div class="intake-success" role="status">
								<span>✓</span>
								<div>
									<strong>Intake complete</strong>
									<p>
										Your problem reading, preferences, and industry choices are saved. Broad
										research is next.
									</p>
								</div>
							</div>
						{/if}
						<div class="room-actions">
							<button class="secondary-button" type="button" onclick={goToProblem}
								>← Back to problems</button
							>
							<button class="summon-button compact" type="button" onclick={sealPreferences}
								><span>Save preferences</span><i aria-hidden="true">✓</i></button
							>
						</div>
					</section>
				{:else if project?.stage === 'research'}
					<section class="intake-room research-room" aria-labelledby="research-room-title">
						<div class="room-heading research-heading">
							<div>
								<p class="room-number">ROOM 03 / BROAD RESEARCH</p>
								<h1 id="research-room-title">Find the shape of the territory.</h1>
								<p>
									This is a one-to-two-minute foothold. It checks what exists, what failed, and
									which constraints may matter before the Sage starts asking questions.
								</p>
							</div>
							<div class="research-seal" class:lit={project.research.result}>
								<span aria-hidden="true">⌕</span>
								<strong>{project.research.result ? 'SOURCES BOUND' : 'WEB UNOPENED'}</strong>
								<small>{project.research.result?.sources.length ?? 0} saved sources</small>
							</div>
						</div>

						{#if project.research.status === 'idle'}
							<div class="research-launch-panel">
								<div>
									<p class="panel-kicker">THE SEARCH LIST</p>
									<h2>Nine places worth checking before ideation</h2>
									<div class="research-category-grid">
										{#each RESEARCH_CATEGORIES as category, index (category)}
											<span
												><b>{String(index + 1).padStart(2, '0')}</b>{researchCategoryLabels[
													category
												]}</span
											>
										{/each}
									</div>
								</div>
								<aside class="research-cost-card">
									<span>BOUNDARIES</span>
									<strong
										>${project.preferences.prototypeBudgetUsd?.toLocaleString()} prototype</strong
									>
									<p>{project.preferences.selectedIndustryTags.join(' · ')}</p>
									<button
										class="summon-button compact"
										type="button"
										disabled={researchBusy}
										onclick={startBroadResearch}
										><span>{researchBusy ? 'Opening...' : 'Begin broad research'}</span><i
											aria-hidden="true">→</i
										></button
									>
								</aside>
							</div>
						{:else if broadResearchIsActive}
							<div class="research-running" aria-live="polite">
								<div class="research-orb" aria-hidden="true"><i></i><b>?</b></div>
								<p class="panel-kicker">LIVE RESEARCH PASS</p>
								<h2>{researchMessage || 'Consulting the dusty web...'}</h2>
								<p>
									You can refresh or leave this page. The browser will reconnect while the server
									still has the job.
								</p>
								<div class="stage-lights" aria-label="Research stage progress">
									<span class:active={project.research.status === 'queued'}>Queued</span>
									<span class:active={project.research.status === 'running'}
										>Searching and checking sources</span
									>
									<span>Brief ready</span>
								</div>
								<button class="secondary-button" type="button" onclick={() => cancelResearchJob()}
									>Cancel research</button
								>
							</div>
						{:else if project.research.result}
							<div class="research-brief" aria-live="polite">
								<header>
									<div>
										<p class="panel-kicker">THE FOOTHOLD</p>
										<h2>
											{project.research.status === 'partial'
												? 'Useful evidence, with gaps'
												: 'Broad research complete'}
										</h2>
									</div>
									<span class="research-status"
										>{project.research.result.findings.length} findings</span
									>
								</header>
								<p class="research-summary">{project.research.result.summary}</p>
								<p class="research-disclaimer">{project.research.result.disclaimer}</p>

								<div class="finding-groups">
									{#each RESEARCH_CATEGORIES as category (category)}
										{@const categoryFindings = project.research.result.findings.filter(
											(finding) => finding.category === category
										)}
										{#if categoryFindings.length > 0}
											<section class="finding-group">
												<h3>{researchCategoryLabels[category]}</h3>
												{#each categoryFindings as finding (finding.id)}
													<article class="research-finding">
														<h4>{finding.title}</h4>
														<p>{finding.claim}</p>
														<div class="finding-citations" aria-label="Sources for this finding">
															{#each finding.sourceIds as sourceId (sourceId)}
																{@const source = sourceFor(sourceId)}
																{#if source}<a
																		href={source.url}
																		target="_blank"
																		rel="external noreferrer">{source.title}</a
																	>{/if}
															{/each}
														</div>
														{#if finding.interpretation}
															<p class="finding-interpretation">
																<b>Why it may matter</b>{finding.interpretation}
															</p>
														{/if}
													</article>
												{/each}
											</section>
										{/if}
									{/each}
								</div>

								{#if project.research.result.gaps.length > 0}
									<section class="research-gaps">
										<h3>Where the signal was weak</h3>
										<ul>
											{#each project.research.result.gaps as gap (`${gap.category}-${gap.reason}`)}
												<li><b>{researchCategoryLabels[gap.category]}</b>{gap.reason}</li>
											{/each}
										</ul>
									</section>
								{/if}

								<details class="source-ledger">
									<summary>Open source ledger ({project.research.result.sources.length})</summary>
									<ol>
										{#each project.research.result.sources as source (source.id)}
											<li>
												<a href={source.url} target="_blank" rel="external noreferrer"
													>{source.title}</a
												>
												<span>{source.publisher} · {source.publicationDate ?? 'date unknown'}</span>
												<p>{source.evidenceSummary}</p>
											</li>
										{/each}
									</ol>
								</details>

								<div class="research-next">
									<span>✓</span>
									<div>
										<strong>Ready for the interview</strong>
										<p>The next room will turn these gaps into one-at-a-time questions.</p>
									</div>
									<button class="summon-button compact" type="button" onclick={enterInterview}
										><span>Start interview</span><i aria-hidden="true">→</i></button
									>
								</div>
							</div>
						{:else}
							<div class="research-recovery" role="status">
								<p class="panel-kicker">THE SIGNAL BROKE</p>
								<h2>{researchMessage || 'This research pass did not finish.'}</h2>
								<p>Your problems, preferences, and budgets are still saved in this browser.</p>
								<button class="summon-button compact" type="button" onclick={retryBroadResearch}
									><span>Start a fresh pass</span><i aria-hidden="true">↻</i></button
								>
							</div>
						{/if}

						{#if researchMessage && project.research.status === 'idle'}
							<p class="intake-error" role="alert">{researchMessage}</p>
						{/if}
						<div class="room-actions">
							<button
								class="secondary-button"
								type="button"
								disabled={broadResearchIsActive}
								onclick={goToPreferences}>← Back to preferences</button
							>
							<button class="text-button" type="button" onclick={() => resetDialog?.showModal()}
								>Start over</button
							>
						</div>
					</section>
				{:else if project?.stage === 'questions'}
					<section class="intake-room interview-room" aria-labelledby="interview-room-title">
						<div class="room-heading interview-heading">
							<div>
								<p class="room-number">ROOM 04 / CLARIFYING INTERVIEW</p>
								<h1 id="interview-room-title">Turn uncertainty into choices.</h1>
								<p>
									The Sage asks one question at a time and changes course when your answer reveals
									something useful.
								</p>
							</div>
							<div class="interview-counter">
								<strong>{answeredQuestionCount}</strong>
								<span>responses recorded</span>
								<small>Usually 5–10 questions</small>
							</div>
						</div>

						{#if project.interview.status === 'completed' || project.interview.status === 'ended-early'}
							<div class="interview-complete" aria-live="polite">
								<div class="completion-orb" aria-hidden="true">✦</div>
								<p class="panel-kicker">THE SIGNAL IS SHARP ENOUGH</p>
								<h2>
									{project.interview.status === 'ended-early'
										? 'Interview ended early'
										: 'The questions have done their job'}
								</h2>
								<p>{project.interview.completionReason}</p>
								{#if project.interview.confidence === 'reduced'}
									<span class="confidence-note"
										>Concept confidence will be marked lower because some uncertainty remains.</span
									>
								{/if}
								<div class="next-slice-note">
									<strong>Four project directions are waiting</strong>
									<p>
										The Sage will reveal one primary guess, three alternatives, and one forbidden
										stretch.
									</p>
									<button class="summon-button compact" type="button" onclick={enterConceptRoom}>
										<span
											>{project.concepts.portfolio
												? 'Return to the four futures'
												: 'Summon four projects'}</span
										><i aria-hidden="true">→</i>
									</button>
								</div>
							</div>
						{:else if !currentQuestion}
							<div class="interview-loading" aria-live="polite">
								<div class="question-mark" aria-hidden="true">?</div>
								<h2>
									{interviewBusy ? 'Choosing the first useful question...' : 'Begin the interview'}
								</h2>
								<p>
									Your research and preferences are ready. Answers save in this browser after each
									question.
								</p>
								{#if !interviewBusy}
									<button
										class="summon-button compact"
										type="button"
										onclick={() => requestNextInterview()}
										><span>{interviewMessage ? 'Try again' : 'Ask the first question'}</span><i
											aria-hidden="true">→</i
										></button
									>
								{/if}
							</div>
						{:else}
							<article class="question-card" aria-live="polite">
								<header>
									<div>
										<p class="panel-kicker">
											QUESTION {String(project.interview.currentQuestionIndex + 1).padStart(2, '0')}
										</p>
										<h2>{currentQuestion.prompt}</h2>
									</div>
									<span>{currentQuestion.type.replace('-', ' ')}</span>
								</header>
								<div class="why-question">
									<b>Why this matters</b>
									<p>{currentQuestion.whyItMatters}</p>
								</div>

								<div class="answer-area">
									{#if currentQuestion.type === 'text'}
										<label>
											<span>Your answer</span>
											<textarea
												rows="5"
												maxlength="2000"
												bind:value={textAnswer}
												placeholder="A rough answer is enough..."></textarea>
										</label>
									{:else if currentQuestion.type === 'single-choice'}
										<div class="choice-list" role="radiogroup" aria-label="Answer choices">
											{#each currentQuestion.options as option (option.id)}
												<label>
													<input
														type="radio"
														name={currentQuestion.id}
														value={option.id}
														bind:group={singleAnswer}
													/>
													<span>{option.label}</span>
												</label>
											{/each}
										</div>
									{:else if currentQuestion.type === 'multiple-choice'}
										<div class="choice-list multiple" aria-label="Answer choices">
											{#each currentQuestion.options as option (option.id)}
												<label>
													<input
														type="checkbox"
														checked={multipleAnswer.includes(option.id)}
														onchange={(event) =>
															toggleMultipleAnswer(option.id, event.currentTarget.checked)}
													/>
													<span>{option.label}</span>
												</label>
											{/each}
										</div>
									{:else if currentQuestion.type === 'yes-no'}
										<div class="yes-no-choices" aria-label="Yes or no">
											<button
												class:chosen={yesNoAnswer === true}
												type="button"
												onclick={() => (yesNoAnswer = true)}>Yes</button
											>
											<button
												class:chosen={yesNoAnswer === false}
												type="button"
												onclick={() => (yesNoAnswer = false)}>No</button
											>
										</div>
									{:else}
										<label class="numeric-answer">
											<span>Your answer</span>
											<div class:no-prefix={currentQuestion.type !== 'budget'}>
												{#if currentQuestion.type === 'budget'}<b>$</b>{/if}
												<input
													type="number"
													min={currentQuestion.minimum ?? undefined}
													max={currentQuestion.maximum ?? undefined}
													bind:value={numberAnswer}
													placeholder="0"
												/>
												{#if currentQuestion.unit}<i>{currentQuestion.unit}</i>{/if}
											</div>
										</label>
									{/if}
								</div>

								{#if currentAnswer}
									<p class="saved-answer-note">
										Saved as <b>{currentAnswer.status}</b>. Continuing after an edit will replace
										later follow-ups.
									</p>
								{/if}
								<div class="answer-actions">
									<button
										class="secondary-button"
										type="button"
										disabled={interviewBusy}
										onclick={() => submitInterviewAnswer('skipped')}>Skip</button
									>
									<button
										class="secondary-button"
										type="button"
										disabled={interviewBusy}
										onclick={() => submitInterviewAnswer('unknown')}>I don’t know</button
									>
									<button
										class="summon-button compact"
										type="button"
										disabled={interviewBusy}
										onclick={() => submitInterviewAnswer('answered')}
									>
										<span>{interviewBusy ? 'Thinking...' : 'Save and continue'}</span><i
											aria-hidden="true">→</i
										>
									</button>
								</div>
							</article>
						{/if}

						{#if interviewMessage}
							<p class="intake-error" role="alert">{interviewMessage}</p>
						{/if}
						<div class="room-actions interview-room-actions">
							<div>
								{#if project.interview.status === 'active'}
									<button
										class="secondary-button"
										type="button"
										disabled={interviewBusy ||
											!currentQuestion ||
											project.interview.currentQuestionIndex === 0}
										onclick={previousInterviewQuestion}>← Previous question</button
									>
								{/if}
								<button
									class="secondary-button"
									type="button"
									disabled={interviewBusy}
									onclick={goToResearch}>Research room</button
								>
							</div>
							{#if project.interview.status === 'active'}
								<button
									class="text-button"
									type="button"
									disabled={interviewBusy}
									onclick={() => interviewDialog?.showModal()}>End interview early</button
								>
							{/if}
						</div>
					</section>
				{:else if project?.stage === 'concepts'}
					<ConceptRoom
						portfolio={project.concepts.portfolio}
						workshop={project.featureWorkshop}
						sources={project.research.result?.sources ?? []}
						busy={conceptBusy}
						message={conceptMessage}
						onGenerate={() => requestConcepts(false)}
						onRegenerate={() => requestConcepts(true)}
						onBack={returnToQuestions}
						onContinue={enterFinalizationRoom}
						onReveal={reactToConceptReveal}
						onAllRevealed={reactToAllConcepts}
						onWorkshopChange={updateFeatureWorkshop}
					/>
				{:else}
					<section class="welcome-room" aria-labelledby="welcome-title">
						<div class="welcome-copy">
							<p class="room-number">THE IDEA WORKSHOP</p>
							<h1 id="welcome-title">Give that nagging problem somewhere to go.</h1>
							<p class="welcome-lede">
								The Signal Sage will research the territory, ask the annoying useful questions, and
								return four different projects worth considering.
							</p>
							<div class="promise-grid">
								<div>
									<span>01</span>
									<p>Describe related problems in your own words.</p>
								</div>
								<div>
									<span>02</span>
									<p>Compare three practical ideas and one stretch.</p>
								</div>
								<div>
									<span>03</span>
									<p>Export the chosen project as a cited PDF.</p>
								</div>
							</div>
							<div class="welcome-name-grid">
								<label>
									<span>What should the wizard call you? <small>optional</small></span>
									<input
										maxlength="50"
										bind:value={playerNameDraft}
										placeholder="Mortal, Evan, Captain..."
									/>
								</label>
								<label>
									<span>Working project name <small>optional and probably wrong</small></span>
									<input
										maxlength="50"
										bind:value={projectNameDraft}
										placeholder="Operation Mystery Box"
									/>
								</label>
							</div>
							<button class="summon-button" type="button" onclick={beginProject}>
								<span>Begin conjuring</span>
								<i aria-hidden="true">→</i>
							</button>
							<p class="time-note">No account. Your active project stays on this device.</p>
						</div>

						<div class="sage-card" aria-label="A message from the Signal Sage">
							<div class="speech-bubble">
								<span class="online-dot" aria-hidden="true"></span>
								I can guess your future project from its problems. Eventually. Probably.
							</div>
							<img src="/images/signal-sage.png" alt="" />
							<div class="sage-shadow" aria-hidden="true"></div>
						</div>
					</section>
				{/if}
			</main>
		</div>
	</div>

	<dialog class="reset-dialog" bind:this={resetDialog}>
		<form method="dialog">
			<p class="dialog-kicker">BREAK THE SPELL?</p>
			<h2>Start over completely?</h2>
			<p>This removes the active project from this browser. It cannot be restored.</p>
			<div class="dialog-actions">
				<button class="text-button" value="cancel">Keep it</button>
				<button class="danger-button" type="button" onclick={startOver}>Clear project</button>
			</div>
		</form>
	</dialog>

	<dialog class="reset-dialog" bind:this={interviewDialog}>
		<form method="dialog">
			<p class="dialog-kicker">ENOUGH QUESTIONS?</p>
			<h2>End the interview early?</h2>
			<p>
				You can continue to concepts, but the final package will mark its confidence as reduced.
			</p>
			<div class="dialog-actions">
				<button class="text-button" value="cancel">Keep answering</button>
				<button class="danger-button" type="button" onclick={finishInterviewEarly}
					>End interview</button
				>
			</div>
		</form>
	</dialog>
{/if}

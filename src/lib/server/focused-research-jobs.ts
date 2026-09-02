import type { FocusedResearchJobView, FocusedResearchRequest } from '$lib/finalization';
import type { ResearchJobStatus, ResearchProgress } from '$lib/research';
import {
	InvalidFocusedResearchResponseError,
	parseCompletedFocusedResearch,
	type FocusedResearchProvider
} from '$lib/server/focused-research-ai';
import type { ResearchProviderSnapshot } from '$lib/server/research-ai';
import { randomUUID } from 'node:crypto';
import type { TokenUsage } from '$lib/server/observability';

interface InternalFocusedResearchJob extends FocusedResearchJobView {
	projectId: string;
	inputSignature: string;
	request: FocusedResearchRequest;
	provider: FocusedResearchProvider;
	providerResponseId: string | null;
	cancelRequested: boolean;
	requestId: string | null;
	model: string | null;
}

interface FocusedResearchJobManagerOptions {
	now?: () => number;
	sleep?: (milliseconds: number) => Promise<void>;
	pollIntervalMs?: number;
	maximumRuntimeMs?: number;
	retentionMs?: number;
	idFactory?: () => string;
}

export class FocusedResearchJobManager {
	private readonly jobs = new Map<string, InternalFocusedResearchJob>();
	private readonly now: () => number;
	private readonly sleep: (milliseconds: number) => Promise<void>;
	private readonly pollIntervalMs: number;
	private readonly maximumRuntimeMs: number;
	private readonly retentionMs: number;
	private readonly idFactory: () => string;

	constructor(options: FocusedResearchJobManagerOptions = {}) {
		this.now = options.now ?? Date.now;
		this.sleep =
			options.sleep ??
			((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
		this.pollIntervalMs = options.pollIntervalMs ?? 1_500;
		this.maximumRuntimeMs = options.maximumRuntimeMs ?? 180_000;
		this.retentionMs = options.retentionMs ?? 30 * 60_000;
		this.idFactory = options.idFactory ?? randomUUID;
	}

	start(
		input: FocusedResearchRequest,
		inputSignature: string,
		provider: FocusedResearchProvider,
		logContext: { requestId?: string; model?: string } = {}
	): { job: FocusedResearchJobView; reused: boolean } {
		this.cleanup();
		const existing = Array.from(this.jobs.values()).find(
			(job) =>
				job.projectId === input.projectId &&
				job.inputSignature === inputSignature &&
				(job.status === 'queued' || job.status === 'running')
		);
		if (existing) return { job: toView(existing), reused: true };

		const now = this.now();
		const job: InternalFocusedResearchJob = {
			id: this.idFactory(),
			projectId: input.projectId,
			inputSignature,
			request: input,
			status: 'queued',
			progress: 'queued',
			createdAt: new Date(now).toISOString(),
			updatedAt: new Date(now).toISOString(),
			expiresAt: new Date(now + this.retentionMs).toISOString(),
			message: null,
			result: null,
			provider,
			providerResponseId: null,
			cancelRequested: false,
			requestId: logContext.requestId ?? null,
			model: logContext.model ?? null
		};
		this.jobs.set(job.id, job);
		void this.run(job);
		return { job: toView(job), reused: false };
	}

	get(jobId: string): FocusedResearchJobView | null {
		this.cleanup();
		const job = this.jobs.get(jobId);
		return job ? toView(job) : null;
	}

	async cancel(jobId: string): Promise<FocusedResearchJobView | null> {
		this.cleanup();
		const job = this.jobs.get(jobId);
		if (!job) return null;
		if (isTerminal(job.status)) return toView(job);
		job.cancelRequested = true;
		this.update(
			job,
			'cancelled',
			job.progress,
			'Focused research cancelled. Your chosen project is still sealed.'
		);
		if (job.providerResponseId)
			await job.provider.cancel(job.providerResponseId).catch(() => undefined);
		return toView(job);
	}

	private async run(job: InternalFocusedResearchJob): Promise<void> {
		const startedAt = this.now();
		let usage: TokenUsage | null = null;
		for (let attempt = 0; attempt < 2; attempt += 1) {
			if (job.cancelRequested) return;
			this.update(job, 'running', attempt === 0 ? 'starting' : 'retrying-structure', null);
			try {
				let snapshot = await job.provider.start(job.request);
				usage = snapshot.usage ?? usage;
				job.providerResponseId = snapshot.id;
				this.update(job, 'running', 'researching', null);
				snapshot = await this.waitForTerminal(job, snapshot, startedAt);
				usage = snapshot.usage ?? usage;
				if (job.cancelRequested || snapshot.status === 'cancelled') {
					this.update(
						job,
						'cancelled',
						job.progress,
						'Focused research cancelled. Your chosen project is still sealed.'
					);
					return;
				}
				if (snapshot.status !== 'completed')
					throw new ProviderFocusedResearchError(snapshot.errorCode ?? snapshot.status);
				this.update(job, 'running', 'checking-sources', null);
				const parsed = parseCompletedFocusedResearch(snapshot, job.request, new Date(this.now()));
				job.result = parsed.result;
				this.update(
					job,
					parsed.partial ? 'partial' : 'completed',
					'complete',
					parsed.partial
						? 'Focused research finished with cited findings and named gaps.'
						: 'Focused research verified the configured project with cited evidence.'
				);
				console.info('focused_research completed', {
					requestId: job.requestId,
					jobId: job.id,
					durationMs: this.now() - startedAt,
					model: job.model,
					status: parsed.partial ? 'partial' : 'completed',
					sourceCount: parsed.result.sources.length,
					...(usage ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 })
				});
				return;
			} catch (error) {
				if (job.cancelRequested) return;
				if (error instanceof InvalidFocusedResearchResponseError && attempt === 0) continue;
				const failureClass =
					error instanceof InvalidFocusedResearchResponseError
						? 'citation_contract_failed'
						: error instanceof FocusedResearchTimeoutError
							? 'research_timeout'
							: 'provider_error';
				this.update(
					job,
					'failed',
					job.progress,
					failureClass === 'research_timeout'
						? 'Focused research ran past its time limit. Start a fresh pass.'
						: 'Focused research could not produce a safely cited result. Your chosen project is still saved.'
				);
				console.warn('focused_research failed', {
					requestId: job.requestId,
					jobId: job.id,
					durationMs: this.now() - startedAt,
					model: job.model,
					failureClass,
					reason: error instanceof Error ? error.message : 'Unknown research failure',
					...(usage ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 })
				});
				return;
			}
		}
	}

	private async waitForTerminal(
		job: InternalFocusedResearchJob,
		initial: ResearchProviderSnapshot,
		startedAt: number
	): Promise<ResearchProviderSnapshot> {
		let snapshot = initial;
		while (snapshot.status === 'queued' || snapshot.status === 'in_progress') {
			if (job.cancelRequested) return snapshot;
			if (this.now() - startedAt > this.maximumRuntimeMs) {
				if (job.providerResponseId)
					await job.provider.cancel(job.providerResponseId).catch(() => undefined);
				throw new FocusedResearchTimeoutError();
			}
			await this.sleep(this.pollIntervalMs);
			if (job.cancelRequested) return snapshot;
			snapshot = await job.provider.retrieve(snapshot.id);
		}
		return snapshot;
	}

	private update(
		job: InternalFocusedResearchJob,
		status: ResearchJobStatus,
		progress: ResearchProgress,
		message: string | null
	): void {
		job.status = status;
		job.progress = progress;
		job.message = message;
		job.updatedAt = new Date(this.now()).toISOString();
	}

	private cleanup(): void {
		const now = this.now();
		for (const [id, job] of this.jobs) if (Date.parse(job.expiresAt) <= now) this.jobs.delete(id);
	}
}

class ProviderFocusedResearchError extends Error {}
class FocusedResearchTimeoutError extends Error {}
function isTerminal(status: ResearchJobStatus): boolean {
	return (
		status === 'completed' || status === 'partial' || status === 'failed' || status === 'cancelled'
	);
}
function toView(job: InternalFocusedResearchJob): FocusedResearchJobView {
	return {
		id: job.id,
		status: job.status,
		progress: job.progress,
		createdAt: job.createdAt,
		updatedAt: job.updatedAt,
		expiresAt: job.expiresAt,
		message: job.message,
		result: job.result
	};
}

export const focusedResearchJobs = new FocusedResearchJobManager();

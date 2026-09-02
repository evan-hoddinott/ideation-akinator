export interface TokenUsage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
}

export function emptyTokenUsage(): TokenUsage {
	return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

export function readTokenUsage(value: unknown): TokenUsage | null {
	if (!isRecord(value) || !isRecord(value.usage)) return null;
	const inputTokens = safeCount(value.usage.input_tokens);
	const outputTokens = safeCount(value.usage.output_tokens);
	const totalTokens = safeCount(value.usage.total_tokens);
	if (inputTokens === null && outputTokens === null && totalTokens === null) return null;
	return {
		inputTokens: inputTokens ?? 0,
		outputTokens: outputTokens ?? 0,
		totalTokens: totalTokens ?? (inputTokens ?? 0) + (outputTokens ?? 0)
	};
}

export function addTokenUsage(total: TokenUsage, value: unknown): void {
	const usage = readTokenUsage(value);
	if (!usage) return;
	total.inputTokens += usage.inputTokens;
	total.outputTokens += usage.outputTokens;
	total.totalTokens += usage.totalTokens;
}

function safeCount(value: unknown): number | null {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

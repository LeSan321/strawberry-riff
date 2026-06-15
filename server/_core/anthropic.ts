/**
 * Anthropic Claude helper for Strawberry Riff
 * Used by the lyric generator — keeps credentials server-side only.
 *
 * Note: Manus sandbox runs from a Turkish IP. Anthropic geo-blocks Turkey at
 * the Cloudflare layer, so direct calls from the sandbox return 403.
 * This is NOT a bad key — it works correctly on Railway (US/EU).
 * Tests that call this helper must skip gracefully on 403.
 */

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-5";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic({ apiKey: apiKey.trim() });
  }
  return _client;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeCallParams {
  system: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
}

export interface ClaudeCallResult {
  content: string;
}

/**
 * Call Claude claude-3-5-sonnet-20241022 with a system prompt and message history.
 * Returns the assistant's text response.
 */
export async function callClaude(params: ClaudeCallParams): Promise<ClaudeCallResult> {
  const client = getClient();
  const rawKey = process.env.ANTHROPIC_API_KEY ?? "";
  const keySnippet = rawKey.trim().slice(0, 20);
  console.log(`[Anthropic] callClaude: model=${MODEL} keyPrefix=${keySnippet}... keyLen=${rawKey.trim().length} maxTokens=${params.maxTokens ?? 2048}`);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: params.maxTokens ?? 2048,
      system: params.system,
      messages: params.messages,
    });

    const content = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    console.log(`[Anthropic] callClaude: success, content length=${content.length}`);
    return { content };
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const message = (err as { message?: string })?.message ?? String(err);
    console.error(`[Anthropic] callClaude ERROR: status=${status} message=${message}`);
    throw err;
  }
}

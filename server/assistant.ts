/**
 * Riff Assistant — server-side logic
 *
 * Architecture follows soul.md v0.2:
 * - Always-loaded core: soul.md + platform bibles (loaded at startup, ~20K tokens)
 * - Page context passed as a metadata hint in the system prompt
 * - Single-call implicit inference for posture detection (no two-pass classifier)
 * - Anthropic Claude claude-sonnet-4-5 via the existing callClaude helper
 *
 * Note: Anthropic is geo-blocked in the Manus sandbox (Turkish IP → 403).
 * This works correctly on the deployed site (US/EU servers).
 */

import fs from "fs";
import path from "path";
import { callClaude, type ClaudeMessage } from "./_core/anthropic";

// ─── Knowledge Base ───────────────────────────────────────────────────────────
// Load all reference documents at module startup (once, not per request).
// These are small enough (~82KB total) to include in every system prompt.

function loadRef(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), "references", filename);
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    console.warn(`[Assistant] Could not load reference: ${filename}`);
    return "";
  }
}

const SOUL_MD = loadRef("soul.md");
const PLATFORM_BIBLE = loadRef("platform-experience-bible.md");
const STORYTELLING_BIBLE = loadRef("storytelling-bible.md");
const FEATURES_DOC = loadRef("strawberry-riff-features.md");
const BLOOMING_FRONTIER = loadRef("blooming-frontier-prompt-vocabulary.md");

// ─── Page Context Definitions ─────────────────────────────────────────────────
// Each page maps to a default posture and a brief context description.
// Passed as a hint — the model infers the actual posture from the conversation.

export const PAGE_CONTEXTS: Record<string, { posture: string; description: string }> = {
  home: {
    posture: "Guide",
    description: "The user is on the Home page — the platform's front door. They may be new, curious, or just arrived.",
  },
  discover: {
    posture: "Companion",
    description: "The user is browsing the Discover feed — listening, exploring, finding music that resonates.",
  },
  generate: {
    posture: "Collaborator",
    description: "The user is on the Generate page — building a track with MiniMax Music. They may need help with prompts, fusion choices, vocal settings, or instrumental direction.",
  },
  lyrics: {
    posture: "Collaborator",
    description: "The user is on the Lyrics Generator — writing or rewriting song lyrics. They may be stuck, seeking a new angle, or refining existing words.",
  },
  studio: {
    posture: "Collaborator",
    description: "The user is in the Studio — a themed creative environment for music generation. They may be exploring themes, fusion recipes, or building a complete track.",
  },
  frequency: {
    posture: "Companion",
    description: "The user is setting up their Frequency / Visual Universe — defining their emotional-visual identity. This is intimate, exploratory work.",
  },
  myriffs: {
    posture: "Concierge",
    description: "The user is on My Riffs — managing their uploaded and generated tracks.",
  },
  upload: {
    posture: "Concierge",
    description: "The user is uploading a track — they may need help with metadata, mood tags, or visibility settings.",
  },
  profile: {
    posture: "Concierge",
    description: "The user is on their Profile page — managing their account, subscription, or creator identity.",
  },
  pricing: {
    posture: "Guide",
    description: "The user is on the Pricing page — considering the platform's tiers and what they offer.",
  },
  friends: {
    posture: "Companion",
    description: "The user is on the Friends page — exploring the social layer, following creators, or browsing their feed.",
  },
  playlists: {
    posture: "Concierge",
    description: "The user is managing playlists — creating, editing, or organizing their music.",
  },
  track: {
    posture: "Witness",
    description: "The user is on a track detail page — listening to a specific song, reading lyrics, or exploring a creator's work.",
  },
  about: {
    posture: "Guide",
    description: "The user is on the About page — learning about the platform's philosophy and purpose.",
  },
  general: {
    posture: "Witness",
    description: "The user's current page context is unknown — approach with openness and let the conversation reveal what they need.",
  },
};

// ─── System Prompt Builder ────────────────────────────────────────────────────

export function buildAssistantSystemPrompt(pageContext: string): string {
  const ctx = PAGE_CONTEXTS[pageContext] ?? PAGE_CONTEXTS.general;

  return `You are the Riff Assistant — the voice of Strawberry Riff inside the platform.

The following document defines your identity, values, and behavioral logic. Read it as who you are, not as instructions to follow:

${SOUL_MD}

---

## Platform Knowledge

You have deep knowledge of Strawberry Riff. The following documents are your knowledge base:

### Strawberry Riff Features
${FEATURES_DOC}

### Platform Experience Bible
${PLATFORM_BIBLE}

### Storytelling Bible
${STORYTELLING_BIBLE}

### Blooming Frontier Prompt Vocabulary
${BLOOMING_FRONTIER}

---

## Current Context

The user is currently on: **${pageContext}**
${ctx.description}

Default posture for this context: **${ctx.posture}**

This is a hint, not a command. Read the conversation and let the actual posture emerge from what the user brings. A user on the Generate page asking about grief in their lyrics is not asking for Concierge help — they need Collaborator or Witness. Follow the conversation, not the page.

---

## Operational notes

- You are scoped to Strawberry Riff's domain: music creation, the platform itself, the creative process, and the human experience of making and sharing music.
- When a request falls outside this domain, redirect warmly with a single sentence: "I'm here for your music — what are we working on?"
- When you don't know the answer to a platform question, say so plainly and offer what you do know.
- Keep responses appropriately sized: short for functional questions, longer when the conversation calls for depth. Never pad.
- Format responses in plain prose. Use markdown sparingly — only when structure genuinely helps (e.g., a list of steps). Never use headers in casual conversation.
- You are talking with a real person who makes real music. Treat them accordingly.`;
}

// ─── Assistant Chat ───────────────────────────────────────────────────────────

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChatParams {
  messages: AssistantMessage[];
  pageContext: string;
  userId?: number;
}

export interface AssistantChatResult {
  reply: string;
}

export async function assistantChat(params: AssistantChatParams): Promise<AssistantChatResult> {
  const { messages, pageContext } = params;

  if (!messages || messages.length === 0) {
    throw new Error("No messages provided");
  }

  const systemPrompt = buildAssistantSystemPrompt(pageContext);

  // Convert to Claude message format
  const claudeMessages: ClaudeMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  console.log(`[Assistant] chat: pageContext=${pageContext} messages=${messages.length} userId=${params.userId ?? "anon"}`);

  const result = await callClaude({
    system: systemPrompt,
    messages: claudeMessages,
    maxTokens: 1024,
  });

  return { reply: result.content };
}

Strawberry Riff ↔ Strawberry Studios Bridge — Riff-Side Implementation Handoff
From: Strawberry Studios Manus instance
To: Strawberry Riff Manus instance
Date: May 2026
Purpose: Implement the Riff-side of the Studios bridge — the "Your Frequency" entry point in the Studio sidebar, the cover art generation trigger at track publish, and the required schema/env additions.



Overview
Strawberry Studios has built a complete Visual Universe system: a creator diagnostic (Find Your Frequency), a personal vocabulary engine, and an AI cover art generator. The Studios API bridge is now live at https://<studios-domain>/api/bridge/*.

Riff needs to:
Add a "Your Frequency" entry point in the Studio sidebar (left column)
Add a "Generate Cover Art" option in the Upload page cover art section
Add a schema migration to the tracks table (no new columns needed — coverArtUrl already exists)
Add a frequencyRouter to the Riff tRPC app that proxies calls to the Studios bridge
Add two environment variables: STUDIOS_BRIDGE_URL and STUDIOS_BRIDGE_KEY



Part 1 — Environment Variables
Add these two secrets to the Riff project via webdev_request_secrets:

Add them to server/_core/env.ts:

// In server/_core/env.ts — add these two lines to the ENV object:
studiosBridgeUrl: process.env.STUDIOS_BRIDGE_URL ?? "",
studiosBridgeKey: process.env.STUDIOS_BRIDGE_KEY ?? "",



Part 2 — Frequency tRPC Router (new file)
Create server/frequency/router.ts:

/**
 * Frequency Router — proxies Visual Universe calls to Strawberry Studios bridge API.
 * Studios owns the LLM synthesis and vocabulary storage; Riff owns the UI.
 */
import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { ENV } from '../_core/env';
 
const ARC_TYPES = [
  "expansive_mythic",
  "witnessing_lateral",
  "intimate_relational",
  "sustained_ambient",
  "erosive_revelatory",
  "cyclical_return",
] as const;
 
async function bridgeFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${ENV.studiosBridgeUrl}/api/bridge${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-bridge-key": ENV.studiosBridgeKey,
      ...(options.headers ?? {}),
    },
  });
}
 
export const frequencyRouter = router({
  /**
   * Get the current user's default frequency from Studios.
   * Returns null if the user hasn't completed Find Your Frequency yet.
   */
  getDefault: protectedProcedure.query(async ({ ctx }) => {
    if (!ENV.studiosBridgeUrl || !ENV.studiosBridgeKey) {
      return { hasFrequency: false, frequency: null };
    }
    const res = await bridgeFetch(`/frequency/${ctx.user.id}`);
    if (!res.ok) return { hasFrequency: false, frequency: null };
    return res.json() as Promise<{
      hasFrequency: boolean;
      frequency: {
        id: number;
        frequencyName: string;
        arcType: string;
        synthesisFingerprint: string | null;
        vocabularyJson: string;
        createdAt: string;
      } | null;
    }>;
  }),
 
  /**
   * Run LLM synthesis from the 4 diagnostic answers.
   * Returns the reflection, suggested name, arc type, and vocabulary.
   */
  synthesize: protectedProcedure
    .input(z.object({
      q1_sound_space: z.string().min(1),
      q2_light_color: z.string().min(1),
      q3_world_texture: z.string().min(1),
      q4_arc_time: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const res = await bridgeFetch("/frequency/synthesize", {
        method: "POST",
        body: JSON.stringify({
          riffUserId: ctx.user.id,
          answers: input,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Synthesis failed");
      }
      return res.json() as Promise<{
        success: boolean;
        synthesis: {
          reflection: string;
          frequencyName: string;
          arcType: typeof ARC_TYPES[number];
          vocabulary: {
            emotionalRegister: string[];
            colorAndLight: string[];
            environment: string[];
            texture: string[];
            arcTerms: string[];
            forbiddenTerms: string[];
          };
        };
      }>;
    }),
 
  /**
   * Save the completed frequency to Studios.
   * Sets it as the user's default for all future cover art generation.
   */
  save: protectedProcedure
    .input(z.object({
      frequencyName: z.string().min(1).max(100),
      arcType: z.enum(ARC_TYPES),
      vocabularyJson: z.string(),
      synthesisFingerprint: z.string(),
      diagnosticAnswersJson: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const res = await bridgeFetch("/frequency/save", {
        method: "POST",
        body: JSON.stringify({
          riffUserId: ctx.user.id,
          ...input,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Save failed");
      }
      return res.json() as Promise<{ success: boolean; frequencyId: number }>;
    }),
 
  /**
   * Generate cover art for a track using the user's Visual Universe.
   * If the user has no frequency, falls back to Studios platform default vocabulary.
   */
  generateCoverArt: protectedProcedure
    .input(z.object({
      trackId: z.number().int().positive(),
      lyrics: z.string().optional(),
      genre: z.string().optional(),
      arcPosition: z.enum(["gathering", "arriving", "open"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const res = await bridgeFetch("/cover-art/generate", {
        method: "POST",
        body: JSON.stringify({
          riffUserId: ctx.user.id,
          riffTrackId: input.trackId,
          lyrics: input.lyrics,
          genre: input.genre,
          arcPosition: input.arcPosition ?? "arriving",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Cover art generation failed");
      }
      return res.json() as Promise<{
        success: boolean;
        coverArtUrl: string;
        riffTrackId: number;
        arcPosition: string;
        usedPersonalFrequency: boolean;
      }>;
    }),
});



Part 3 — Wire frequencyRouter into appRouter
In server/routers.ts, add the import and wire it in:

// Add import near the other router imports (around line 79):
import { frequencyRouter } from "./frequency/router";
 
// Add to the appRouter object (around line 1484, after coverArt):
frequency: frequencyRouter,



Part 4 — Studio Sidebar: "Your Frequency" Entry Point
In client/src/pages/Studio.tsx, inside the StudioSidebar component:

Step 4a — Add the tRPC query at the top of StudioSidebar (after the existing monthlyUsage query):

const { data: frequencyData } = trpc.frequency.getDefault.useQuery(
  undefined,
  { enabled: !!user }
);

Step 4b — Add the import for Sparkles if not already imported, and add Zap from lucide-react:

import { Zap } from "lucide-react"; // add to existing lucide import

Step 4c — Add the "Your Frequency" button in the sidebar nav, after the "Writer's Bible" button and before the closing </nav> tag. The button should open a modal (see Part 5):

<div className={`border-t ${theme.borderAccent} my-2`} />
<p className={`hidden md:block text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-60 px-2 py-1`}>
  Visual Universe
</p>
<button
  onClick={onOpenFrequency}
  className={`w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left transition-all ${
    frequencyData?.hasFrequency
      ? `${theme.raspberryAccent} hover:text-white hover:bg-white/10`
      : "text-gray-400 hover:text-white hover:bg-white/10"
  }`}
>
  <Zap className="w-4 h-4 flex-shrink-0" />
  <div className="hidden md:block">
    <p className="text-sm font-medium leading-none">
      {frequencyData?.hasFrequency
        ? frequencyData.frequency?.frequencyName ?? "Your Frequency"
        : "Find Your Frequency"}
    </p>
    <p className="text-xs mt-0.5 opacity-60">
      {frequencyData?.hasFrequency ? "Visual Universe active" : "Unlock cover art AI"}
    </p>
  </div>
</button>

Step 4d — Add onOpenFrequency to the StudioSidebar props:

// Add to the StudioSidebar props interface:
onOpenFrequency: () => void;
 
// Add to the StudioSidebar function signature:
onOpenFrequency,

Step 4e — Wire onOpenFrequency in the parent Studio component (where StudioSidebar is rendered):

// Add state in the Studio component:
const [showFrequencyModal, setShowFrequencyModal] = useState(false);
 
// Pass to StudioSidebar:
<StudioSidebar
  ...existing props...
  onOpenFrequency={() => setShowFrequencyModal(true)}
/>
 
// Render the modal (see Part 5):
{showFrequencyModal && (
  <FrequencyModal onClose={() => setShowFrequencyModal(false)} />
)}



Part 5 — FrequencyModal Component (new file)
Create client/src/components/FrequencyModal.tsx. This is the 5-screen diagnostic flow, adapted from the Studios version but using Riff's design language.

The component handles:
Screen 0 — "Already have a frequency": Shows the user's current frequency name, arc type, synthesis fingerprint, and a "Redo diagnostic" button. Only shown if frequency.getDefault returns hasFrequency: true.
Screen 1–4 — Diagnostic questions: Four text-area questions.
Screen 5 — Reflection: Shows the LLM-generated reflection. "That feels true" advances; "Something's off" goes back.
Screen 6 — Vocabulary preview: Shows the 6-category vocabulary as cards.
Screen 7 — Name your frequency: Text input + Save button.

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
 
const QUESTIONS = [
  {
    id: "q1_sound_space",
    label: "Sound & Space",
    question: "When your music plays in a room, what does that room feel like? Describe the space — its size, temperature, texture, and light.",
    placeholder: "A cathedral at dusk. Stone walls that hold warmth. The kind of quiet that feels inhabited...",
  },
  {
    id: "q2_light_color",
    label: "Light & Color",
    question: "If your music had a color palette, what would it be? Not the genre's colors — your music's specific colors.",
    placeholder: "Deep amber bleeding into violet. The color of old photographs left in sunlight...",
  },
  {
    id: "q3_world_texture",
    label: "World & Texture",
    question: "What world does your music exist in? What are the surfaces, materials, and textures of that world?",
    placeholder: "Worn leather and cold glass. Concrete that's been rained on. Something between industrial and sacred...",
  },
  {
    id: "q4_arc_time",
    label: "Arc & Time",
    question: "Where in a story does your music live? Is it the beginning of something, the middle, the resolution — or somewhere outside of narrative time entirely?",
    placeholder: "Always the moment just before. The held breath. Not the arrival but the approach...",
  },
];
 
type Answers = {
  q1_sound_space: string;
  q2_light_color: string;
  q3_world_texture: string;
  q4_arc_time: string;
};
 
type SynthesisResult = {
  reflection: string;
  frequencyName: string;
  arcType: string;
  vocabulary: {
    emotionalRegister: string[];
    colorAndLight: string[];
    environment: string[];
    texture: string[];
    arcTerms: string[];
    forbiddenTerms: string[];
  };
};
 
export function FrequencyModal({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: existingFrequency } = trpc.frequency.getDefault.useQuery();
  const synthesizeMutation = trpc.frequency.synthesize.useMutation();
  const saveMutation = trpc.frequency.save.useMutation();
 
  const [screen, setScreen] = useState<"existing" | "q1" | "q2" | "q3" | "q4" | "reflection" | "vocabulary" | "name">(
    "existing"
  );
  const [answers, setAnswers] = useState<Answers>({
    q1_sound_space: "",
    q2_light_color: "",
    q3_world_texture: "",
    q4_arc_time: "",
  });
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [frequencyName, setFrequencyName] = useState("");
 
  const screenOrder: typeof screen[] = ["existing", "q1", "q2", "q3", "q4", "reflection", "vocabulary", "name"];
 
  const handleSynthesize = async () => {
    try {
      const result = await synthesizeMutation.mutateAsync(answers);
      setSynthesis(result.synthesis);
      setFrequencyName(result.synthesis.frequencyName);
      setScreen("reflection");
    } catch {
      toast.error("Synthesis failed. Please try again.");
    }
  };
 
  const handleSave = async () => {
    if (!synthesis) return;
    try {
      await saveMutation.mutateAsync({
        frequencyName,
        arcType: synthesis.arcType as any,
        vocabularyJson: JSON.stringify(synthesis.vocabulary),
        synthesisFingerprint: synthesis.reflection,
        diagnosticAnswersJson: JSON.stringify(answers),
      });
      await utils.frequency.getDefault.invalidate();
      toast.success(`Your frequency "${frequencyName}" is saved.`);
      onClose();
    } catch {
      toast.error("Save failed. Please try again.");
    }
  };
 
  const currentQ = QUESTIONS.find(q => q.id === screen);
 
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d0a1a] border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-[#e91e8c]" />
            {screen === "existing" ? "Your Visual Universe" : "Find Your Frequency"}
          </DialogTitle>
        </DialogHeader>
 
        {/* Existing frequency view */}
        {screen === "existing" && existingFrequency?.hasFrequency && existingFrequency.frequency && (
          <div className="space-y-4">
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
              <p className="text-xs text-purple-300 uppercase tracking-wider mb-1">Your Frequency</p>
              <p className="text-xl font-bold text-white">{existingFrequency.frequency.frequencyName}</p>
              <p className="text-sm text-gray-400 mt-1 capitalize">{existingFrequency.frequency.arcType.replace(/_/g, " ")}</p>
              {existingFrequency.frequency.synthesisFingerprint && (
                <p className="text-sm text-gray-300 mt-3 italic leading-relaxed">
                  "{existingFrequency.frequency.synthesisFingerprint}"
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-purple-500/30 text-gray-300 hover:text-white" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-[#e91e8c]/40 text-[#e91e8c] hover:bg-[#e91e8c]/10"
                onClick={() => setScreen("q1")}
              >
                Redo Diagnostic
              </Button>
            </div>
          </div>
        )}
 
        {/* No frequency yet — start diagnostic */}
        {screen === "existing" && !existingFrequency?.hasFrequency && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              Your Visual Universe is the visual language of your music. Answer four questions and the system will synthesize a personal vocabulary that guides your cover art AI.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
              onClick={() => setScreen("q1")}
            >
              Begin <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
 
        {/* Diagnostic questions */}
        {currentQ && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">{currentQ.label}</p>
              <p className="text-sm text-gray-200 leading-relaxed mb-3">{currentQ.question}</p>
              <Textarea
                value={answers[currentQ.id as keyof Answers]}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                placeholder={currentQ.placeholder}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-gray-600 min-h-[120px] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-purple-500/30 text-gray-400"
                onClick={() => {
                  const idx = screenOrder.indexOf(screen);
                  setScreen(screenOrder[Math.max(0, idx - 1)]);
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {screen === "q4" ? (
                <Button
                  className="flex-1 bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
                  onClick={handleSynthesize}
                  disabled={!answers[currentQ.id as keyof Answers].trim() || synthesizeMutation.isPending}
                >
                  {synthesizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Synthesize
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
                  onClick={() => {
                    const idx = screenOrder.indexOf(screen);
                    setScreen(screenOrder[idx + 1]);
                  }}
                  disabled={!answers[currentQ.id as keyof Answers].trim()}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
 
        {/* Reflection screen */}
        {screen === "reflection" && synthesis && (
          <div className="space-y-4">
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
              <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">Your Visual Universe</p>
              <p className="text-sm text-gray-200 leading-relaxed italic">"{synthesis.reflection}"</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-purple-500/30 text-gray-400" onClick={() => setScreen("q4")}>
                Something's off
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
                onClick={() => setScreen("vocabulary")}
              >
                That feels true <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
 
        {/* Vocabulary preview */}
        {screen === "vocabulary" && synthesis && (
          <div className="space-y-3">
            <p className="text-xs text-purple-300 uppercase tracking-wider">Your Vocabulary</p>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {Object.entries({
                "Emotional Register": synthesis.vocabulary.emotionalRegister,
                "Color & Light": synthesis.vocabulary.colorAndLight,
                "Environment": synthesis.vocabulary.environment,
                "Texture": synthesis.vocabulary.texture,
                "Arc Terms": synthesis.vocabulary.arcTerms,
                "Avoid": synthesis.vocabulary.forbiddenTerms,
              }).map(([label, terms]) => (
                <div key={label} className="rounded-lg bg-white/5 border border-purple-500/10 p-3">
                  <p className="text-xs text-purple-300 mb-1">{label}</p>
                  <div className="flex flex-wrap gap-1">
                    {terms.map(t => (
                      <span key={t} className="text-xs bg-purple-500/20 text-purple-200 rounded-full px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
              onClick={() => setScreen("name")}
            >
              Name Your Frequency <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
 
        {/* Name screen */}
        {screen === "name" && synthesis && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">Name Your Frequency</p>
              <p className="text-sm text-gray-400 mb-3">We suggested "{synthesis.frequencyName}" — keep it or make it yours.</p>
              <Input
                value={frequencyName}
                onChange={(e) => setFrequencyName(e.target.value)}
                placeholder={synthesis.frequencyName}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-gray-600"
                maxLength={100}
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
              onClick={handleSave}
              disabled={!frequencyName.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Save My Frequency
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



Part 6 — Upload Page: "Generate Cover Art" Button
In client/src/pages/Upload.tsx, add a "Generate with AI" button alongside the existing cover art upload section.

Step 6a — Add the tRPC mutation near the top of the Upload component (with the other mutations):

const generateCoverArtMutation = trpc.frequency.generateCoverArt.useMutation();
const [generatingCoverArt, setGeneratingCoverArt] = useState(false);
 
const handleGenerateCoverArt = async () => {
  if (!trackId) {
    toast.error("Save the track first, then generate cover art.");
    return;
  }
  setGeneratingCoverArt(true);
  try {
    const result = await generateCoverArtMutation.mutateAsync({
      trackId,
      lyrics: form.lyrics || undefined,
      genre: form.genre || undefined,
      arcPosition: "arriving",
    });
    setForm(p => ({ ...p, coverArtUrl: result.coverArtUrl }));
    setCoverPreview(result.coverArtUrl);
    toast.success(
      result.usedPersonalFrequency
        ? "Cover art generated from your Visual Universe."
        : "Cover art generated using platform style."
    );
  } catch (err) {
    toast.error("Cover art generation failed. Try again or upload your own.");
  } finally {
    setGeneratingCoverArt(false);
  }
};

Step 6b — Add the "Generate with AI" button in the cover art card, after the existing upload area and before the <input ref={coverInputRef}...> line:

<div className="mt-3 flex gap-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="flex-1 border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400"
    onClick={handleGenerateCoverArt}
    disabled={generatingCoverArt}
  >
    {generatingCoverArt ? (
      <><Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Generating...</>
    ) : (
      <><Zap className="w-3 h-3 mr-1.5" /> Generate with AI</>
    )}
  </Button>
</div>

Step 6c — Add the imports to Upload.tsx:

import { Zap } from "lucide-react"; // add to existing lucide import



Part 7 — No Schema Migration Required
The Riff tracks table already has coverArtUrl text (line 66 in schema.ts). No migration is needed. The generateCoverArt mutation returns a URL that is stored in form.coverArtUrl and submitted with the track on save.



Part 8 — Deployment Notes
The Studios project must be published (not just running in dev) before the bridge will work from Riff's production environment.
The STUDIOS_BRIDGE_URL must be the production URL of Studios (e.g. https://strawberry-studios.manus.space), not the dev preview URL.
The STUDIOS_BRIDGE_KEY must be added to both projects as a secret — the same value in both. Choose a strong random string (32+ characters).
The bridge is gracefully degraded: if STUDIOS_BRIDGE_URL or STUDIOS_BRIDGE_KEY are not set, frequency.getDefault returns { hasFrequency: false } and the UI shows "Find Your Frequency" as a call to action. No errors are thrown.



Part 9 — Testing Checklist
After implementation, verify these flows:



Summary of Files to Create/Edit

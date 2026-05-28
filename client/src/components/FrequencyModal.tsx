import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, ChevronRight, ChevronLeft, Sparkles, Radio } from "lucide-react";
import { toast } from "sonner";

// Spec-aligned questions — indirect approach, felt/remembered not performed
const QUESTIONS = [
  {
    id: "q1_sound_space",
    label: "Question 1 of 4",
    question: "Think of a piece of music — yours or someone else's — that felt like it already knew something about you. What was happening in your life when you found it?",
    placeholder: "A season of life, a feeling, a moment. Whatever comes first...",
    hint: "No right answer. Just what's true.",
  },
  {
    id: "q2_light_color",
    label: "Question 2 of 4",
    question: "Where does a listener start when they enter your music — and where are they when it ends? Not what happens. What changes inside them.",
    placeholder: "They arrive carrying something heavy. They leave with it still there, but held differently...",
    hint: "The distance between those two states is the arc.",
  },
  {
    id: "q3_world_texture",
    label: "Question 3 of 4",
    question: "What is your music moving against? Not what it is — what it refuses to be.",
    placeholder: "Music that performs emotion rather than feeling it. Sound that decorates instead of means something...",
    hint: "What you're moving away from shapes what you're building.",
  },
  {
    id: "q4_arc_time",
    label: "Question 4 of 4",
    question: "If your music existed as a place — not a metaphor, an actual place — what would it look like? What time of day? What's the quality of the light?",
    placeholder: "Late afternoon in a room with high ceilings. The kind of light that makes everything feel like it's about to mean something...",
    hint: "Trust the first image that comes.",
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

type Screen = "loading" | "existing" | "intro" | "q1" | "q2" | "q3" | "q4" | "synthesizing" | "reflection" | "vocabulary" | "name";

const VOCAB_LABELS: Record<string, string> = {
  emotionalRegister: "Emotional Register",
  colorAndLight: "Color & Light",
  environment: "Environment",
  texture: "Texture",
  arcTerms: "Arc Terms",
  forbiddenTerms: "Avoid",
};

export function FrequencyModal({ open = true, onClose }: { open?: boolean; onClose: () => void }) {
  console.log("[FrequencyModal] Component rendered. open prop:", open);
  const utils = trpc.useUtils();
  console.log("[FrequencyModal] Setting up getDefault query");
  const { data: existingFrequency, isLoading: loadingExisting, isError: errorExisting } = trpc.frequency.getDefault.useQuery(undefined, {
    retry: 1,
    staleTime: 0,
  });
  // Log query state on every render to track when it resolves
  useEffect(() => {
    if (loadingExisting) {
      console.log("[FrequencyModal] Query is loading");
    } else if (errorExisting) {
      console.error("[FrequencyModal] Query failed with error");
    } else if (existingFrequency) {
      console.log("[FrequencyModal] Query succeeded:", existingFrequency);
    }
  }, [loadingExisting, errorExisting, existingFrequency]);
  console.log("[FrequencyModal] Query state - loading:", loadingExisting, "error:", errorExisting, "data:", existingFrequency);
  const synthesizeMutation = trpc.frequency.synthesize.useMutation();
  const saveMutation = trpc.frequency.save.useMutation();

  const [screen, setScreen] = useState<Screen>("loading");
  const [answers, setAnswers] = useState<Answers>({
    q1_sound_space: "",
    q2_light_color: "",
    q3_world_texture: "",
    q4_arc_time: "",
  });
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [frequencyName, setFrequencyName] = useState("");

  // Transition from loading to correct screen once query resolves — use useEffect to avoid render-phase side effects
  // Only run when query finishes loading, not on every screen change
  useEffect(() => {
    if (screen !== "loading") return;
    if (loadingExisting) return;
    console.log("[FrequencyModal] Query resolved. hasFrequency:", existingFrequency?.hasFrequency);
    if (errorExisting || !existingFrequency) {
      console.log("[FrequencyModal] No existing frequency, showing intro");
      setScreen("intro");
    } else if (existingFrequency.hasFrequency && existingFrequency.frequency) {
      console.log("[FrequencyModal] Existing frequency found, showing existing screen");
      setScreen("existing");
    } else {
      console.log("[FrequencyModal] No frequency, showing intro");
      setScreen("intro");
    }
  }, [loadingExisting, errorExisting, existingFrequency]);

  // Safety timeout: if still loading after 8s, go to intro anyway
  // Use a ref to track current screen so the timeout can check state when it fires
  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (screenRef.current === "loading") setScreen("intro");
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  const handleSynthesize = async () => {
    console.log("[FrequencyModal] handleSynthesize called, setting screen to 'synthesizing'");
    setScreen("synthesizing");
    try {
      console.log("[FrequencyModal] Calling synthesize mutation with answers:", answers);
      const result = await synthesizeMutation.mutateAsync(answers);
      console.log("[FrequencyModal] Synthesize succeeded, result:", result);
      setSynthesis(result.synthesis);
      setFrequencyName(result.synthesis.frequencyName);
      console.log("[FrequencyModal] Setting screen to 'reflection'");
      setScreen("reflection");
    } catch (err) {
      console.error("[FrequencyModal] Synthesize failed:", err);
      toast.error("Something went wrong. Please try again.");
      setScreen("q4");
    }
  };

  const handleSave = async () => {
    if (!synthesis) return;
    try {
      await saveMutation.mutateAsync({
        frequencyName: frequencyName.trim() || synthesis.frequencyName,
        arcType: synthesis.arcType as any,
        vocabularyJson: JSON.stringify(synthesis.vocabulary),
        synthesisFingerprint: synthesis.reflection,
        diagnosticAnswersJson: JSON.stringify(answers),
      });
      await utils.frequency.getDefault.invalidate();
      toast.success(`Your frequency "${frequencyName.trim() || synthesis.frequencyName}" is saved.`);
      onClose();
    } catch {
      toast.error("Save failed. Please try again.");
    }
  };

  const currentQ = QUESTIONS.find(q => q.id === screen);
  const currentAnswerKey = currentQ?.id as keyof Answers | undefined;
  const currentAnswer = currentAnswerKey ? answers[currentAnswerKey] : "";

  const questionIndex = QUESTIONS.findIndex(q => q.id === screen);

  const goBackFromQuestion = () => {
    if (questionIndex <= 0) setScreen("intro");
    else setScreen(QUESTIONS[questionIndex - 1].id as Screen);
  };

  const goNextFromQuestion = () => {
    console.log("[FrequencyModal] goNextFromQuestion called, questionIndex:", questionIndex, "total:", QUESTIONS.length);
    if (questionIndex >= QUESTIONS.length - 1) {
      console.log("[FrequencyModal] Last question answered, calling handleSynthesize");
      handleSynthesize();
    } else {
      const nextScreen = QUESTIONS[questionIndex + 1].id as Screen;
      console.log("[FrequencyModal] Moving to next question:", nextScreen);
      setScreen(nextScreen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d0a1a] border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Radio className="w-5 h-5 text-[#e91e8c]" />
            Find Your Frequency
          </DialogTitle>
        </DialogHeader>

        {/* Loading — bridge query in flight */}
        {screen === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <p className="text-sm text-gray-500">A moment...</p>
          </div>
        )}

        {/* Existing frequency view */}
        {screen === "existing" && existingFrequency?.frequency && (
          <div className="space-y-4">
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
              <p className="text-xs text-purple-300 uppercase tracking-wider mb-1">Your Frequency</p>
              <p className="text-xl font-bold text-white">{existingFrequency.frequency.frequencyName}</p>
              <p className="text-sm text-gray-400 mt-1 capitalize">
                {existingFrequency.frequency.arcType.replace(/_/g, " ")}
              </p>
              {existingFrequency.frequency.synthesisFingerprint && (
                <p className="text-sm text-gray-300 mt-3 italic leading-relaxed">
                  "{existingFrequency.frequency.synthesisFingerprint}"
                </p>
              )}
            </div>
            {existingFrequency.frequency.vocabularyJson && (() => {
              try {
                const vocab = JSON.parse(existingFrequency.frequency!.vocabularyJson);
                return (
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {Object.entries(VOCAB_LABELS).map(([key, label]) => {
                      const terms: string[] = vocab[key] ?? [];
                      if (!terms.length) return null;
                      return (
                        <div key={key} className="rounded-lg bg-white/5 border border-purple-500/10 p-2.5">
                          <p className="text-xs text-purple-300 mb-1">{label}</p>
                          <div className="flex flex-wrap gap-1">
                            {terms.slice(0, 4).map(t => (
                              <span key={t} className="text-xs bg-purple-500/20 text-purple-200 rounded-full px-2 py-0.5">{t}</span>
                            ))}
                            {terms.length > 4 && (
                              <span className="text-xs text-gray-500">+{terms.length - 4}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              } catch { return null; }
            })()}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-purple-500/30 text-gray-300 hover:text-white bg-transparent" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-[#e91e8c]/40 text-[#e91e8c] hover:bg-[#e91e8c]/10 bg-transparent"
                onClick={() => {
                  setAnswers({ q1_sound_space: "", q2_light_color: "", q3_world_texture: "", q4_arc_time: "" });
                  setSynthesis(null);
                  setScreen("intro");
                }}
              >
                Update My Frequency
              </Button>
            </div>
          </div>
        )}

        {/* Intro — spec-aligned copy */}
        {screen === "intro" && (
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs text-purple-300 uppercase tracking-wider">Strawberry Studios</p>
              <p className="text-2xl font-bold leading-tight">
                Find Your<br />
                <span className="text-[#e91e8c]">Frequency</span>
              </p>
              <p className="text-sm text-gray-400 italic">Same core identity. Spectrum of expression.</p>
            </div>
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>
                Every creator has a visual world that belongs to their music — a specific quality of light, a particular kind of space, a way that things move or hold still. Most platforms ignore this. They generate cover art from genre tags and stock imagery grammar.
              </p>
              <p>
                Find Your Frequency is different. It listens to how you talk about your music — not what genre it is, but what it feels like from the inside — and builds a persistent visual vocabulary from your own words. That vocabulary becomes the lens through which every piece of cover art is generated.
              </p>
              <p className="text-gray-500">
                Four questions. No right answers. The platform reflects back what it hears.
              </p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white h-12 text-base"
              onClick={() => {
                console.log("[FrequencyModal] Begin button clicked, transitioning to q1");
                setScreen(QUESTIONS[0].id as Screen);
              }}
            >
              Begin <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Diagnostic questions */}
        {currentQ && currentAnswerKey && (
          <div className="space-y-5">
            {/* Minimal progress — dots not a bar (spec: no progress bars that feel like obligations) */}
            <div className="flex items-center gap-1.5">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${i <= questionIndex ? "w-6 bg-[#e91e8c]" : "w-3 bg-white/10"}`}
                />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs text-purple-300 uppercase tracking-wider">{currentQ.label}</p>
              <p className="text-base text-gray-100 leading-relaxed">{currentQ.question}</p>
              <p className="text-xs text-gray-600 italic">{currentQ.hint}</p>
              <Textarea
                value={currentAnswer}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                placeholder={currentQ.placeholder}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-gray-600 min-h-[130px] resize-none mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-purple-500/30 text-gray-400 hover:text-white bg-transparent"
                onClick={goBackFromQuestion}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
                onClick={goNextFromQuestion}
                disabled={!currentAnswer.trim()}
              >
                {questionIndex >= QUESTIONS.length - 1 ? (
                  <>Synthesize <Sparkles className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Synthesizing — waiting state */}
        {screen === "synthesizing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#e91e8c]" />
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-300">Reading what you brought.</p>
              <p className="text-xs text-gray-600">This takes a moment.</p>
            </div>
          </div>
        )}

        {/* Reflection screen */}
        {screen === "reflection" && synthesis && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs text-purple-300 uppercase tracking-wider">What we heard</p>
              <p className="text-xs text-gray-600 italic">We noticed — you decide if it's true.</p>
            </div>
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-5">
              <p className="text-sm text-gray-200 leading-relaxed italic">"{synthesis.reflection}"</p>
            </div>
            <p className="text-xs text-gray-500 text-center">Does that feel true, or is something off?</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-purple-500/30 text-gray-400 hover:text-white bg-transparent"
                onClick={() => setScreen("q4")}
              >
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
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-purple-300 uppercase tracking-wider">Your Vocabulary</p>
              <p className="text-xs text-gray-600">Your language, ready to use.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
              {Object.entries({
                "Emotional Register": synthesis.vocabulary.emotionalRegister,
                "Color & Light": synthesis.vocabulary.colorAndLight,
                "Environment": synthesis.vocabulary.environment,
                "Texture": synthesis.vocabulary.texture,
                "Arc Terms": synthesis.vocabulary.arcTerms,
                "Avoid": synthesis.vocabulary.forbiddenTerms,
              }).map(([label, terms]) => (
                <div key={label} className="rounded-lg bg-white/5 border border-purple-500/10 p-3">
                  <p className="text-xs text-purple-300 mb-1.5">{label}</p>
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
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs text-purple-300 uppercase tracking-wider">Name Your Frequency</p>
              <p className="text-sm text-gray-400">
                We suggested <span className="text-purple-300">"{synthesis.frequencyName}"</span> — keep it or make it yours.
              </p>
            </div>
            <Input
              value={frequencyName}
              onChange={(e) => setFrequencyName(e.target.value)}
              placeholder={synthesis.frequencyName}
              className="bg-white/5 border-purple-500/20 text-white placeholder:text-gray-600"
              maxLength={100}
            />
            <Button
              className="w-full bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white h-12"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Save My Frequency</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

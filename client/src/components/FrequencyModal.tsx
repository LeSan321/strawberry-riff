import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
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

type Screen = "existing" | "q1" | "q2" | "q3" | "q4" | "reflection" | "vocabulary" | "name";

const SCREEN_ORDER: Screen[] = ["existing", "q1", "q2", "q3", "q4", "reflection", "vocabulary", "name"];

const VOCAB_LABELS: Record<string, string> = {
  emotionalRegister: "Emotional Register",
  colorAndLight: "Color & Light",
  environment: "Environment",
  texture: "Texture",
  arcTerms: "Arc Terms",
  forbiddenTerms: "Avoid",
};

export function FrequencyModal({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: existingFrequency, isLoading: loadingExisting } = trpc.frequency.getDefault.useQuery();
  const synthesizeMutation = trpc.frequency.synthesize.useMutation();
  const saveMutation = trpc.frequency.save.useMutation();

  const [screen, setScreen] = useState<Screen>("existing");
  const [answers, setAnswers] = useState<Answers>({
    q1_sound_space: "",
    q2_light_color: "",
    q3_world_texture: "",
    q4_arc_time: "",
  });
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [frequencyName, setFrequencyName] = useState("");

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

  const goBack = () => {
    const idx = SCREEN_ORDER.indexOf(screen);
    setScreen(SCREEN_ORDER[Math.max(0, idx - 1)]);
  };

  const goNext = () => {
    const idx = SCREEN_ORDER.indexOf(screen);
    setScreen(SCREEN_ORDER[Math.min(SCREEN_ORDER.length - 1, idx + 1)]);
  };

  const currentQ = QUESTIONS.find(q => q.id === screen);
  const currentAnswerKey = currentQ?.id as keyof Answers | undefined;
  const currentAnswer = currentAnswerKey ? answers[currentAnswerKey] : "";

  const stepNumber = ["q1", "q2", "q3", "q4"].indexOf(screen as any) + 1;
  const totalSteps = 4;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d0a1a] border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-[#e91e8c]" />
            {screen === "existing" ? "Your Visual Universe" : "Find Your Frequency"}
          </DialogTitle>
        </DialogHeader>

        {/* Loading state */}
        {screen === "existing" && loadingExisting && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        )}

        {/* Existing frequency view */}
        {screen === "existing" && !loadingExisting && existingFrequency?.hasFrequency && existingFrequency.frequency && (
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
        {screen === "existing" && !loadingExisting && !existingFrequency?.hasFrequency && (
          <div className="space-y-4">
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#e91e8c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    Your Visual Universe is the visual language of your music. Answer four questions and the system will synthesize a personal vocabulary that guides your cover art AI.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Takes about 3–5 minutes. No right answers.</p>
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
              onClick={() => setScreen("q1")}
            >
              Begin <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Diagnostic questions */}
        {currentQ && currentAnswerKey && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(n => (
                  <div
                    key={n}
                    className={`h-1 w-8 rounded-full transition-colors ${n <= stepNumber ? "bg-[#e91e8c]" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">{stepNumber} of {totalSteps}</span>
            </div>
            <div>
              <p className="text-xs text-purple-300 uppercase tracking-wider mb-2">{currentQ.label}</p>
              <p className="text-sm text-gray-200 leading-relaxed mb-3">{currentQ.question}</p>
              <Textarea
                value={currentAnswer}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                placeholder={currentQ.placeholder}
                className="bg-white/5 border-purple-500/20 text-white placeholder:text-gray-600 min-h-[120px] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-purple-500/30 text-gray-400 hover:text-white"
                onClick={goBack}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {screen === "q4" ? (
                <Button
                  className="flex-1 bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
                  onClick={handleSynthesize}
                  disabled={!currentAnswer.trim() || synthesizeMutation.isPending}
                >
                  {synthesizeMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Synthesizing...</>
                  ) : (
                    <>Synthesize <Sparkles className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-gradient-to-r from-[#e91e8c] to-[#7c3aed] text-white"
                  onClick={goNext}
                  disabled={!currentAnswer.trim()}
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
            <p className="text-xs text-gray-500 text-center">Does that feel true, or is something off?</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-purple-500/30 text-gray-400 hover:text-white"
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
              <p className="text-sm text-gray-400 mb-3">
                We suggested <span className="text-purple-300">"{synthesis.frequencyName}"</span> — keep it or make it yours.
              </p>
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

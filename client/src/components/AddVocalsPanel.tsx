/**
 * AddVocalsPanel — Platinum Tier Studio Tool
 *
 * Three-step workflow:
 *   1. Pick a completed fusion instrumental as the base
 *   2. Optionally pick a vocal character source (a track whose vocal stem will be used)
 *   3. Write lyrics + set a cultural style anchor → submit
 *
 * The server pipeline (vocalPipeline.ts) handles:
 *   MiniMax Quick Generate → StemSplit vocal extraction → ffmpeg mix → final track
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mic2,
  Music2,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Crown,
  Play,
  Pause,
  RefreshCw,
  Download,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Style anchor presets ─────────────────────────────────────────────────────
const STYLE_ANCHORS = [
  { label: "Celtic", value: "Celtic" },
  { label: "Appalachian", value: "Appalachian" },
  { label: "Blues", value: "Blues" },
  { label: "Gospel", value: "Gospel" },
  { label: "Flamenco", value: "Flamenco" },
  { label: "Nordic Folk", value: "Nordic folk" },
  { label: "Afrobeat", value: "Afrobeat" },
  { label: "Bossa Nova", value: "Bossa Nova" },
  { label: "Hindustani", value: "Hindustani" },
  { label: "Cajun", value: "Cajun" },
];

// ─── Status step indicator ────────────────────────────────────────────────────
const PIPELINE_STEPS: Record<string, { label: string; step: number }> = {
  pending: { label: "Queued", step: 0 },
  generating_vocal: { label: "Generating vocal track…", step: 1 },
  splitting_stems: { label: "Extracting vocal stem…", step: 2 },
  mixing: { label: "Mixing onto fusion…", step: 3 },
  complete: { label: "Complete!", step: 4 },
  failed: { label: "Failed", step: -1 },
};

function PipelineProgress({ status }: { status: string }) {
  const info = PIPELINE_STEPS[status] ?? { label: status, step: 0 };
  const steps = ["Generate", "Extract", "Mix", "Done"];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {info.step === -1 ? (
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        ) : info.step === 4 ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        ) : (
          <Loader2 className="w-4 h-4 text-pink-400 animate-spin flex-shrink-0" />
        )}
        <span className="text-sm text-gray-300">{info.label}</span>
      </div>
      {info.step >= 0 && (
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  i < info.step
                    ? "bg-emerald-500"
                    : i === info.step - 1
                    ? "bg-pink-500 animate-pulse"
                    : "bg-white/10"
                }`}
              />
              <span className="text-[9px] text-gray-500 hidden md:block">{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Project result card ──────────────────────────────────────────────────────
function ProjectCard({
  project,
  textAccent,
}: {
  project: {
    id: number;
    status: string;
    fusionTitle: string | null;
    resultAudioUrl: string | null;
    errorMessage: string | null;
    createdAt: Date;
  };
  textAccent: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [audio] = useState(() => (project.resultAudioUrl ? new Audio(project.resultAudioUrl) : null));

  useEffect(() => {
    if (!audio) return;
    audio.onended = () => setPlaying(false);
    return () => {
      audio.pause();
      audio.onended = null;
    };
  }, [audio]);

  const togglePlay = () => {
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-white truncate">
            {project.fusionTitle ?? "Untitled fusion"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] flex-shrink-0 ${
            project.status === "complete"
              ? "border-emerald-500/40 text-emerald-400"
              : project.status === "failed"
              ? "border-red-500/40 text-red-400"
              : "border-pink-500/40 text-pink-400"
          }`}
        >
          {project.status === "complete"
            ? "Ready"
            : project.status === "failed"
            ? "Failed"
            : "Processing"}
        </Badge>
      </div>

      {project.status !== "complete" && project.status !== "failed" && (
        <PipelineProgress status={project.status} />
      )}

      {project.status === "failed" && project.errorMessage && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {project.errorMessage}
        </p>
      )}

      {project.status === "complete" && project.resultAudioUrl && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={togglePlay}
            className="flex-1 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
          >
            {playing ? (
              <Pause className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-1.5" />
            )}
            {playing ? "Pause" : "Play"}
          </Button>
          <a
            href={project.resultAudioUrl}
            download={`${project.fusionTitle ?? "vocal-mix"}.mp3`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 text-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Polling hook ─────────────────────────────────────────────────────────────
function usePollingProject(projectId: number | null) {
  const query = trpc.vocalProjects.get.useQuery(
    { projectId: projectId! },
    {
      enabled: projectId !== null,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return 5000;
        const s = data.status;
        if (s === "complete" || s === "failed") return false;
        return 5000;
      },
    }
  );
  return query;
}

// ─── Main panel ──────────────────────────────────────────────────────────────
interface AddVocalsPanelProps {
  textAccent: string;
  buttonAccent: string;
}

export function AddVocalsPanel({ textAccent, buttonAccent }: AddVocalsPanelProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Form state
  const [selectedFusionId, setSelectedFusionId] = useState<number | null>(null);
  const [selectedVocalSourceId, setSelectedVocalSourceId] = useState<number | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [styleAnchor, setStyleAnchor] = useState("Celtic");
  const [customAnchor, setCustomAnchor] = useState("");
  const [useCustomAnchor, setUseCustomAnchor] = useState(false);

  // Active project polling
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const { data: activeProject } = usePollingProject(activeProjectId);

  // Data queries
  const generationsQuery = trpc.musicGeneration.myGenerations.useQuery(undefined, {
    enabled: !!user,
  });
  const vocalOptionsQuery = trpc.vocalProjects.getVocalStemOptions.useQuery(undefined, {
    enabled: !!user,
  });
  const projectsQuery = trpc.vocalProjects.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Start mutation
  const startMutation = trpc.vocalProjects.start.useMutation({
    onSuccess: (data) => {
      setActiveProjectId(data.projectId);
      utils.vocalProjects.list.invalidate();
      toast.success("Vocal pipeline started! This takes 3–5 minutes.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Notify when active project completes
  useEffect(() => {
    if (activeProject?.status === "complete") {
      toast.success("Your vocal mix is ready!");
      utils.vocalProjects.list.invalidate();
      setActiveProjectId(null);
    } else if (activeProject?.status === "failed") {
      toast.error(`Pipeline failed: ${(activeProject as { errorMessage?: string | null }).errorMessage ?? "unknown error"}`);
      utils.vocalProjects.list.invalidate();
      setActiveProjectId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.status]);

  const handleSubmit = () => {
    if (!selectedFusionId) {
      toast.error("Please select a fusion instrumental");
      return;
    }
    if (lyrics.trim().length < 10) {
      toast.error("Please enter at least 10 characters of lyrics");
      return;
    }
    const anchor = useCustomAnchor ? customAnchor.trim() : styleAnchor;
    if (!anchor) {
      toast.error("Please set a cultural style anchor");
      return;
    }

    startMutation.mutate({
      fusionGenerationId: selectedFusionId,
      vocalSourceGenerationId: selectedVocalSourceId ?? undefined,
      lyrics: lyrics.trim(),
      styleAnchor: anchor,
    });
  };

  const isPremium = user?.isPremium ?? false;

  // ── Platinum gate ──
  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Platinum Feature</h2>
        <p className="text-gray-400 max-w-sm text-sm">
          Add Vocals is part of the Platinum tier — the full studio workflow for adding a vocal
          performance to your fusion instrumentals.
        </p>
        <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Platinum
        </Button>
      </div>
    );
  }

  type Generation = NonNullable<typeof generationsQuery.data>[number];
  // Show all completed generations — user picks which fusion to use
  const instrumentalGenerations = (generationsQuery.data ?? []).filter(
    (g: Generation) => g.status === "complete" && g.audioUrl
  );

  return (
    <div className="px-4 py-6 space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mic2 className={`w-5 h-5 ${textAccent}`} />
          <h2 className="text-lg font-bold text-white">Add Vocals</h2>
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
            Platinum
          </Badge>
        </div>
        <p className="text-sm text-gray-400">
          Layer a vocal performance onto any fusion instrumental. The pipeline generates a vocal
          track, extracts the stem, and mixes it onto your original fusion — keeping its full
          timbral identity intact.
        </p>
      </div>

      {/* Active project progress */}
      {activeProjectId && activeProject && (
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-3">
            Pipeline Running
          </p>
          <PipelineProgress status={activeProject.status} />
        </div>
      )}

      {/* Step 1: Select fusion */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
            1
          </span>
          <h3 className="text-sm font-semibold text-white">Select Fusion Instrumental</h3>
        </div>

        {generationsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading generations…
          </div>
        ) : instrumentalGenerations.length === 0 ? (
          <p className="text-sm text-gray-500">
            No completed generations found. Generate a fusion instrumental first.
          </p>
        ) : (
          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
            {instrumentalGenerations.slice(0, 20).map((g: Generation) => (
              <button
                key={g.id}
                onClick={() => setSelectedFusionId(g.id === selectedFusionId ? null : g.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  selectedFusionId === g.id
                    ? "border-pink-500/50 bg-pink-500/10 text-white"
                    : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <Music2 className="w-4 h-4 flex-shrink-0 text-pink-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{g.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {selectedFusionId === g.id && (
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Step 2: Vocal character source (optional) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
            2
          </span>
          <h3 className="text-sm font-semibold text-white">
            Vocal Character Source{" "}
            <span className="text-gray-500 font-normal">(optional)</span>
          </h3>
        </div>
        <p className="text-xs text-gray-500">
          Pick a track whose vocal stem will condition the voice timbre and delivery style. Run
          StemSplit on a track first to make it available here.
        </p>

        {vocalOptionsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading vocal options…
          </div>
        ) : (vocalOptionsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">
            No vocal stems available yet. Run StemSplit on a generation to create one.
          </p>
        ) : (
          <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedVocalSourceId(null)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                selectedVocalSourceId === null
                  ? "border-pink-500/50 bg-pink-500/10 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <span className="text-sm">No vocal reference (use style anchor only)</span>
              {selectedVocalSourceId === null && (
                <CheckCircle2 className="w-4 h-4 text-pink-400 ml-auto flex-shrink-0" />
              )}
            </button>
            {(vocalOptionsQuery.data ?? []).map((opt: NonNullable<typeof vocalOptionsQuery.data>[number]) => (
              <button
                key={opt.generationId}
                onClick={() =>
                  setSelectedVocalSourceId(
                    opt.generationId === selectedVocalSourceId ? null : opt.generationId
                  )
                }
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  selectedVocalSourceId === opt.generationId
                    ? "border-pink-500/50 bg-pink-500/10 text-white"
                    : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <Mic2 className="w-4 h-4 flex-shrink-0 text-pink-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{opt.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(opt.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {selectedVocalSourceId === opt.generationId && (
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Step 3: Cultural style anchor */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
            3
          </span>
          <h3 className="text-sm font-semibold text-white">Cultural Style Anchor</h3>
        </div>
        <p className="text-xs text-gray-500">
          A single cultural descriptor that shapes the vocal accent, melodic phrasing, and
          arrangement character. Keep it to one word or short phrase.
        </p>

        <div className="flex flex-wrap gap-2">
          {STYLE_ANCHORS.map((a) => (
            <button
              key={a.value}
              onClick={() => {
                setStyleAnchor(a.value);
                setUseCustomAnchor(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                !useCustomAnchor && styleAnchor === a.value
                  ? "border-pink-500 bg-pink-500/20 text-pink-300"
                  : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {a.label}
            </button>
          ))}
          <button
            onClick={() => setUseCustomAnchor(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              useCustomAnchor
                ? "border-pink-500 bg-pink-500/20 text-pink-300"
                : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            Custom…
          </button>
        </div>

        {useCustomAnchor && (
          <Input
            value={customAnchor}
            onChange={(e) => setCustomAnchor(e.target.value)}
            placeholder="e.g. Balkan, Tuvan, Creole…"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm"
          />
        )}
      </section>

      {/* Step 4: Lyrics */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
            4
          </span>
          <h3 className="text-sm font-semibold text-white">Lyrics</h3>
        </div>
        <p className="text-xs text-gray-500">
          Lyrics are the primary steering signal. Use instrument vocabulary (pipes, chanter, drone,
          skirl), avoid strong geographic anchors (Tennessee, Carolina), and write in a rhythm that
          matches your intended groove.
        </p>
        <Textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder={"[Verse 1]\nPipes came over on a wooden ship\nStrings were waiting on the other shore…\n\n[Chorus]\nReel it back, reel it back…"}
          rows={10}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm font-mono resize-none"
        />
        <p className="text-xs text-gray-500 text-right">{lyrics.length} chars</p>
      </section>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={startMutation.isPending || !!activeProjectId || !selectedFusionId || lyrics.trim().length < 10}
        className={`w-full ${buttonAccent} text-white font-semibold py-3`}
      >
        {startMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Starting pipeline…
          </>
        ) : (
          <>
            <ChevronRight className="w-4 h-4 mr-2" />
            Generate Vocal Mix
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Pipeline takes approximately 3–5 minutes. You can continue working in the Studio while it
        runs.
      </p>

      {/* Past projects */}
      {(projectsQuery.data ?? []).length > 0 && (
        <section className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Past Projects</h3>
            <button
              onClick={() => projectsQuery.refetch()}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {(projectsQuery.data ?? []).slice(0, 10).map((p) => (
              <ProjectCard key={p.id} project={p} textAccent={textAccent} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Music, Share2, Trash2, RefreshCw, Sparkles, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StemSplitButton } from "@/components/StemSplitButton";
import { StemsStudio } from "./StemsStudio";

/**
 * TrackDetail Page
 * Displays full track information, lyrics, metadata, and stems (if split)
 * Accessible from Generate page by clicking track title
 */
export default function TrackDetail() {
  const { generationId } = useParams<{ generationId: string }>();
  const [, navigate] = useLocation();
  const [showStemsView, setShowStemsView] = useState(false);

  const id = generationId ? parseInt(generationId, 10) : null;

  // Fetch generation data
  const { data: generation, isLoading, error } = trpc.musicGeneration.getById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const deleteMutation = trpc.musicGeneration.delete.useMutation();
  const regenerateMutation = trpc.musicGeneration.regenerate.useMutation();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Invalid track ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !generation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive">Failed to load track</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  // If stems are split and user wants to view stems, show StemsStudio
  if (showStemsView && generation.isSplit) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-10"
          onClick={() => setShowStemsView(false)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Details
        </Button>
        <StemsStudio />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Delete this track? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync({ id: generation.id });
      toast.success("Track deleted");
      navigate("/");
    } catch (err) {
      toast.error("Failed to delete track");
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync({
        generationId: generation.id,
        refinement: "different_vibe",
      });
      toast.success("Regenerating track...");
    } catch (err) {
      toast.error("Failed to regenerate");
    }
  };

  const statusColor = {
    generating: "bg-purple-500/10 text-purple-700 border-purple-500/30",
    complete: "bg-green-500/10 text-green-700 border-green-500/30",
    failed: "bg-destructive/10 text-destructive border-destructive/30",
  }[generation.status] || "bg-gray-500/10 text-gray-700 border-gray-500/30";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{generation.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusColor}>
                  {generation.status === "generating" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {generation.status.charAt(0).toUpperCase() + generation.status.slice(1)}
                </Badge>
                {generation.isSplit && (
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                    ✓ Stems Split
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(generation.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" title="Share">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRegenerate}
                disabled={regenerateMutation.isPending}
                title="Regenerate with different vibe"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                title="Delete track"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Track Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Playback */}
            {generation.status === "complete" && generation.audioUrl && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Playback
                </h2>
                <audio
                  controls
                  src={generation.audioUrl}
                  className="w-full"
                />
              </Card>
            )}

            {/* Lyrics */}
            {generation.lyrics && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Lyrics</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">
                    {generation.lyrics}
                  </p>
                </div>
              </Card>
            )}

            {/* Music Style Prompt */}
            {generation.prompt && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Music Style
                </h2>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {generation.prompt}
                </p>
              </Card>
            )}

            {/* Stems Section */}
            {generation.isSplit && (
              <Card className="p-6 border-emerald-500/30 bg-emerald-500/5">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600" />
                  Stems Available
                </h2>
                <p className="text-sm text-foreground/70 mb-4">
                  This track has been split into individual stems. View the full stems studio to mix and download.
                </p>
                <Button
                  onClick={() => setShowStemsView(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  View Stems Studio
                </Button>
              </Card>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Actions</h3>
              <div className="space-y-2">
                {generation.status === "complete" && (
                  <>
                    <Button className="w-full" size="sm">
                      <Music className="w-4 h-4 mr-2" />
                      Publish
                    </Button>
                    {!generation.isSplit && (
                      <StemSplitButton
                        generationId={generation.id}
                        isSplit={false}
                        className="w-full"
                      />
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{generation.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(generation.createdAt).toLocaleString()}
                  </p>
                </div>
                {generation.errorMessage && (
                  <div>
                    <p className="text-muted-foreground">Error</p>
                    <p className="font-medium text-destructive text-xs">
                      {generation.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

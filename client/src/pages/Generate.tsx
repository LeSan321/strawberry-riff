import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Music, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function GeneratePage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [duration, setDuration] = useState("240");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const generateMutation = trpc.musicGeneration.generate.useMutation();
  const { data: myGenerations, isLoading: isLoadingGenerations } =
    trpc.musicGeneration.myGenerations.useQuery(undefined, {
      enabled: !!user,
    });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessId(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }
    if (!lyrics.trim()) {
      setError("Lyrics are required");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({
        title: title.trim(),
        prompt: prompt.trim(),
        lyrics: lyrics.trim(),
        duration: parseInt(duration),
      });

      setSuccessId(result.id);
      setTitle("");
      setPrompt("");
      setLyrics("");
      setDuration("240");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-bold">Sign in to Generate Music</h2>
          <p className="text-muted-foreground">
            Create beautiful AI-generated music with ACE-Step
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Generation Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Generate Music</h1>
              <p className="mt-2 text-muted-foreground">
                Create AI-generated music using ACE-Step. Provide a prompt, lyrics, and duration.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., Jazz Noir Session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isGenerating}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {title.length}/200
                </p>
              </div>

              {/* Prompt */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Music Prompt
                </label>
                <Textarea
                  placeholder="e.g., jazz, noir, 95 BPM, piano, drums, smoky atmosphere, intimate, melancholic"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  maxLength={1000}
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {prompt.length}/1000 characters
                </p>
              </div>

              {/* Lyrics */}
              <div>
                <label className="mb-2 block text-sm font-medium">Lyrics</label>
                <Textarea
                  placeholder={`[verse]\nSing your heart out\n\n[chorus]\nThis is the chorus\n\n[verse]\nSecond verse here\n\n[chorus]\nRepeat the chorus`}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  disabled={isGenerating}
                  rows={8}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use [verse], [chorus], [bridge] tags to structure your lyrics
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="mb-2 block text-sm font-medium">Duration</label>
                <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="240">4 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Success */}
              {successId && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Music generation started! Check your library for updates.
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={isGenerating || !title.trim() || !prompt.trim() || !lyrics.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Music className="mr-2 h-4 w-4" />
                    Generate Music
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Recent Generations */}
        <div>
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold">Recent Generations</h2>
            {isLoadingGenerations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myGenerations && myGenerations.length > 0 ? (
              <div className="space-y-3">
                {myGenerations.slice(0, 5).map((gen) => (
                  <div
                    key={gen.id}
                    className="rounded-lg border p-3 text-sm hover:bg-accent"
                  >
                    <p className="font-medium truncate">{gen.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {gen.duration}s • {gen.status}
                    </p>
                    {gen.status === "complete" && gen.audioUrl && (
                      <audio
                        src={gen.audioUrl}
                        controls
                        className="mt-2 w-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No generations yet. Create one to get started!
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

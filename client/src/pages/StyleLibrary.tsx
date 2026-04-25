import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BookMarked,
  GitFork,
  Pencil,
  Trash2,
  Zap,
  Music2,
  Clock,
  BarChart2,
  Crown,
  ArrowLeft,
  Plus,
} from "lucide-react";

export function StyleLibrary() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: styles, isLoading, refetch } = trpc.styleLibrary.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteMutation = trpc.styleLibrary.delete.useMutation({
    onSuccess: () => {
      toast.success("Style removed from library");
      refetch();
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to delete style"),
  });

  const updateMutation = trpc.styleLibrary.update.useMutation({
    onSuccess: () => {
      toast.success("Style updated");
      refetch();
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update style"),
  });

  const useMutation = trpc.styleLibrary.use.useMutation();

  const handleUseStyle = (style: { id: number; prompt: string; name: string }) => {
    useMutation.mutate({ id: style.id });
    sessionStorage.setItem("prefill_prompt", style.prompt);
    sessionStorage.setItem("prefill_style_name", style.name);
    navigate("/generate");
    toast.success(`"${style.name}" loaded into Generate`);
  };

  const handleRiffOnStyle = (style: { id: number; prompt: string; name: string }) => {
    useMutation.mutate({ id: style.id });
    const riffPrompt = `${style.prompt} — complementary variation, same energy, different mood`;
    sessionStorage.setItem("prefill_prompt", riffPrompt);
    sessionStorage.setItem("prefill_style_name", `Riff on: ${style.name}`);
    navigate("/generate");
    toast.success(`Riffing on "${style.name}"`);
  };

  const handleEditSave = (id: number) => {
    updateMutation.mutate({ id, name: editName, notes: editNotes });
  };

  const openEdit = (style: { id: number; name: string; notes?: string | null }) => {
    setEditingId(style.id);
    setEditName(style.name);
    setEditNotes(style.notes ?? "");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-bold mb-2">Sign in to access your Style Library</h2>
            <p className="text-muted-foreground mb-4">Save and reuse your favourite music style prompts.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/generate")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Generate
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-bold">My Style Library</h1>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats bar */}
        {styles && styles.length > 0 && (
          <div className="flex items-center gap-6 mb-8 p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm">
              <BookMarked className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">{styles.length}</span>
              <span className="text-muted-foreground">saved styles</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart2 className="w-4 h-4 text-violet-500" />
              <span className="font-semibold">{styles.reduce((sum, s) => sum + s.usageCount, 0)}</span>
              <span className="text-muted-foreground">total uses</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Music2 className="w-4 h-4 text-rose-500" />
              <span className="font-semibold">{styles.filter(s => s.sourceGenerationId).length}</span>
              <span className="text-muted-foreground">from generations</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!styles || styles.length === 0) && (
          <div className="text-center py-20">
            <BookMarked className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2">Your Style Library is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              After generating a song, click <strong>Save to Library</strong> on any generation card to save its music style prompt here for reuse.
            </p>
            <Button onClick={() => navigate("/generate")} className="gap-2">
              <Plus className="w-4 h-4" />
              Start Generating
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Style cards */}
        {styles && styles.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {styles.map(style => (
              <Card key={style.id} className="group relative overflow-hidden border hover:border-amber-500/40 transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{style.name}</CardTitle>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(style)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(style.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {style.sourceTitle && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Music2 className="w-3 h-3" />
                      From: {style.sourceTitle}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Prompt preview */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-foreground/80 line-clamp-3 font-mono text-xs leading-relaxed">
                      {style.prompt}
                    </p>
                  </div>

                  {/* Notes */}
                  {style.notes && (
                    <p className="text-xs text-muted-foreground italic line-clamp-2">{style.notes}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" />
                      {style.usageCount} uses
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(style.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => handleUseStyle(style)}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Use This Style
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={() => handleRiffOnStyle(style)}
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      Riff on It
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Style</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Style name..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="What makes this style special..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button
              onClick={() => editingId && handleEditSave(editingId)}
              disabled={!editName.trim() || updateMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Library?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            This style will be removed from your library. Your past generations using it won't be affected.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate({ id: deleteConfirmId })}
              disabled={deleteMutation.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

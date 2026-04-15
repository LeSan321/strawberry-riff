import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ListPlus, Check, Loader2, ListMusic } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AddToPlaylistButtonProps {
  trackId: number;
  /** Optional: compact icon-only mode (default: false) */
  iconOnly?: boolean;
  className?: string;
}

export function AddToPlaylistButton({ trackId, iconOnly = false, className }: AddToPlaylistButtonProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const playlistsQuery = trpc.playlists.list.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });

  const addMutation = trpc.playlists.addTrack.useMutation({
    onSuccess: (_data, variables) => {
      setAddedIds((prev) => new Set(prev).add(variables.playlistId));
      toast.success("Added to playlist 🍓", { duration: 2000 });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) return null;

  const playlists = (playlistsQuery.data ?? []) as Array<{
    id: number;
    title: string;
    trackCount: number;
    gradient?: string | null;
  }>;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${className ?? ""}`}
          title="Add to playlist"
          onClick={(e) => e.stopPropagation()}
        >
          <ListPlus className="w-4 h-4 text-gray-400 hover:text-purple-500 transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
          <ListMusic className="w-3.5 h-3.5" />
          Add to playlist
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {playlistsQuery.isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-2">No playlists yet.</p>
            <Link href="/playlists">
              <span className="text-xs text-purple-500 hover:underline cursor-pointer">
                Create your first playlist →
              </span>
            </Link>
          </div>
        ) : (
          playlists.map((pl) => {
            const isAdded = addedIds.has(pl.id);
            const isPending = addMutation.isPending && !isAdded;
            return (
              <DropdownMenuItem
                key={pl.id}
                className="flex items-center justify-between cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  if (!isAdded) {
                    addMutation.mutate({ playlistId: pl.id, trackId });
                  }
                }}
              >
                <span className="truncate text-sm">{pl.title}</span>
                <span className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {isAdded ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{pl.trackCount}</span>
                  )}
                </span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

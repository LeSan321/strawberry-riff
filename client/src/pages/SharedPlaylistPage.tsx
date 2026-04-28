import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Play, Pause, Heart, Share2, LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function SharedPlaylistPage() {
  const { token } = useParams<{ token: string }>();
  const { user, isAuthenticated } = useAuth();
  const { play, pause, currentTrack, isPlaying } = useAudioPlayer();
  const [followPending, setFollowPending] = useState(false);

  const sharedQuery = trpc.playlists.getShared.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const followMutation = trpc.friends.follow.useMutation({
    onSuccess: () => {
      toast.success("Followed!");
      sharedQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFollow = () => {
    if (creator?.id) {
      setFollowPending(true);
      followMutation.mutate({ userId: creator.id });
    }
  };

  const playlist = sharedQuery.data?.playlist;
  const creator = sharedQuery.data?.owner;
  const tracks = sharedQuery.data?.tracks || [];
  const isFollowing = user?.id !== creator?.id && (sharedQuery.data?.owner?.id ? true : false);

  if (sharedQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!playlist || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Playlist not found</h1>
          <p className="text-muted-foreground mb-6">This playlist link may have expired or been revoked.</p>
          <Button
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0"
            onClick={() => (window.location.href = "/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const hasAccess = isFollowing || (isAuthenticated && user?.id === creator.id);

  if (!hasAccess && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            You need to follow {creator.displayName} to view this playlist.
          </p>
          <Button
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0"
            onClick={handleFollow}
            disabled={followPending}
          >
            {followPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Follow to Access
          </Button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to view playlist</h1>
          <p className="text-muted-foreground mb-6">
            This is a private playlist shared with followers and friends.
          </p>
          <Button
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Card */}
      <div className="relative h-64 md:h-80 overflow-hidden rounded-lg mx-4 md:mx-0 md:rounded-none">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient || "from-pink-400 to-purple-500"}`}
        />
        {playlist.coverArtUrl && (
          <img
            src={playlist.coverArtUrl}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <p className="text-sm text-muted-foreground mb-2">Playlist</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{playlist.title}</h1>
          {playlist.description && (
            <p className="text-white/80 text-lg mb-4">{playlist.description}</p>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
            {creator?.avatarUrl && (
              <img src={creator.avatarUrl} alt={creator?.displayName || "Creator"} className="w-10 h-10 rounded-full" />
            )}
              <div>
                <p className="text-sm font-medium text-white">{creator.displayName}</p>
                <p className="text-xs text-white/70">{tracks.length} tracks</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="container py-8">
        {tracks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tracks in this playlist yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, idx) => (
              <Card
                key={track.id}
                className="p-4 hover:bg-card/80 transition-colors cursor-pointer group"
                onClick={() => play(track)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    {track.coverArtUrl && (
                      <img src={track.coverArtUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <span className="relative z-10">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist || "Unknown Artist"}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {Math.floor((track.duration || 0) / 60)}:
                    {String((track.duration || 0) % 60).padStart(2, "0")}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

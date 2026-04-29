import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Play, Pause, Heart, LogIn, Music } from "lucide-react";
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
    <div className="min-h-screen pb-32 flex flex-col items-center justify-center px-4 md:px-0">
      {/* Centered Release Card */}
      <div className="w-full max-w-2xl">
        {/* Cover Art - Prominent */}
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl">
            <div
              className={`w-full h-full bg-gradient-to-br ${playlist.gradient || "from-pink-400 to-purple-500"} flex items-center justify-center`}
            >
              {playlist.coverArtUrl ? (
                <img
                  src={playlist.coverArtUrl}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-24 h-24 text-white/30" />
              )}
            </div>
          </div>
        </div>

        {/* Playlist Title & Creator Info */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            {playlist.title}
          </h1>
          
          {/* Creator Profile Section */}
          <div className="flex flex-col items-center gap-3 mb-6">
            {creator?.avatarUrl && (
              <img
                src={creator.avatarUrl}
                alt={creator?.displayName || "Creator"}
                className="w-16 h-16 rounded-full border-2 border-purple-500/30"
              />
            )}
            <div>
              <p className="text-xl font-semibold text-foreground">{creator.displayName}</p>
            </div>
          </div>

          {/* Description */}
          {playlist.description && (
            <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
              {playlist.description}
            </p>
          )}

          {/* Follow Button */}
          {user?.id !== creator?.id && !isFollowing && (
            <Button
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 mb-6"
              onClick={handleFollow}
              disabled={followPending}
            >
              {followPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Follow {creator.displayName}
            </Button>
          )}
        </div>

        {/* Tracks List - Elegant & Minimal */}
        <div className="mb-12">
          {tracks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tracks in this playlist yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map((track) => (
                <Card
                  key={track.id}
                  className="p-4 hover:bg-card/80 transition-all duration-200 cursor-pointer group border border-border/50 hover:border-purple-500/50"
                  onClick={() => play(track)}
                >
                  <div className="flex items-center gap-4">
                    {/* Play Button & Cover */}
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:shadow-lg transition-shadow">
                      {track.coverArtUrl && (
                        <img
                          src={track.coverArtUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <span className="relative z-10">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-0.5" />
                        )}
                      </span>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate group-hover:text-purple-400 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artist || "Unknown Artist"}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="text-sm text-muted-foreground flex-shrink-0">
                      {Math.floor((track.duration || 0) / 60)}:
                      {String((track.duration || 0) % 60).padStart(2, "0")}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* More from Creator Section */}
        <div className="border-t border-border/50 pt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            More from {creator.displayName}
          </h2>
          
          {/* Placeholder for other creator playlists/tracks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 text-center border border-border/50 hover:border-purple-500/50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-shadow">
                <Music className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-muted-foreground">Explore more playlists</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Coming soon</p>
            </Card>
            
            <Card className="p-6 text-center border border-border/50 hover:border-purple-500/50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center mx-auto mb-3 group-hover:shadow-lg transition-shadow">
                <Music className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-muted-foreground">Discover their riffs</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Coming soon</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

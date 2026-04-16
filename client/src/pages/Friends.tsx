import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  UserMinus,
  Music,
  Play,
  Pause,
  Loader2,
  Globe,
  Lock,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface UserCard {
  id: number;
  name?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  isFollowing: boolean;
}

interface Track {
  id: number;
  title: string;
  artist?: string | null;
  audioUrl: string;
  visibility: string;
  gradient?: string | null;
  coverArtUrl?: string | null;
  moodTags: string[];
  likes: number;
  userId: number;
}

function UserRow({ user }: { user: UserCard }) {
  const utils = trpc.useUtils();
  const followMutation = trpc.friends.follow.useMutation({
    onSuccess: () => {
      utils.friends.allUsers.invalidate();
      utils.friends.following.invalidate();
      toast.success(`Following ${user.displayName || user.name}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const unfollowMutation = trpc.friends.unfollow.useMutation({
    onSuccess: () => {
      utils.friends.allUsers.invalidate();
      utils.friends.following.invalidate();
      toast.success(`Unfollowed ${user.displayName || user.name}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const displayName = user.displayName || user.name || "Unknown";
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-pink-100">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{displayName}</p>
              {user.bio && (
                <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
              )}
            </div>
            <Button
              size="sm"
              variant={user.isFollowing ? "outline" : "default"}
              className={
                user.isFollowing
                  ? "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"
                  : "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0"
              }
              disabled={isPending}
              onClick={() => {
                if (user.isFollowing) {
                  unfollowMutation.mutate({ userId: user.id });
                } else {
                  followMutation.mutate({ userId: user.id });
                }
              }}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : user.isFollowing ? (
                <>
                  <UserMinus className="w-3 h-3 mr-1" /> Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 mr-1" /> Follow
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FriendTrackRow({ track, queue }: { track: Track; queue: Track[] }) {
  const { currentTrack, isPlaying, play, pause } = useAudioPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            <div
              className={`w-16 flex-shrink-0 bg-gradient-to-b ${track.gradient || "from-pink-400 to-purple-500"} flex items-center justify-center cursor-pointer relative overflow-hidden`}
              onClick={() => {
                if (isCurrentTrack && isPlaying) {
                  pause();
                } else {
                  play(
                    {
                      id: track.id,
                      title: track.title,
                      artist: track.artist,
                      audioUrl: track.audioUrl,
                      gradient: track.gradient,
                      moodTags: track.moodTags,
                      coverArtUrl: track.coverArtUrl,
                    },
                    queue.map((t) => ({
                      id: t.id,
                      title: t.title,
                      artist: t.artist,
                      audioUrl: t.audioUrl,
                      gradient: t.gradient,
                      moodTags: t.moodTags,
                      coverArtUrl: t.coverArtUrl,
                    }))
                  );
                }
              }}
            >
              {track.coverArtUrl && (
                <img src={track.coverArtUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
              )}
              {isCurrentTrack && isPlaying && (
                <div className="absolute inset-0 ring-2 ring-white/60 pointer-events-none animate-pulse" />
              )}
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full bg-white/30 backdrop-blur flex items-center justify-center"
              >
                {isCurrentTrack && isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </motion.div>
            </div>
            <div className="flex-1 p-3 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate text-sm">{track.title}</p>
                  {track.artist && (
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs flex-shrink-0 ${
                    track.visibility === "public"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {track.visibility === "public" ? (
                    <Globe className="w-3 h-3 mr-1" />
                  ) : (
                    <Users className="w-3 h-3 mr-1" />
                  )}
                  {track.visibility === "public" ? "Public" : "Inner Circle"}
                </Badge>
              </div>
              {track.moodTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {track.moodTags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-purple-50 text-purple-600 border-0 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Friends() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");

  const allUsersQuery = trpc.friends.allUsers.useQuery(undefined, { enabled: isAuthenticated });
  const followingQuery = trpc.friends.following.useQuery(undefined, { enabled: isAuthenticated });
  const friendTracksQuery = trpc.friends.friendTracks.useQuery(undefined, { enabled: isAuthenticated });

  const allUsers = (allUsersQuery.data ?? []) as UserCard[];
  const following = (followingQuery.data ?? []) as any[];
  const friendTracks = (friendTracksQuery.data ?? []) as Track[];

  const filteredUsers = allUsers.filter((u) => {
    const name = (u.displayName || u.name || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Sign in to connect</h2>
          <p className="text-muted-foreground mb-6">Follow friends and hear their inner circle tracks.</p>
          <Button
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Friends
        </h1>
        <p className="text-muted-foreground mt-1">
          Follow creators to access their inner circle tracks
        </p>
      </div>

      <Tabs defaultValue="discover">
        <TabsList className="mb-6">
          <TabsTrigger value="discover" className="gap-2">
            <Search className="w-4 h-4" /> Find People
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2">
            <UserPlus className="w-4 h-4" /> Following ({following.length})
          </TabsTrigger>
          <TabsTrigger value="tracks" className="gap-2">
            <Music className="w-4 h-4" /> Their Tracks ({friendTracks.length})
          </TabsTrigger>
        </TabsList>

        {/* Discover */}
        <TabsContent value="discover">
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {allUsersQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-purple-200 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "No users found matching your search" : "No other users yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Following */}
        <TabsContent value="following">
          {followingQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-16">
              <UserPlus className="w-12 h-12 text-purple-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Not following anyone yet</h3>
              <p className="text-muted-foreground">Find people to follow in the Discover tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {following.map((user: any) => (
                <UserRow key={user.id} user={{ ...user, isFollowing: true }} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Friend Tracks */}
        <TabsContent value="tracks">
          {friendTracksQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : friendTracks.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-12 h-12 text-purple-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No tracks from friends yet</h3>
              <p className="text-muted-foreground">
                Follow creators and their public and inner circle tracks will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {friendTracks.map((track) => (
                  <FriendTrackRow key={track.id} track={track} queue={friendTracks} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

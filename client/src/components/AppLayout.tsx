import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Upload,
  Users,
  ListMusic,
  User,
  LogOut,
  LogIn,
  Home,
  Info,
  DollarSign,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  X,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Slider } from "./ui/slider";
import { toast } from "sonner";

const navItems = [
  { href: "/", label: "Discover", icon: Home },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/my-riffs", label: "My Riffs", icon: Music, authRequired: true },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/about", label: "About", icon: Info },
];

function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileQuery = trpc.profiles.get.useQuery(
    { userId: user?.id },
    { enabled: !!user }
  );
  const profile = profileQuery.data;

  const displayName = profile?.displayName || user?.name || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatarUrl;

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
  };

  const visibleItems = navItems.filter((item) => !item.authRequired || isAuthenticated);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center shadow-md">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent hidden sm:block"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Strawberry Riff
              </span>
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "text-purple-600 bg-purple-50"
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Auth + Mobile Menu */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-pink-200">
                      <AvatarImage src={avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-riffs" className="cursor-pointer">
                      <Music className="w-4 h-4 mr-2" /> My Riffs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile-setup" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" /> Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Sign In
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-pink-100 pb-3"
            >
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg mx-1 mt-1 text-sm font-medium cursor-pointer ${
                        isActive ? "text-purple-600 bg-purple-50" : "text-gray-600 hover:bg-purple-50"
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function PersistentPlayer() {
  const { currentTrack, isPlaying, progress, currentTime, duration, volume, play, pause, resume, seek, setVolume } =
    useAudioPlayer();

  if (!currentTrack) return null;

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-pink-100 shadow-lg"
    >
      <div className="container py-2">
        <div className="flex items-center gap-4">
          {/* Track info */}
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentTrack.gradient || "from-pink-400 to-purple-500"} flex-shrink-0 flex items-center justify-center`}
          >
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist || "Unknown Artist"}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400" disabled>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="h-9 w-9 p-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
              onClick={() => (isPlaying ? pause() : resume())}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400" disabled>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 flex-1 max-w-xs hidden md:flex">
            <span className="text-xs text-muted-foreground w-8 text-right">{formatTime(currentTime)}</span>
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              className="flex-1"
              onValueChange={([v]) => seek(v)}
            />
            <span className="text-xs text-muted-foreground w-8">{formatTime(duration)}</span>
          </div>

          {/* Volume */}
          <div className="items-center gap-2 hidden lg:flex">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              className="w-20"
              onValueChange={([v]) => setVolume(v / 100)}
            />
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="mt-1 sm:hidden">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={([v]) => seek(v)}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentTrack } = useAudioPlayer();
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <AppHeader />
      <main className={`pt-16 ${currentTrack ? "pb-20" : ""}`}>{children}</main>
      <PersistentPlayer />
    </div>
  );
}

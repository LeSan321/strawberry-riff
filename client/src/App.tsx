import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import { GeneratePage } from "./pages/Generate";
import MyRiffs from "./pages/MyRiffs";
import Friends from "./pages/Friends";
import Playlists from "./pages/Playlists";
import Pricing from "./pages/Pricing";
import ProfileSetup from "./pages/ProfileSetup";
import About from "./pages/About";
import Discover from "./pages/Discover";
import CreatorProfile from "./pages/CreatorProfile";
import PremiumSuccess from "./pages/PremiumSuccess";
import TrackPage from "./pages/TrackPage";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { LyricsGeneratorPage } from "./pages/LyricsGenerator";
import Studio from "./pages/Studio";
import { StyleLibrary } from "./pages/StyleLibrary";
import PreviewPage from "./pages/PreviewPage";
import SharedPlaylistPage from "./pages/SharedPlaylistPage";
import { StemsStudio } from "./pages/StemsStudio";
import TrackDetail from "./pages/TrackDetail";
import MyStemsBrowser from "./pages/MyStemsBrowser";
import { RiffAssistant } from "./components/RiffAssistant";
import AdminMigrateSamples from "./pages/AdminMigrateSamples";
import { useLocation } from "wouter";

// Map URL path to page context key for the Riff Assistant
function getPageContext(path: string): string {
  if (path === "/" || path === "") return "home";
  if (path.startsWith("/discover")) return "discover";
  if (path.startsWith("/generate")) return "generate";
  if (path.startsWith("/upload")) return "upload";
  if (path.startsWith("/my-riffs")) return "myriffs";
  if (path.startsWith("/friends")) return "friends";
  if (path.startsWith("/playlists")) return "playlists";
  if (path.startsWith("/pricing")) return "pricing";
  if (path.startsWith("/profile")) return "profile";
  if (path.startsWith("/about")) return "about";
  if (path.startsWith("/creator")) return "friends";
  if (path.startsWith("/track")) return "track";
  if (path.startsWith("/lyrics")) return "lyrics";
  if (path.startsWith("/studio")) return "studio";
  if (path.startsWith("/style-library")) return "studio";
  if (path.startsWith("/stems") || path.startsWith("/my-stems") || path.startsWith("/track-detail")) return "myriffs";
  return "general";
}

// Assistant wrapper that reads current route
function AssistantPortal() {
  const [location] = useLocation();
  // Don't show on preview/shared pages (public-facing, no auth context)
  if (location.startsWith("/preview/") || location.startsWith("/shared/")) return null;
  return <RiffAssistant pageContext={getPageContext(location)} />;
}

function Router() {
  return (
    <Switch>
      {/* Studio, Style Library, Preview, Shared Playlist, Stems Studio, and Track Detail are full-screen — outside AppLayout */}
      <Route path="/studio" component={Studio} />
      <Route path="/stems/:generationId" component={StemsStudio} />
      <Route path="/track-detail/:generationId" component={TrackDetail} />
      <Route path="/my-stems" component={MyStemsBrowser} />
      <Route path="/style-library" component={StyleLibrary} />
      <Route path="/preview/:token" component={PreviewPage} />
      <Route path="/shared/playlists/:token" component={SharedPlaylistPage} />
      <Route path="/admin/migrate-instruments" component={AdminMigrateSamples} />
      <Route>
        <AppLayout>
          <Switch>
        <Route path="/" component={Home} />
        <Route path="/discover" component={Discover} />
        <Route path="/generate">{() => <GeneratePage />}</Route>
        <Route path="/upload" component={Upload} />
        <Route path="/my-riffs" component={MyRiffs} />
        <Route path="/friends" component={Friends} />
        <Route path="/playlists" component={Playlists} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/profile-setup" component={ProfileSetup} />
        <Route path="/about" component={About} />
        <Route path="/creator/:userId" component={CreatorProfile} />
        <Route path="/premium/success" component={PremiumSuccess} />
        <Route path="/track/:id" component={TrackPage} />
        <Route path="/lyrics" component={LyricsGeneratorPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AudioPlayerProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <AssistantPortal />
          </TooltipProvider>
        </AudioPlayerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

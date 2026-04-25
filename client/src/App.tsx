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

function Router() {
  return (
    <Switch>
      {/* Studio, Style Library, and Preview are full-screen — outside AppLayout */}
      <Route path="/studio" component={Studio} />
      <Route path="/style-library" component={StyleLibrary} />
      <Route path="/preview/:token" component={PreviewPage} />
      <Route>
        <AppLayout>
          <Switch>
        <Route path="/" component={Home} />
        <Route path="/discover" component={Discover} />
        <Route path="/generate" component={GeneratePage} />
        <Route path="/upload" component={Upload} />
        <Route path="/my-riffs" component={MyRiffs} />
        <Route path="/friends" component={Friends} />
        <Route path="/playlists" component={Playlists} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/profile-setup" component={ProfileSetup} />
        <Route path="/about" component={About} />
        <Route path="/creator/:username" component={CreatorProfile} />
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
      <ThemeProvider defaultTheme="light">
        <AudioPlayerProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AudioPlayerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

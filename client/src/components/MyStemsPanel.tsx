/**
 * MyStemsPanel — embedded panel for the Studio "My Stems" tool.
 * Shows all past completed stem splits with expiration badges,
 * stem count, and an "Open Studio" button that navigates to /stems/:generationId.
 * Includes title search and sort controls.
 * Inherits the Studio dark theme via CSS variables.
 */

import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Clock,
  ArrowRight,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
  ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MyStemsPanelProps {
  /** Tailwind text-color class for the theme accent, e.g. "text-emerald-400" */
  textAccent?: string;
  /** Tailwind bg class for accent buttons, e.g. "bg-emerald-700 hover:bg-emerald-600" */
  buttonAccent?: string;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getExpiration(createdAt: Date | string) {
  const now = Date.now();
  const expiry = new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return { daysLeft, isExpired: daysLeft <= 0 };
}

type SortOrder = "newest" | "oldest" | "az" | "za";

export function MyStemsPanel({ textAccent = "text-violet-400", buttonAccent = "bg-violet-700 hover:bg-violet-600" }: MyStemsPanelProps) {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // Debounce search input — fire server query 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: pastSplits, isLoading, isFetching, error } = trpc.musicGeneration.getPastSplits.useQuery(
    { search: debouncedSearch || undefined }
  );

  // Client-side sort only (search is server-side)
  const filteredAndSorted = useMemo(() => {
    if (!pastSplits) return [];
    return [...pastSplits].sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "az":
          return (a.title || "").localeCompare(b.title || "");
        case "za":
          return (b.title || "").localeCompare(a.title || "");
      }
    });
  }, [pastSplits, sortOrder]);

  const sortLabels: Record<SortOrder, string> = {
    newest: "Newest",
    oldest: "Oldest",
    az: "A → Z",
    za: "Z → A",
  };

  const sortCycle: SortOrder[] = ["newest", "oldest", "az", "za"];

  function cycleSortOrder() {
    const idx = sortCycle.indexOf(sortOrder);
    setSortOrder(sortCycle[(idx + 1) % sortCycle.length]);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "currentColor" }} />
        <p className="text-sm text-muted-foreground">Loading your stems…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
        <AlertTriangle className="w-10 h-10 text-yellow-500/60" />
        <p className="text-sm text-muted-foreground">Could not load stems. Please try again.</p>
      </div>
    );
  }

  if (!pastSplits || pastSplits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
          <Layers className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground mb-1">No stems yet</h3>
          <p className="text-sm text-muted-foreground">
            Generate a track and click the <strong>Stems</strong> button to split it.
          </p>
        </div>
        <Button
          size="sm"
          className={`${buttonAccent} text-white mt-1`}
          onClick={() => navigate("/studio")}
        >
          Go to Generate
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Layers className={`w-4 h-4 ${textAccent}`} />
          <span className="text-sm font-semibold text-foreground">
            {filteredAndSorted.length} split{filteredAndSorted.length !== 1 ? "s" : ""}
          </span>
          {isFetching && (
            <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin opacity-50" style={{ borderColor: "currentColor" }} />
          )}
        </div>
        <span className="text-xs text-muted-foreground">Stems expire after 30 days</span>
      </div>

      {/* Search + Sort controls */}
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks…"
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md bg-muted/30 border border-border/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sort cycle button */}
        <button
          onClick={cycleSortOrder}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-muted/30 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all whitespace-nowrap"
          title="Cycle sort order"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortLabels[sortOrder]}
        </button>
      </div>

      {/* Results count when filtering */}
      {searchQuery && (
        <p className="text-xs text-muted-foreground">
          {filteredAndSorted.length} result{filteredAndSorted.length !== 1 ? "s" : ""} for "{searchQuery}"
        </p>
      )}

      {/* Empty search state */}
      {searchQuery && filteredAndSorted.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
          <Search className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No tracks match "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery("")}
            className={`text-xs ${textAccent} hover:underline`}
          >
            Clear search
          </button>
        </div>
      )}

      {/* Split cards */}
      <AnimatePresence mode="popLayout">
        {filteredAndSorted.map((split, i) => {
          const { daysLeft, isExpired } = getExpiration(split.createdAt);

          return (
            <motion.div
              key={split.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-xl border p-4 transition-all cursor-pointer group ${
                isExpired
                  ? "border-red-500/20 bg-red-500/5 opacity-60"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border"
              }`}
              onClick={() => !isExpired && navigate(`/stems/${split.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-foreground/90 transition-colors">
                      {split.title || "Untitled Track"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Split {formatDate(split.createdAt)}</span>
                    {split.duration && (
                      <>
                        <span>•</span>
                        <span>{Math.round(split.duration / 1000)}s</span>
                      </>
                    )}
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Stems ready
                      </span>
                    </>
                  </div>
                </div>

                {/* Right: expiry badge + open button */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {isExpired ? (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <Clock className="w-3 h-3" />
                      Expired
                    </Badge>
                  ) : daysLeft <= 7 ? (
                    <Badge className="text-xs gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Clock className="w-3 h-3" />
                      {daysLeft}d left
                    </Badge>
                  ) : (
                    <Badge className="text-xs gap-1 bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {daysLeft}d left
                    </Badge>
                  )}

                  {!isExpired && (
                    <button
                      className={`flex items-center gap-1 text-xs font-medium ${textAccent} opacity-0 group-hover:opacity-100 transition-opacity`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/stems/${split.id}`);
                      }}
                    >
                      Open Studio
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

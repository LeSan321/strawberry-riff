import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Music, Clock } from "lucide-react";

export default function MyStemsBrowser() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: pastSplits, isLoading } = trpc.musicGeneration.getPastSplits.useQuery();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/60">Please log in to view your stems.</p>
        </div>
      </div>
    );
  }

  // Calculate expiration info
  const calculateExpiration = (createdAt: Date) => {
    const now = new Date();
    const expirationDate = new Date(createdAt);
    expirationDate.setDate(expirationDate.getDate() + 30);
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;
    return { expirationDate, daysRemaining, isExpired };
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/studio")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Music className="w-6 h-6" />
                My Stems
              </h1>
              <p className="text-sm text-foreground/60">Browse all your past stem splits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-foreground/60">Loading your stems...</p>
            </div>
          </div>
        ) : !pastSplits || pastSplits.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No stems yet</h2>
            <p className="text-foreground/60 mb-6">Generate a track and split it into stems to get started.</p>
            <Button
              onClick={() => navigate("/studio")}
              className="bg-accent hover:bg-accent/90"
            >
              Go to Generate
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {pastSplits && pastSplits.map((split) => {
              const { daysRemaining, isExpired } = calculateExpiration(split.createdAt);
              const expirationDate = new Date(split.createdAt);
              expirationDate.setDate(expirationDate.getDate() + 30);

              return (
                <Card
                  key={split.id}
                  className="p-4 hover:bg-accent/5 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/stems/${split.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                        {split.title || "Untitled Track"}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-foreground/60">
                        <span>Split on {formatDate(split.createdAt)}</span>
                        <span>•</span>
                        <span>{split.duration ? `${Math.round(split.duration / 1000)}s` : "Unknown duration"}</span>
                      </div>
                    </div>

                    {/* Expiration Badge */}
                    <div className="flex-shrink-0">
                      {isExpired ? (
                        <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Expired
                        </div>
                      ) : daysRemaining <= 7 ? (
                        <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expiration Info */}
                  <p className="text-xs text-foreground/50 mt-3">
                    Expires {formatDate(expirationDate)} • Download to keep forever
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

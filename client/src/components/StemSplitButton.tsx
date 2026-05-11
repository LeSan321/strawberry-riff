/**
 * StemSplit Button Component
 * Initiates stem splitting for a track with loading state and progress animation
 * Shows "View Stems" button when split is complete
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Music, Loader2, Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { StemSplitUpgradePrompt } from "./StemSplitUpgradePrompt";

interface StemSplitButtonProps {
  generationId: number;
  isSplit?: boolean;
  onSplitStart?: () => void;
  onSplitComplete?: (stems: any) => void;
  disabled?: boolean;
  className?: string;
}

export function StemSplitButton({
  generationId,
  isSplit = false,
  onSplitStart,
  onSplitComplete,
  disabled = false,
  className = "",
}: StemSplitButtonProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [splitJustCompleted, setSplitJustCompleted] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [remainingLimit, setRemainingLimit] = useState(0);

  const utils = trpc.useUtils();
  const startStemSplit = trpc.stemsplit.startStemSplit.useMutation();
  const getStemSplitStatus = trpc.stemsplit.getStemSplitStatus.useQuery(
    { jobId: jobId || "" },
    {
      enabled: !!jobId && isPolling,
      refetchInterval: 3000, // Poll every 3 seconds
    }
  );

  // Handle split completion
  useEffect(() => {
    if (!getStemSplitStatus.data) return;

    const status = getStemSplitStatus.data;

    if (status.status === "completed" && status.stems) {
      setIsPolling(false);
      setIsLoading(false);
      setJobId(null);
      setSplitJustCompleted(true);
      // Invalidate the generation query to force re-fetch of isSplit flag
      utils.musicGeneration.getById.invalidate({ id: generationId });
      toast.success("Stem split complete! Your stems are ready.");
      onSplitComplete?.(status.stems);
    } else if (status.status === "failed") {
      setIsPolling(false);
      setIsLoading(false);
      setJobId(null);
      toast.error(`Stem split failed: ${status.error || "Unknown error"}`);
    }
  }, [getStemSplitStatus.data, onSplitComplete, generationId, utils]);

  const handleStartSplit = async () => {
    try {
      setIsLoading(true);
      const result = await startStemSplit.mutateAsync({ generationId });

      if (result.success) {
        setJobId(result.jobId);
        setIsPolling(true);
        setShowUpgradePrompt(false);
        toast.info("Splitting stems... This may take a few minutes.");
        onSplitStart?.();
      } else if (result.error === "LIMIT_EXCEEDED") {
        setIsLoading(false);
        setUpgradeMessage(result.message || "You've reached your monthly stem split limit.");
        setRemainingLimit(result.remainingThisMonth || 0);
        setShowUpgradePrompt(true);
        toast.error("Free tier limit reached");
      }
    } catch (error) {
      setIsLoading(false);
      const message = error instanceof Error ? error.message : "Failed to start stem split";
      toast.error(message);
    }
  };

  const handleUpgradeClick = () => {
    // Navigate to pricing page or open upgrade modal
    window.location.href = "/pricing";
  };

  const isProcessing = isLoading || isPolling;

  const handleViewStems = () => {
    navigate(`/stems/${generationId}`);
  };

  // If split just completed or already split, show View Stems button
  if ((isSplit || splitJustCompleted) && !isProcessing) {
    return (
      <Button
        onClick={handleViewStems}
        variant="outline"
        size="sm"
        className={`gap-2 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 whitespace-nowrap ${className}`}
      >
        <Check className="w-4 h-4 text-emerald-600" />
        <span className="hidden md:inline">View Stems</span>
        <span className="md:hidden">Stems</span>
        <ArrowRight className="w-3 h-3 hidden md:inline" />
      </Button>
    );
  }

  return (
    <div className="relative">
      {showUpgradePrompt && (
        <div className="mb-3">
          <StemSplitUpgradePrompt
            message={upgradeMessage}
            remainingThisMonth={remainingLimit}
            onUpgradeClick={handleUpgradeClick}
            onDismiss={() => setShowUpgradePrompt(false)}
          />
        </div>
      )}

      <Button
        onClick={handleStartSplit}
        disabled={disabled || isProcessing}
        variant="outline"
        size="sm"
        className={`gap-2 ${isProcessing ? "bg-purple-500/10 border-purple-500/30" : ""} ${className}`}
      >
        {isProcessing ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-4 h-4" />
            </motion.div>
            <span className="hidden sm:inline">Splitting...</span>
            <span className="sm:hidden text-xs">...</span>
          </>
        ) : (
          <>
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">Split Stems</span>
            <span className="sm:hidden">Split</span>
          </>
        )}
      </Button>

      {/* Progress indicator */}
      {isProcessing && (
        <motion.div
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </div>
  );
}

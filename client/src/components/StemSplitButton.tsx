/**
 * StemSplit Button Component
 * Initiates stem splitting for a track with loading state and progress animation
 * Shows mini-mixer when stems are ready
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Music, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StemMixer } from "./StemMixer";

interface StemSplitButtonProps {
  trackId: number;
  onSplitStart?: () => void;
  onSplitComplete?: (stems: any) => void;
  disabled?: boolean;
  className?: string;
}

export function StemSplitButton({
  trackId,
  onSplitStart,
  onSplitComplete,
  disabled = false,
  className = "",
}: StemSplitButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [completedStems, setCompletedStems] = useState<any>(null);

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
      setCompletedStems(status.stems);
      setShowMixer(true);
      toast.success("Stem split complete! Your stems are ready.");
      onSplitComplete?.(status.stems);
    } else if (status.status === "failed") {
      setIsPolling(false);
      setIsLoading(false);
      setJobId(null);
      toast.error(`Stem split failed: ${status.error || "Unknown error"}`);
    }
  }, [getStemSplitStatus.data, onSplitComplete]);

  const handleStartSplit = async () => {
    try {
      setIsLoading(true);
      const result = await startStemSplit.mutateAsync({ trackId });

      if (result.success) {
        setJobId(result.jobId);
        setIsPolling(true);
        toast.loading("Splitting stems... This may take a few minutes.");
        onSplitStart?.();
      }
    } catch (error) {
      setIsLoading(false);
      const message = error instanceof Error ? error.message : "Failed to start stem split";
      toast.error(message);
    }
  };

  const isProcessing = isLoading || isPolling;

  return (
    <div className="relative">
      <Button
        onClick={completedStems && !isProcessing ? () => setShowMixer(!showMixer) : handleStartSplit}
        disabled={disabled || (isProcessing && !completedStems)}
        variant="outline"
        size="sm"
        className={`gap-2 ${isProcessing ? "bg-purple-500/10 border-purple-500/30" : completedStems ? "bg-green-500/10 border-green-500/30" : ""} ${className}`}
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
          </>
        ) : completedStems ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="hidden sm:inline">Mixer</span>
            {showMixer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </>
        ) : (
          <>
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">Split Stems</span>
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

      {/* Stem Mixer */}
      <AnimatePresence>
        {showMixer && completedStems && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 w-96 max-w-[calc(100vw-1rem)]"
          >
            <StemMixer stems={completedStems} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

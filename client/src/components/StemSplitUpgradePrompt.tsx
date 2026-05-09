import React from "react";
import { AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface StemSplitUpgradePromptProps {
  message: string;
  remainingThisMonth: number;
  onUpgradeClick?: () => void;
  onDismiss?: () => void;
}

export function StemSplitUpgradePrompt({
  message,
  remainingThisMonth,
  onUpgradeClick,
  onDismiss,
}: StemSplitUpgradePromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">Free Tier Limit Reached</h3>
          <p className="mt-1 text-sm text-amber-800">{message}</p>
          <p className="mt-2 text-xs text-amber-700">
            You've used all 5 free stem splits this month. Your usage resets on the 1st of next month.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={onUpgradeClick}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="sm"
            >
              <Zap className="h-4 w-4" />
              Upgrade to Premium
            </Button>
            <Button
              onClick={onDismiss}
              variant="outline"
              size="sm"
              className="border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

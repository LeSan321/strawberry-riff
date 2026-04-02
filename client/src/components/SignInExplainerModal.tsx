/**
 * SignInExplainerModal
 *
 * Shown before the OAuth redirect so users understand why they're
 * leaving strawberryriff.com momentarily. Reduces friction caused by
 * the unfamiliar manus.im domain appearing mid-signup.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";

interface SignInExplainerModalProps {
  open: boolean;
  onClose: () => void;
  loginUrl: string;
  /** Optional context — e.g. "to upload your riff" */
  reason?: string;
}

export function SignInExplainerModal({
  open,
  onClose,
  loginUrl,
  reason,
}: SignInExplainerModalProps) {
  const handleContinue = () => {
    window.location.href = loginUrl;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-6">
        <DialogHeader className="items-center text-center gap-2">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>

          <DialogTitle className="text-xl font-bold">
            Secure Sign-In
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground leading-relaxed text-center">
            {reason
              ? <>You'll need an account {reason}.<br /><br /></>
              : null}
            Strawberry Riff uses a trusted third-party service for secure
            sign-in — the same way apps use "Sign in with Google." You'll
            be briefly redirected to verify your identity, then brought
            straight back here.
          </DialogDescription>
        </DialogHeader>

        {/* Trust indicators */}
        <div className="flex flex-col gap-2 my-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <span>Your data stays on Strawberry Riff</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <span>No password stored on our servers</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <span>You'll be back in seconds</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleContinue}
            className="w-full rounded-full font-semibold"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
          >
            Continue to Sign In
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-full text-muted-foreground"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

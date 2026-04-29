import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
import { EQPanel, type EQSettings } from "./EQPanel";
import { useAudioEQ } from "@/hooks/useAudioEQ";
import { trpc } from "@/lib/trpc";


interface TrackEditorProps {
  trackId: number;
  audioUrl: string;
  title: string;
  onClose?: () => void;
}

/**
 * TrackEditor Component
 * Provides audio editing tools: EQ, trimming, and export
 */
export function TrackEditor({
  trackId,
  audioUrl,
  title,
  onClose,
}: TrackEditorProps) {
  const [eqSettings, setEQSettings] = useState<EQSettings>({
    bass: 0,
    mid: 0,
    treble: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("eq");

  const { playWithEQ, stop, isPlaying } = useAudioEQ();
  const applyEQMutation = trpc.tracks.applyEQ.useMutation();

  // Handle EQ preview
  const handlePlayPreview = async () => {
    try {
      if (isPlaying) {
        stop();
      } else {
        await playWithEQ(audioUrl, eqSettings);
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  // Handle EQ export
  const handleExportEQ = async () => {
    setIsProcessing(true);
    try {
      await applyEQMutation.mutateAsync({
        trackId,
        bass: eqSettings.bass,
        mid: eqSettings.mid,
        treble: eqSettings.treble,
      });

      console.log("EQ settings saved");
    } catch (error) {
      console.error("Failed to apply EQ:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-card border-border">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground">Edit and polish your track</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger
              value="eq"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent"
            >
              3-Band EQ
            </TabsTrigger>
            <TabsTrigger
              value="trim"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent"
            >
              Trimming
            </TabsTrigger>
          </TabsList>

          {/* EQ Tab */}
          <TabsContent value="eq" className="p-6 space-y-4">
            <EQPanel
              settings={eqSettings}
              onSettingsChange={setEQSettings}
              onApply={handleExportEQ}
              isProcessing={isProcessing}
            />

            {/* Preview Controls */}
            <div className="flex gap-2">
              <Button
                onClick={handlePlayPreview}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                {isPlaying ? "Stop Preview" : "Play Preview"}
              </Button>
              <Button
                onClick={handleExportEQ}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {isProcessing ? "Applying..." : "Apply & Export"}
              </Button>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">Real-time Preview</p>
                <p>Click "Play Preview" to hear your EQ changes before exporting.</p>
              </div>
            </div>
          </TabsContent>

          {/* Trim Tab */}
          <TabsContent value="trim" className="p-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Trimming tool coming soon</p>
              <p className="text-sm text-muted-foreground">
                You'll be able to trim silence, set fade in/out, and more.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3 justify-end">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
          <Button
            className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            disabled={isProcessing}
          >
            <Download className="w-4 h-4" />
            Export Track
          </Button>
        </div>
      </Card>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

export interface EQSettings {
  bass: number;
  mid: number;
  treble: number;
}

interface EQPanelProps {
  settings: EQSettings;
  onSettingsChange: (settings: EQSettings) => void;
  onApply: () => void;
  isProcessing?: boolean;
}

/**
 * 3-Band EQ Panel Component
 * Provides bass, mid, and treble sliders for audio equalization
 * Real-time preview via Web Audio API
 */
export function EQPanel({
  settings,
  onSettingsChange,
  onApply,
  isProcessing = false,
}: EQPanelProps) {
  const [localSettings, setLocalSettings] = useState<EQSettings>(settings);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize Web Audio API context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }, []);

  const handleBassChange = (value: number[]) => {
    const newSettings = { ...localSettings, bass: value[0] };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleMidChange = (value: number[]) => {
    const newSettings = { ...localSettings, mid: value[0] };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleTrebleChange = (value: number[]) => {
    const newSettings = { ...localSettings, treble: value[0] };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleReset = () => {
    const defaultSettings: EQSettings = { bass: 0, mid: 0, treble: 0 };
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  const getFrequencyLabel = (value: number) => {
    if (value > 0) return `+${value} dB`;
    if (value < 0) return `${value} dB`;
    return "0 dB";
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">3-Band EQ</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
            disabled={isProcessing}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Bass Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Bass</label>
            <span className="text-xs text-muted-foreground font-mono">
              {getFrequencyLabel(localSettings.bass)}
            </span>
          </div>
          <Slider
            value={[localSettings.bass]}
            onValueChange={handleBassChange}
            min={-12}
            max={12}
            step={0.5}
            disabled={isProcessing}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Low frequencies (100 Hz)</p>
        </div>

        {/* Mid Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Mids</label>
            <span className="text-xs text-muted-foreground font-mono">
              {getFrequencyLabel(localSettings.mid)}
            </span>
          </div>
          <Slider
            value={[localSettings.mid]}
            onValueChange={handleMidChange}
            min={-12}
            max={12}
            step={0.5}
            disabled={isProcessing}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Mid frequencies (1 kHz)</p>
        </div>

        {/* Treble Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Treble</label>
            <span className="text-xs text-muted-foreground font-mono">
              {getFrequencyLabel(localSettings.treble)}
            </span>
          </div>
          <Slider
            value={[localSettings.treble]}
            onValueChange={handleTrebleChange}
            min={-12}
            max={12}
            step={0.5}
            disabled={isProcessing}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">High frequencies (10 kHz)</p>
        </div>

        {/* Apply Button */}
        <Button
          onClick={onApply}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          {isProcessing ? "Processing..." : "Apply EQ"}
        </Button>

        {/* Info */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Boost bass for warmth, mids for presence, treble for brightness.
          </p>
        </div>
      </div>
    </Card>
  );
}

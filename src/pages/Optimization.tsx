/**
 * Optimization Page - Week 1 MVP
 * 
 * Main page for OPTIMIZER system
 * Combines recorder and list components
 */

import { OptimizationRecorder } from "@/components/OptimizationRecorder";
import { OptimizationList } from "@/components/OptimizationList";
import { JumperBackground } from "@/components/ui/jumper-background";
import { JumperLogo } from "@/components/ui/jumper-logo";

export default function Optimization() {
  return (
    <JumperBackground overlay={false}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <JumperLogo size="sm" />
          <h1 className="text-2xl font-bold">Optimizer</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Sistema de Otimização</h2>
            <p className="text-muted-foreground">
              Documente suas otimizações de tráfego com gravações de áudio
            </p>
          </div>

          {/* Recorder */}
          <OptimizationRecorder />

          {/* List */}
          <OptimizationList />
        </div>
      </div>
    </JumperBackground>
  );
}

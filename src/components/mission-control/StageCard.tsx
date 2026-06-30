"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export interface StageData {
  title: string;
  subtitle: string;
  reasoning: string;
  evidence: string;
  confidence: number;
  alternative?: string;
  outputs: { label: string; value: string }[];
}

interface StageCardProps {
  stage: number;
  data: StageData;
  status: "pending" | "loading" | "complete";
}

export function StageCard({ stage, data, status }: StageCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: status === "pending" ? 0.4 : 1, y: 0 }}
      className={`relative pl-8 pb-12 border-l-2 ${status === "complete" ? "border-emerald-500/50" : "border-white/10"} last:border-transparent`}
    >
      {/* Node Indicator */}
      <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center
        ${status === "complete" ? "border-emerald-500 text-emerald-500" : status === "loading" ? "border-blue-500 text-blue-500" : "border-white/20"}`}>
        {status === "complete" && <CheckCircle2 className="w-3 h-3" />}
        {status === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
      </div>

      <div className={`p-5 rounded-2xl glass border ${status === "loading" ? "border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-white/5"} transition-all duration-500`}>
        {/* Header */}
        <div className="flex items-center justify-between cursor-pointer" onClick={() => status === "complete" && setExpanded(!expanded)}>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Stage {stage}</span>
              {status === "loading" && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold mt-1 text-foreground">{data.title}</h3>
            <p className="text-sm text-muted-foreground">{data.subtitle}</p>
          </div>
          
          {status === "complete" && (
            <motion.button 
              animate={{ rotate: expanded ? 180 : 0 }} 
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          )}
        </div>

        {/* Loading State Content */}
        {status === "loading" && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 flex flex-col gap-3"
          >
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
              />
            </div>
            <p className="text-sm text-blue-400/80 font-mono animate-pulse text-center">Processing geospatial data and querying neural networks...</p>
          </motion.div>
        )}

        {/* Completed State Content */}
        <AnimatePresence>
          {status === "complete" && expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t border-white/10 space-y-6">
                
                {/* Outputs Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {data.outputs.map((output, idx) => (
                    <div key={idx} className="bg-background/40 p-3 rounded-lg border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase">{output.label}</p>
                      <p className="text-sm font-medium mt-1">{output.value}</p>
                    </div>
                  ))}
                </div>

                {/* AI Explainability */}
                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-blue-400">AI Reasoning Trace</span>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Why</p>
                    <p className="text-sm mt-1">{data.reasoning}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Evidence</p>
                    <p className="text-sm mt-1">{data.evidence}</p>
                  </div>

                  {data.alternative && (
                     <div>
                     <p className="text-xs text-muted-foreground uppercase font-semibold">Alternative Scenario</p>
                     <p className="text-sm mt-1 text-orange-400/90">{data.alternative}</p>
                   </div>
                  )}
                  
                  <div className="flex items-center gap-3 pt-2">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Confidence</p>
                    <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-emerald-500" style={{ width: `${data.confidence}%` }} />
                    </div>
                    <span className="text-xs font-mono text-emerald-500">{data.confidence}%</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

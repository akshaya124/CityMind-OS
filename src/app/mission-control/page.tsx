"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Activity, ShieldAlert, ArrowRight, Type } from "lucide-react";
import { StageCard, StageData } from "@/components/mission-control/StageCard";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

const STAGE_NAMES = ["scout", "analyst", "commander", "planner", "guardian"];

function MissionControlContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueId = searchParams.get('issueId');

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [stagesData, setStagesData] = useState<StageData[]>([]);
  const [missionComplete, setMissionComplete] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingText, setBriefingText] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  // Store the raw JSON responses to pass to the next agent
  const [agentContext, setAgentContext] = useState<any>({});

  useEffect(() => {
    if (hasStarted) return;
    setHasStarted(true);
    
    // Start the sequential pipeline
    runPipeline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runPipeline = async () => {
    let currentContext = {
      title: "Reported Infrastructure Issue",
      description: "User submitted photo for review.",
      gps: "28.7041° N, 77.1025° E",
      base64Image: ""
    };

    try {
      const saved = localStorage.getItem("missionContext");
      if (saved) {
        const parsed = JSON.parse(saved);
        currentContext = { ...currentContext, ...parsed };
      }
    } catch (e) {
      console.error("Failed to parse missionContext", e);
    }

    const newStagesData: StageData[] = [];

    for (let i = 0; i < STAGE_NAMES.length; i++) {
      setCurrentStageIndex(i);
      const stageName = STAGE_NAMES[i];
      
      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: stageName, context: currentContext })
        });
        
        const data = await response.json();
        
        // Add to context for next agent
        currentContext = { ...currentContext, [stageName]: data };
        setAgentContext(currentContext);

        // Format data for StageCard based on the stage
        const formattedStage = formatStageData(stageName, data);
        newStagesData.push(formattedStage);
        setStagesData([...newStagesData]);

      } catch (err) {
        console.error(`Failed at stage ${stageName}`, err);
        break; // Stop pipeline on error
      }
    }

    setCurrentStageIndex(STAGE_NAMES.length);
    setTimeout(() => setMissionComplete(true), 1000);

    // Fetch final briefing
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "briefing", context: currentContext })
      });
      const data = await response.json();
      if (data.error) {
        setBriefingText(`API Error: ${data.error}`);
      } else {
        setBriefingText(data.text || "No text generated.");
      }
    } catch (err: any) {
      setBriefingText(`Error: ${err.message}`);
    }

    setTimeout(() => setShowBriefing(true), 3000);
  };

  // Save the AI data to Firebase once the briefing is generated
  useEffect(() => {
    if (missionComplete && briefingText && !briefingText.startsWith("API Error:") && issueId && issueId !== "demo-fallback") {
      const saveAiData = async () => {
        try {
          const score = agentContext?.commander?.priorityScore || 85;
          const budget = agentContext?.planner?.estimatedBudget ? `₹${agentContext.planner.estimatedBudget}` : "Unknown";
          const priority = agentContext?.commander?.riskLevel || "High";
          
          await updateDoc(doc(db, "issues", issueId), {
            aiBriefing: briefingText,
            aiStages: agentContext, // Save raw context for potential future use
            score: score,
            budget: budget,
            priority: priority,
            status: "AI Reviewed"
          });
        } catch (e) {
          console.error("Failed to save AI data to Firestore:", e);
        }
      };
      saveAiData();
    }
  }, [missionComplete, briefingText, issueId, agentContext]);

  const formatStageData = (stageName: string, data: any): StageData => {
    switch (stageName) {
      case "scout":
        return {
          title: "Scout",
          subtitle: "Analyzing visual data and identifying anomalies.",
          reasoning: data.summary || "Object detected in image.",
          evidence: `Detected: ${(data.detectedObjects || []).join(", ")}`,
          confidence: data.confidence || 90,
          outputs: [
            { label: "Issue Type", value: data.issueType || "Unknown" },
            { label: "Severity", value: data.severity || "Medium" }
          ]
        };
      case "analyst":
        return {
          title: "Analyst",
          subtitle: "Querying spatial context and historical records.",
          reasoning: data.affectedArea || "Context analyzed.",
          evidence: data.evidence || "Geospatial cross-reference complete.",
          confidence: 100 - (data.duplicateProbability || 10),
          outputs: [
            { label: "Nearby POIs", value: (data.nearbyInfrastructure || [])[0] || "None" },
            { label: "Causes", value: (data.possibleCause || [])[0] || "Unknown" }
          ]
        };
      case "commander":
        return {
          title: "Commander",
          subtitle: "Calculating priority and risk assessment.",
          reasoning: data.why || "Priority assigned based on risk matrix.",
          evidence: `Damage Estimate: ${data.estimatedDamage || "Unknown"}`,
          alternative: data.alternatives,
          confidence: 95,
          outputs: [
            { label: "Priority Score", value: `${data.priorityScore || 50} / 100` },
            { label: "Risk Level", value: data.riskLevel || "Moderate" }
          ]
        };
      case "planner":
        return {
          title: "Planner",
          subtitle: "Synthesizing actionable repair strategy.",
          reasoning: data.actionPlan || "Repair plan formulated.",
          evidence: `Allocating ${data.workersRequired || 2} personnel for ${data.estimatedRepairTime || "24h"}.`,
          confidence: 92,
          outputs: [
            { label: "Department", value: data.department || "Public Works" },
            { label: "Est. Budget", value: `₹${data.estimatedBudget || 0}` }
          ]
        };
      case "guardian":
        return {
          title: "Guardian",
          subtitle: "Establishing post-repair monitoring protocol.",
          reasoning: data.monitoringPlan || "Monitoring schedule active.",
          evidence: `Future Risk: ${data.futureRisk || "Low"}`,
          confidence: 98,
          outputs: [
            { label: "Follow-up", value: data.followUpSchedule || "72 Hours" },
            { label: "Checklist", value: "Ready" }
          ]
        };
      default:
        return {
          title: stageName, subtitle: "", reasoning: "", evidence: "", confidence: 0, outputs: []
        };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">AI Mission Control</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${missionComplete ? 'bg-emerald-400' : 'bg-blue-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${missionComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                </span>
                {missionComplete ? "Decision Engine Offline • Mission Successful" : "Decision Engine Online • Processing..."}
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Progress</p>
            <p className="font-mono font-bold text-blue-400">{Math.min(100, Math.round((currentStageIndex / STAGE_NAMES.length) * 100))}%</p>
          </div>
        </div>
        
        {/* Global Progress Bar */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500/20 w-full">
          <motion.div 
            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStageIndex / STAGE_NAMES.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          {!showBriefing ? (
            <motion.div 
              key="timeline"
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-0">
                {/* Render completed stages */}
                {stagesData.map((stage, idx) => (
                  <StageCard 
                    key={idx}
                    stage={idx + 1}
                    data={stage}
                    status="complete"
                  />
                ))}
                
                {/* Render the currently loading stage (if any) */}
                {currentStageIndex < STAGE_NAMES.length && (
                  <StageCard 
                    key="loading"
                    stage={currentStageIndex + 1}
                    data={{
                      title: STAGE_NAMES[currentStageIndex].charAt(0).toUpperCase() + STAGE_NAMES[currentStageIndex].slice(1),
                      subtitle: "Awaiting AI generation...",
                      reasoning: "", evidence: "", confidence: 0, outputs: []
                    }}
                    status="loading"
                  />
                )}

                {/* Render pending placeholder stages */}
                {STAGE_NAMES.slice(currentStageIndex + 1).map((name, idx) => (
                  <StageCard 
                    key={`pending-${name}`}
                    stage={currentStageIndex + 2 + idx}
                    data={{
                      title: name.charAt(0).toUpperCase() + name.slice(1),
                      subtitle: "Pending...",
                      reasoning: "", evidence: "", confidence: 0, outputs: []
                    }}
                    status="pending"
                  />
                ))}
              </div>

              <AnimatePresence>
                {missionComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-12 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center"
                  >
                    <ShieldAlert className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-emerald-400">MISSION SUCCESSFUL</h2>
                    <p className="text-muted-foreground mt-2">All reasoning stages complete. Generating Executive Briefing...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="briefing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-8"
            >
              <div className="p-8 rounded-3xl glass border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <BrainCircuit className="w-64 h-64" />
                </div>
                
                <h2 className="text-sm font-mono text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Type className="w-4 h-4" /> AI Executive Briefing
                </h2>
                
                <div className="space-y-6 text-lg text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">
                  {briefingText ? (
                    <TypewriterText text={briefingText} delay={0} />
                  ) : (
                    <p className="text-red-400">Briefing failed to generate.</p>
                  )}
                </div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3 }}
                  className="mt-10 flex gap-4"
                >
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    Dispatch Action Plan <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => router.push("/authority")}
                    className="flex-1 bg-white/5 border border-white/10 text-foreground py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
                  >
                    Analyze Impact Simulation
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function MissionControl() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center text-blue-400 font-mono animate-pulse">Initializing Mission Control...</div>}>
      <MissionControlContent />
    </Suspense>
  );
}

function TypewriterText({ text, delay, className = "" }: { text: string, delay: number, className?: string }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const startTyping = () => {
      let i = 0;
      const interval = setInterval(() => {
        setContent(text.substring(0, i + 1));
        i++;
        if (i === text.length) clearInterval(interval);
      }, 10);
      return () => clearInterval(interval);
    };

    timeout = setTimeout(startTyping, delay * 1000);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <div className={`min-h-[1.5em] ${className}`}>
      {content}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-2 h-5 bg-blue-500 ml-1 align-middle"
      />
    </div>
  );
}

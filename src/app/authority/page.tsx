"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle, Clock, MapPin, BrainCircuit, ArrowRight, Activity, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export default function AuthorityPanel() {
  const [selectedIssue, setSelectedIssue] = useState<number | null>(1);
  const [showSimulator, setShowSimulator] = useState(false);
  const [timeframe, setTimeframe] = useState("1 Week");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const [backlog, setBacklog] = useState<any[]>([]);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const q = query(collection(db, "issues"), orderBy("createdAt", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedIssues: any[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.aiBriefing) {
            fetchedIssues.push({
              id: doc.id,
              title: data.title || "Reported Issue",
              priority: data.priority || "High",
              score: data.score || 85,
              location: data.location ? `${data.location.lat.toFixed(4)}° N, ${data.location.lng.toFixed(4)}° E` : "Unknown",
              status: data.status || "AI Reviewed",
              budget: data.budget || "₹18,500",
              aiSummary: data.aiBriefing,
              time: "Recently"
            });
          }
        });
        
        setBacklog(fetchedIssues);
        if (fetchedIssues.length > 0) {
          setSelectedIssue(fetchedIssues[0].id);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      }
    };

    fetchIssues();
  }, []);

  const runSimulation = async (issue: any, selectedTimeframe: string) => {
    setIsSimulating(true);
    setTimeframe(selectedTimeframe);
    
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: issue.title,
          aiSummary: issue.aiSummary,
          timeframe: selectedTimeframe
        })
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper to get raw number from budget string like "₹18,500"
  const getSimulatedBudget = (base: string, multiplier: number) => {
    const raw = parseInt(base.replace(/[^0-9]/g, ""));
    return "₹" + (raw * multiplier).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Authority Command</h1>
              <p className="text-muted-foreground">Secure municipal oversight and dispatch.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-sm font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AI Network Active
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Backlog List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <h3 className="font-bold">Prioritized Backlog</h3>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-muted-foreground">{backlog.length} open</span>
            </div>

            <div className="space-y-3">
              {backlog.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    selectedIssue === issue.id 
                    ? "bg-white/10 border-white/20 shadow-xl" 
                    : "glass border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {issue.priority === "Critical" && <div className="w-2 h-2 rounded-full bg-red-500" />}
                      {issue.priority === "High" && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                      {issue.priority === "Medium" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{issue.priority}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{issue.time}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{issue.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3" /> Score: {issue.score}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {issue.location}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Issue Detail View */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedIssue ? (
                <motion.div
                  key={selectedIssue}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass rounded-3xl border border-white/5 h-full overflow-hidden flex flex-col"
                >
                  {backlog.filter(i => i.id === selectedIssue).map(issue => (
                    <div key={issue.id} className="flex flex-col h-full">
                      {/* Header */}
                      <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {issue.status}
                          </span>
                          <span className="font-mono text-muted-foreground text-sm">ID: #{1000 + issue.id}</span>
                        </div>
                        <h2 className="text-3xl font-black mb-2">{issue.title}</h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> {issue.location}
                        </p>
                      </div>

                      {/* AI Briefing */}
                      <div className="p-8 flex-1">
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden mb-8">
                          <div className="absolute top-0 right-0 p-6 opacity-10">
                            <BrainCircuit className="w-32 h-32 -mt-10 -mr-10 text-blue-500" />
                          </div>
                          <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4" /> AI Executive Briefing
                          </h3>
                          <p className="text-lg leading-relaxed relative z-10 font-medium">
                            {issue.aiSummary}
                          </p>
                          <div className="mt-6 pt-6 border-t border-blue-500/20 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase">Estimated Budget</p>
                              <p className="font-mono font-bold text-xl text-blue-400">{issue.budget}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase">Priority Score</p>
                              <p className="font-mono font-bold text-xl text-emerald-400">{issue.score}/100</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <button 
                            onClick={() => {
                              setShowSimulator(!showSimulator);
                              if (!showSimulator) {
                                runSimulation(issue, "1 Week");
                              }
                            }}
                            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors border ${
                              showSimulator ? "bg-purple-500/20 border-purple-500/50 text-purple-400" : "bg-white/5 hover:bg-white/10 border-white/10"
                            }`}
                          >
                            <Activity className={`w-6 h-6 ${showSimulator ? "text-purple-400" : "text-purple-500"}`} />
                            <span className="font-bold">Impact Simulator</span>
                          </button>
                          <button className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                            <ArrowRight className="w-6 h-6" />
                            <span className="font-bold">Dispatch Crew</span>
                          </button>
                        </div>

                        {/* Impact Simulator UI */}
                        <AnimatePresence>
                          {showSimulator && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-background rounded-2xl border border-white/10 p-6 overflow-hidden"
                            >
                              <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold flex items-center gap-2">
                                  <Activity className="w-5 h-5 text-purple-500" /> Timeframe of Inaction
                                </h3>
                                <div className="flex bg-white/5 p-1 rounded-xl">
                                  {["1 Week", "1 Month", "6 Months"].map(t => (
                                    <button 
                                      key={t}
                                      onClick={() => runSimulation(issue, t)}
                                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeframe === t ? "bg-purple-500 text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {isSimulating ? (
                                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                                  <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
                                  <p className="animate-pulse">Predicting catastrophic cascade...</p>
                                </div>
                              ) : simulationResult ? (
                                <motion.div 
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  className="space-y-6"
                                >
                                  <p className="text-sm border-l-4 border-purple-500 pl-4 py-1 font-medium italic text-muted-foreground">
                                    "{simulationResult.narrativeSummary}"
                                  </p>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Cost Escalation</p>
                                      <p className="font-mono text-xl font-bold text-red-400">
                                        {getSimulatedBudget(issue.budget, simulationResult.costMultiplier)}
                                      </p>
                                      <p className="text-[10px] text-red-400/50 mt-1">+{((simulationResult.costMultiplier - 1) * 100).toFixed(0)}% increase</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Risk Level</p>
                                      <p className={`text-xl font-bold ${simulationResult.riskLevel === 'Critical' ? 'text-red-500' : simulationResult.riskLevel === 'High' ? 'text-amber-500' : 'text-blue-400'}`}>
                                        {simulationResult.riskLevel}
                                      </p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Complaints</p>
                                      <p className="font-mono text-xl font-bold text-amber-400">
                                        ~{simulationResult.predictedComplaints}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ) : null}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="h-full glass rounded-3xl border border-white/5 flex items-center justify-center text-muted-foreground">
                  Select an issue to view AI Briefing
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

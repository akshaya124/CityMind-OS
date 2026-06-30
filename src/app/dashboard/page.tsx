"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Users, Building, Sprout, MapPin, BrainCircuit, Trophy, Medal, Star } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import type { IssueLocation } from "@/components/LiveMap";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-white/5 rounded-2xl animate-pulse">
      <MapPin className="w-8 h-8 mb-2 animate-bounce" />
      <p>Initializing GIS Navigation...</p>
    </div>
  )
});

export default function Dashboard() {
  const [issues, setIssues] = useState<IssueLocation[]>([]);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const q = query(collection(db, "issues"), orderBy("createdAt", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedIssues: IssueLocation[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.location && data.location.lat && data.location.lng) {
            fetchedIssues.push({
              id: doc.id,
              lat: data.location.lat,
              lng: data.location.lng,
              title: data.title || "Reported Issue",
              severity: data.priority || "High",
              aiBriefing: data.aiBriefing || "AI Analysis Pending",
              score: data.score || 0,
              budget: data.budget || "TBD"
            });
          }
        });
        
        setIssues(fetchedIssues);
      } catch (error) {
        console.error("Error fetching issues from Firebase:", error);
      }
    };

    fetchIssues();
  }, []);

  const stats = [
    { label: "Active Issues", value: "24", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Resolved (30d)", value: "156", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Citizens Impacted", value: "8.4k", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Budget Saved", value: "₹2.1M", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const categories = [
    { name: "Roadways", count: 42, icon: Building },
    { name: "Water & San", count: 28, icon: Sprout },
    { name: "Electrical", count: 15, icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">City Digital Twin</h1>
            <p className="text-muted-foreground">Real-time overview of civic infrastructure health.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className={`w-24 h-24 ${stat.color} -mt-8 -mr-8`} />
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Mock Map / Activity Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass rounded-3xl border border-white/5 p-2 h-[450px] flex flex-col relative"
          >
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
              <h3 className="text-xl font-bold bg-background/80 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Threat Map
              </h3>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden relative isolate">
              <LiveMap issues={issues} />
            </div>
          </motion.div>

          {/* Recent Action Plans */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl border border-white/5 p-6 flex flex-col h-[450px]"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" /> Recent Action Plans
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {issues.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center mt-10">No action plans available yet.</p>
              ) : (
                issues.map(issue => (
                  <div key={issue.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-sm leading-tight text-white">{issue.title}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        issue.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        issue.severity === 'High' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                      {issue.aiBriefing}
                    </p>
                    
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground border-t border-white/5 pt-2">
                      <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3 text-purple-400"/> {issue.score}/100</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400"/> {issue.budget}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <Link href="/report" className="w-full block text-center bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors border border-white/10">
                Submit New Data
              </Link>
            </div>
          </motion.div>
        </div>
        </div>

        {/* Gamification / Civic Karma */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 glass rounded-3xl border border-white/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> Civic Karma Leaderboard
            </h3>
            <span className="text-sm font-medium text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5">
              Current Month
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { rank: 1, name: "Sarah J.", points: "2,450", role: "Super Citizen", icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
              { rank: 2, name: "David M.", points: "1,820", role: "Active Watcher", icon: Medal, color: "text-slate-300", bg: "bg-slate-300/10" },
              { rank: 3, name: "Elena R.", points: "1,150", role: "Contributor", icon: Star, color: "text-amber-600", bg: "bg-amber-600/10" },
            ].map((user) => (
              <div key={user.rank} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${user.bg} flex items-center justify-center`}>
                  <user.icon className={`w-5 h-5 ${user.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white leading-tight">{user.name}</h4>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-400 font-bold block">{user.points}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Karma</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

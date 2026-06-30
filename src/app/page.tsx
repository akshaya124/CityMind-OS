"use client";

import { motion } from "framer-motion";
import { ArrowRight, Activity, BrainCircuit, ShieldCheck, MapPin, Search } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">CityMind OS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/report" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
              Report Issue
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm font-medium border border-white/10 text-emerald-500"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Online • Processing City Data
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tighter"
          >
            One Photo. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">
              Five AI Decisions.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground"
          >
            Smarter Communities through autonomous AI reasoning. CityMind OS doesn&apos;t just track complaints—it analyzes, prioritizes, and simulates impact to support civic decisions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <Link href="/report" className="flex items-center gap-2 text-base font-medium bg-foreground text-background px-6 py-3 rounded-full hover:scale-105 transition-transform">
              Launch Mission Control
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-7xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Search className="w-6 h-6 text-blue-500" />}
            title="5-Stage Reasoning"
            description="Our AI doesn't just guess. It scouts, analyzes context, commands priority, plans repairs, and guards the outcome."
            delay={0.4}
          />
          <FeatureCard
            icon={<Activity className="w-6 h-6 text-emerald-500" />}
            title="Impact Simulator"
            description="Predicts the cost and risk of repairing today versus delaying for 30 days using historical data."
            delay={0.5}
          />
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-purple-500" />}
            title="Explainable AI"
            description="Every decision includes evidence, confidence scores, and alternative scenarios for full transparency."
            delay={0.6}
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-6 rounded-2xl glass border border-white/5 hover:border-white/10 transition-colors group"
    >
      <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

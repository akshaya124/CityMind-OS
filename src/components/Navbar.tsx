"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BrainCircuit, Activity, MapPin, LayoutDashboard, ShieldAlert } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Report Issue", href: "/report", icon: MapPin },
    { name: "Mission Control", href: "/mission-control", icon: Activity },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Authority Panel", href: "/authority", icon: ShieldAlert },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CityMind OS</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? "text-white" : "text-muted-foreground hover:text-white"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative flex items-center gap-2 z-10">
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Auth / Action */}
        <div className="flex items-center gap-4">
          <Link 
            href="/report" 
            className="hidden sm:flex bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-full transition-colors shadow-lg shadow-blue-500/20 items-center gap-2"
          >
            New Report
          </Link>
        </div>
        
      </div>
    </header>
  );
}

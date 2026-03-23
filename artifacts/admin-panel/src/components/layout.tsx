import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  MessageSquareShare, 
  Settings, 
  TerminalSquare, 
  Smartphone,
  LogOut,
  Bot
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: Smartphone },
  { href: "/broadcast", label: "Broadcast", icon: MessageSquareShare },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/logs", label: "System Logs", icon: TerminalSquare },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, username } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-card/50 backdrop-blur-xl hidden md:flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Bot className="w-8 h-8 text-primary mr-3" />
          <h1 className="font-display font-bold text-xl tracking-wider text-glow-primary text-white">
            CHATHU<span className="text-primary"> MD</span>
          </h1>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={`
                  flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                  ${isActive ? 'text-white' : 'text-muted-foreground hover:text-white'}
                `}>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab" 
                      className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/20 border border-primary/50 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 mr-3 z-10 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
                  <span className="font-medium z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center px-4 py-3 rounded-xl bg-white/5 border border-white/10 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center mr-3">
              <span className="font-bold text-sm text-primary">{username?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-white truncate">{username}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none bg-[url('/images/cyber-bg.png')] bg-cover bg-center opacity-10 mix-blend-screen" />
        
        <header className="h-20 flex-shrink-0 border-b border-white/10 bg-card/30 backdrop-blur-md flex items-center px-8 md:px-12 z-10 justify-between">
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            {navItems.find(i => i.href === location)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">SYSTEM.ONLINE</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 z-10 relative">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

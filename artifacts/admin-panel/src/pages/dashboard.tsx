import React from "react";
import { useGetStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { 
  Activity, Cpu, HardDrive, Users, FileText, 
  MessageSquare, Zap, Clock, Wifi, Server
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats({ query: { refetchInterval: 10000 } });

  if (isLoading && !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="font-mono text-primary text-sm tracking-widest animate-pulse">GATHERING_TELEMETRY...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const statCards = [
    { label: "Bot Status", value: stats.status, icon: Activity, color: stats.status === "Online" ? "text-green-400" : "text-primary" },
    { label: "Uptime", value: formatUptime(stats.uptime), icon: Clock, color: "text-blue-400" },
    { label: "Users Active", value: stats.userCount.toLocaleString(), icon: Users, color: "text-purple-400" },
    { label: "Messages Handled", value: stats.messagesHandled.toLocaleString(), icon: MessageSquare, color: "text-pink-400" },
    { label: "Commands Today", value: stats.commandsToday.toLocaleString(), icon: Zap, color: "text-yellow-400" },
    { label: "Files Stored", value: `${stats.fileCount} (${stats.fileSizeMB})`, icon: FileText, color: "text-cyan-400" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={item} className="bg-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 border border-white/5 shadow-lg"
        >
          <div className="flex items-center mb-6">
            <Server className="w-5 h-5 text-primary mr-3" />
            <h3 className="text-lg font-display font-bold text-white">System Resources</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center"><Cpu className="w-4 h-4 mr-2"/> CPU Load</span>
                <span className="text-sm font-mono text-white">{stats.cpuLoad}</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-blue-500 to-primary h-3 rounded-full relative" style={{ width: `${Math.min(100, parseFloat(stats.cpuLoad))}%` }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground flex items-center"><HardDrive className="w-4 h-4 mr-2"/> Memory Usage</span>
                <span className="text-sm font-mono text-white">{stats.memUsed}MB / {stats.memTotal}MB</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-primary to-accent h-3 rounded-full relative" style={{ width: `${stats.memPercent}%` }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
               <div>
                 <p className="text-xs text-muted-foreground mb-1">Platform</p>
                 <p className="text-sm text-white font-medium">{stats.platform}</p>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground mb-1">Node Version</p>
                 <p className="text-sm text-white font-medium">{stats.nodeVersion}</p>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Network Activity */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-white/5 shadow-lg"
        >
          <div className="flex items-center mb-6">
            <Wifi className="w-5 h-5 text-accent mr-3" />
            <h3 className="text-lg font-display font-bold text-white">Network Activity</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 h-[calc(100%-3rem)]">
            <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Activity className="w-8 h-8 text-blue-400 mb-3" />
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">RX Speed</p>
              <p className="text-2xl font-mono text-white">{stats.net.speedRx}</p>
              <p className="text-xs text-muted-foreground mt-2 border-t border-white/10 pt-2 w-full">Total: {stats.net.totalRx}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-8 h-8 text-pink-400 mb-3" />
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">TX Speed</p>
              <p className="text-2xl font-mono text-white">{stats.net.speedTx}</p>
              <p className="text-xs text-muted-foreground mt-2 border-t border-white/10 pt-2 w-full">Total: {stats.net.totalTx}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

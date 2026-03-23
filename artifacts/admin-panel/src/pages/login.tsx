import React, { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Bot, Lock, User, Terminal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();
  
  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.username);
        toast({ title: "Access Granted", description: "Welcome to CHATHU MD Admin Panel." });
      },
      onError: (error: any) => {
        toast({ 
          title: "Access Denied", 
          description: error?.response?.data?.error || "Invalid credentials",
          variant: "destructive"
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/cyber-bg.png`} className="w-full h-full object-cover opacity-20 mix-blend-screen" alt="background" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-widest text-white text-glow-primary">
            CHATHU<span className="text-primary"> MD</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-2 flex items-center">
            <Terminal className="w-3 h-3 mr-2" />
            SECURE_ADMIN_PORTAL
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input 
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all active:scale-[0.98] flex justify-center items-center"
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "INITIALIZE CONNECTION"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

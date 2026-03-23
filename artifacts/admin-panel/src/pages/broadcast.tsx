import React, { useState } from "react";
import { useSendBroadcast, BroadcastResult } from "@workspace/api-client-react";
import { Send, Users, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Broadcast() {
  const [message, setMessage] = useState("");
  const [targets, setTargets] = useState("");
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const { toast } = useToast();

  const broadcastMut = useSendBroadcast({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        toast({ title: "Broadcast Complete", description: `Sent to ${data.sent} targets.` });
        if (data.sent > 0) setMessage(""); // Keep targets if they want to send again
      },
      onError: (err: any) => {
        toast({ title: "Broadcast Failed", description: err?.response?.data?.error || "Error", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const targetArray = targets.trim() ? targets.split(",").map(t => t.trim()).filter(Boolean) : undefined;
    
    broadcastMut.mutate({ 
      data: { 
        message, 
        targets: targetArray && targetArray.length > 0 ? targetArray : undefined 
      } 
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Global Broadcast</h2>
        <p className="text-sm text-muted-foreground">Transmit signals across the network</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" /> Message Payload
                </label>
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Enter message text..."
                  rows={6}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2" /> Target Vectors <span className="ml-2 lowercase normal-case opacity-50">(optional)</span>
                </label>
                <input 
                  type="text"
                  value={targets}
                  onChange={e => setTargets(e.target.value)}
                  placeholder="Comma separated JIDs (leave empty for all users)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!message.trim() || broadcastMut.isPending}
                className="w-full bg-gradient-to-r from-accent to-pink-600 hover:from-accent/90 hover:to-pink-600/90 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
              >
                {broadcastMut.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Transmit Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="bg-card rounded-2xl border border-white/5 p-6 shadow-xl"
              >
                <h3 className="font-display font-bold text-lg text-white mb-6 border-b border-white/10 pb-4">Transmission Report</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-muted-foreground flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" /> Delivered</span>
                    <span className="text-xl font-bold text-white font-mono">{result.sent}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-muted-foreground flex items-center"><XCircle className="w-4 h-4 mr-2 text-red-400" /> Failed</span>
                    <span className="text-xl font-bold text-white font-mono">{result.failed}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-muted-foreground flex items-center"><Users className="w-4 h-4 mr-2 text-blue-400" /> Total Targets</span>
                    <span className="text-xl font-bold text-white font-mono">{result.total}</span>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-2" /> Failure Details
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {result.errors.map((err, i) => (
                        <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs">
                          <p className="font-mono text-red-400 mb-1 truncate">{err.jid}</p>
                          <p className="text-gray-300">{err.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full bg-card/30 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <Send className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Submit a broadcast to see the transmission report here.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Temporary shim to provide missing icons not in the standard set above
const MessageSquare = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

import React, { useState } from "react";
import { 
  useGetSessions, 
  useCreateSession, 
  useDeleteSession, 
  useReconnectSession, 
  useLogoutSession,
  Session
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Smartphone, Plus, RefreshCw, LogOut, Trash2, 
  CheckCircle2, AlertTriangle, Loader2, QrCode, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Sessions() {
  const { data: sessions, isLoading } = useGetSessions({ query: { refetchInterval: 10000 } });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Active Connections</h2>
          <p className="text-sm text-muted-foreground">Manage your WhatsApp instances</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {sessions?.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </AnimatePresence>
          
          {sessions?.length === 0 && (
            <div className="col-span-full bg-card/50 border border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <Smartphone className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Active Sessions</h3>
              <p className="text-muted-foreground mb-6">Initialize a new connection to start routing messages.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Create Session
              </button>
            </div>
          )}
        </div>
      )}

      {isAddModalOpen && <AddSessionModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });

  const deleteMut = useDeleteSession({ mutation: { onSuccess: () => { toast({title: "Deleted"}); invalidate(); } }});
  const reconnectMut = useReconnectSession({ mutation: { onSuccess: () => { toast({title: "Reconnecting..."}); invalidate(); } }});
  const logoutMut = useLogoutSession({ mutation: { onSuccess: () => { toast({title: "Logged out"}); invalidate(); } }});

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Disconnected":
      case "Logged Out":
      case "Error": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Connecting":
      case "Restoring":
      case "Initializing": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Awaiting QR Scan": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "Connected") return <CheckCircle2 className="w-3 h-3 mr-1.5" />;
    if (status === "Error" || status === "Disconnected") return <AlertTriangle className="w-3 h-3 mr-1.5" />;
    if (status === "Awaiting QR Scan") return <QrCode className="w-3 h-3 mr-1.5" />;
    return <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />;
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-card rounded-2xl border border-white/5 overflow-hidden shadow-lg flex flex-col group"
    >
      <div className="p-6 flex-1 relative">
        {session.isMain && (
          <div className="absolute top-0 right-0 bg-primary text-[10px] font-bold px-3 py-1 rounded-bl-lg text-white uppercase tracking-wider">
            Primary
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{session.label || session.id}</h3>
            <p className="font-mono text-xs text-muted-foreground">{session.id}</p>
          </div>
          <div className="p-2 bg-black/30 rounded-lg border border-white/5">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(session.status)}`}>
            {getStatusIcon(session.status)}
            {session.status}
          </div>
          
          {session.number && (
            <p className="text-sm text-gray-300 font-medium">+{session.number}</p>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5 opacity-70">Platform</span>
              <span className="font-medium text-gray-300">{session.platform || "Unknown"}</span>
            </div>
            {session.connectedAt && (
              <div>
                <span className="block text-[10px] uppercase tracking-wider mb-0.5 opacity-70">Connected</span>
                <span className="font-medium text-gray-300">
                  {new Date(session.connectedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code display if available */}
        {session.status === "Awaiting QR Scan" && session.qr && (
          <div className="mt-4 p-4 bg-white rounded-xl flex items-center justify-center">
            <img src={session.qr} alt="Scan to connect" className="w-full max-w-[200px] h-auto rounded-lg" />
          </div>
        )}
        
        {session.status === "Awaiting QR Scan" && session.pairCode && (
          <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/10 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Pairing Code</p>
            <p className="text-3xl font-mono font-bold tracking-[0.25em] text-white">{session.pairCode}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-black/20">
        <button 
          onClick={() => reconnectMut.mutate({ id: session.id })}
          disabled={reconnectMut.isPending}
          className="p-3 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${reconnectMut.isPending ? 'animate-spin' : ''}`} />
          Reconnect
        </button>
        <button 
          onClick={() => logoutMut.mutate({ id: session.id })}
          disabled={logoutMut.isPending || session.status === "Logged Out"}
          className="p-3 text-xs font-medium text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
        <button 
          onClick={() => {
            if (confirm("Are you sure you want to delete this session?")) {
              deleteMut.mutate({ id: session.id });
            }
          }}
          disabled={deleteMut.isPending}
          className="p-3 text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

function AddSessionModal({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState("");
  const [pairMode, setPairMode] = useState(false);
  const [phone, setPhone] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMut = useCreateSession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Session Created", description: "Wait for initialization to connect." });
        queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
        onClose();
      },
      onError: (err: any) => {
        toast({ title: "Creation Failed", description: err?.response?.data?.error || "Unknown error", variant: "destructive" });
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6 font-display">Initialize Link</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Session ID</label>
            <input 
              type="text" value={id} onChange={e => setId(e.target.value)}
              placeholder="e.g. session-alpha"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <input 
              type="checkbox" checked={pairMode} onChange={e => setPairMode(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary/50 bg-black/50"
            />
            <div>
              <p className="text-sm font-medium text-white">Use Pairing Code</p>
              <p className="text-xs text-muted-foreground">Instead of scanning QR</p>
            </div>
          </label>

          {pairMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Target Phone Number</label>
              <input 
                type="text" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Include country code, no + (e.g. 1234567890)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </motion.div>
          )}

          <button
            onClick={() => createMut.mutate({ data: { id, pairMode, phone: pairMode ? phone : undefined } })}
            disabled={!id || (pairMode && !phone) || createMut.isPending}
            className="w-full mt-4 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {createMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Instance"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useRef, useEffect } from "react";
import { useGetLogs } from "@workspace/api-client-react";
import { TerminalSquare, RefreshCw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Logs() {
  const { data: logs, isLoading, isFetching } = useGetLogs({ query: { refetchInterval: 5000 } as any });
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-white';
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <TerminalSquare className="w-5 h-5 text-primary mr-3" />
          <h2 className="text-xl font-bold text-white font-display">System Output</h2>
          {isFetching && <span className="ml-4 flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefresh}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-black/80 rounded-2xl border border-white/10 shadow-inner overflow-hidden flex flex-col relative font-mono text-sm backdrop-blur-md">
        <div className="h-8 bg-white/5 border-b border-white/10 flex items-center px-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs text-muted-foreground ml-4">nexus_sys_tail -f</span>
        </div>
        
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-1.5 scroll-smooth"
        >
          {isLoading ? (
            <div className="text-primary animate-pulse">Initializing log stream...</div>
          ) : logs?.length === 0 ? (
            <div className="text-muted-foreground">No records found in output buffer.</div>
          ) : (
            logs?.map((log) => (
              <div key={log.id} className="hover:bg-white/5 px-2 py-0.5 rounded transition-colors break-words">
                <span className="text-gray-500 mr-3">
                  [{format(new Date(log.timestamp), 'HH:mm:ss.SSS')}]
                </span>
                <span className={`font-bold mr-3 uppercase w-12 inline-block ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-gray-200">{log.message}</span>
                {log.meta && (
                  <span className="ml-3 text-gray-600">| {log.meta}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

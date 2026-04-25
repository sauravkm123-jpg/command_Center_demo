import React from "react";
import { AlertTriangle } from "lucide-react";
import { AgentReport } from "../lib/gemini";

interface AgentPanelProps {
  title: string;
  agentId: string;
  icon: React.ElementType;
  latestReport: AgentReport | null;
  history: AgentReport[];
}

export function AgentPanel({ title, agentId, icon: Icon, latestReport, history }: AgentPanelProps) {
  
  const getTheme = (id: string) => {
    switch (id) {
      case 'crowd': return { color: 'red', bg: 'bg-red-900/20', border: 'border-red-500', text: 'text-red-400', badge: 'bg-red-600', fill: 'bg-red-500' };
      case 'anomaly': return { color: 'blue', bg: 'bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-400', badge: 'bg-blue-600', fill: 'bg-blue-500' };
      case 'inventory': return { color: 'amber', bg: 'bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-400', badge: 'bg-amber-600', fill: 'bg-amber-500' };
      case 'security': return { color: 'purple', bg: 'bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-400', badge: 'bg-purple-600', fill: 'bg-purple-500' };
      default: return { color: 'slate', bg: 'bg-slate-800/50', border: 'border-slate-500', text: 'text-slate-400', badge: 'bg-slate-600', fill: 'bg-slate-500' };
    }
  };

  const theme = getTheme(agentId);
  const currentStatus = latestReport?.status || 'idle';
  const isActiveOrAlert = currentStatus === 'alert' || currentStatus === 'warning';

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded overflow-hidden flex flex-col h-full">
      {/* Top badges identical to High Density */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <span className={`${theme.badge} px-2 py-0.5 text-[10px] font-bold rounded uppercase flex items-center gap-1.5 shadow-md text-white`}>
          <Icon size={10} /> {title}
        </span>
        <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono rounded border border-white/10 uppercase text-slate-200">
          {currentStatus}
        </span>
      </div>

      {/* Top half: Conceptual feed representation/Current state */}
      <div className="flex-shrink-0 h-32 bg-slate-800 flex items-center justify-center relative border-b border-slate-800">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)]"></div>
        {latestReport ? (
           <div className={`absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur px-2 py-2 rounded border flex flex-col gap-1 ${isActiveOrAlert ? `border-${theme.color}-500/50` : 'border-slate-600/30'}`}>
              <div className="flex justify-between items-start">
                 <div className={`text-[10px] font-bold uppercase ${isActiveOrAlert ? theme.text : 'text-slate-300'}`}>
                   {latestReport.message}
                 </div>
              </div>
              {latestReport.actionTaken && latestReport.actionTaken !== "null" && (
                <div className={`text-[9px] uppercase ${theme.text} mt-1 pt-1 border-t border-slate-700/50 flex font-mono items-center gap-1`}>
                   <AlertTriangle size={10} className="w-3 h-3 flex-shrink-0" />
                   <span className="opacity-70 mr-1">ACTION:</span> {latestReport.actionTaken}
                </div>
              )}
           </div>
        ) : (
           <div className="text-center text-slate-500 text-xs font-mono">[ AWAITING ANALYSIS ]</div>
        )}
      </div>

      {/* Bottom half: History Log styled like High Density incident log */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-2 space-y-2 flex flex-col">
          {history.length === 0 ? (
             <div className="text-[10px] text-slate-600 font-mono uppercase px-1">No incidents logged</div>
          ) : (
            history.map((log, idx) => {
              const isLogAlert = log.status === 'alert' || log.status === 'warning';
              return (
                <div key={idx} className={`p-2 rounded text-[11px] border-l-2 ${isLogAlert ? theme.bg : 'bg-slate-800/30'} ${isLogAlert ? theme.border : 'border-slate-600'}`}>
                  <div className="flex justify-between mb-1">
                    <span className={`font-bold uppercase ${isLogAlert ? theme.text : 'text-slate-400'}`}>{log.status}</span>
                    <span className="text-slate-500 font-mono text-[9px] uppercase whitespace-nowrap">Now</span>
                  </div>
                  <p className="text-slate-300 leading-snug line-clamp-2">{log.message}</p>
                </div>
              )
            })
          )}
      </div>
    </div>
  );
}

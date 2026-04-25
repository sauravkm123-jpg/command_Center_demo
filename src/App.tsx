import { useState, useCallback, useEffect } from "react";
import { Users, Eye, ShieldAlert, Activity } from "lucide-react";
import { AgentPanel } from "./components/AgentPanel";
import { VideoFeed } from "./components/VideoFeed";
import { AgentReport, analyzeFrame } from "./lib/gemini";

type AgentHistory = Record<string, AgentReport[]>;

export default function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  
  useEffect(() => {
    const updateTime = () => setTimeStr(new Date().toLocaleTimeString('en-GB') + ' | ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [latestReports, setLatestReports] = useState<Record<string, AgentReport>>({});
  const [agentHistory, setAgentHistory] = useState<AgentHistory>({
    crowd: [],
    anomaly: [],
    security: []
  });

  const handleFrameCaptured = useCallback(async (base64Image: string, isDemo: boolean = false) => {
    if (isProcessingFrame) return;
    setIsProcessingFrame(true);
    try {
      let reports: AgentReport[];
      
      if (isDemo) {
        // Fast mock analysis for demo videos so users don't wait for API on generic stock video
        await new Promise(r => setTimeout(r, 600));
        
        const randomHit = Math.random();
        reports = [
          {
            id: 'crowd',
            status: randomHit > 0.70 ? 'alert' : 'monitoring',
            message: randomHit > 0.70 ? 'Bottleneck forming at Gate North. Wait time ~12 mins.' : 'Flow rate nominal at all visible gates.',
            actionTaken: randomHit > 0.70 ? 'Redirecting arrivals to Gate East.' : null,
            confidence: Math.floor(Math.random() * 10) + 90
          },
          {
            id: 'anomaly',
            status: randomHit > 0.80 ? 'warning' : 'monitoring',
            message: randomHit > 0.80 ? 'Fast movement/running detected in sector 4.' : 'Crowd behavior is within normal parameters.',
            actionTaken: randomHit > 0.80 ? 'Alerted guard patrol unit 7.' : null,
            confidence: Math.floor(Math.random() * 10) + 85
          },
          {
            id: 'security',
            status: randomHit > 0.90 ? 'alert' : 'monitoring',
            message: randomHit > 0.90 ? 'Unattended bag spotted near Plaza Exit.' : 'Perimeter secure. No suspicious objects.',
            actionTaken: randomHit > 0.90 ? 'Security Team dispatched immediately.' : null,
            confidence: Math.floor(Math.random() * 10) + 92
          }
        ];
      } else {
        // Real analysis for webcam/uploaded footage
        reports = await analyzeFrame(base64Image);
      }
      
      setLatestReports(prev => {
        const newReports = { ...prev };
        reports.forEach(r => { if (r.id) newReports[r.id] = r; });
        return newReports;
      });

      setAgentHistory(prev => {
        const newHistory = { ...prev };
        reports.forEach(r => {
          if (r.id && r.status !== 'idle') {
            newHistory[r.id] = [r, ...(newHistory[r.id] || [])].slice(0, 20);
          }
        });
        return newHistory;
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
    } finally {
      setIsProcessingFrame(false);
    }
  }, [isProcessingFrame]);

  return (
    <div className="bg-slate-950 text-slate-100 h-screen w-full flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Header matching High Density */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
          <h1 className="font-mono font-bold tracking-tighter text-lg text-slate-200 uppercase">Sentinel-V4 : Multi-Agent Command Center</h1>
        </div>
        <div className="hidden lg:flex gap-8 font-mono text-xs text-slate-400">
          <div>SYSTEM: <span className={isAnalyzing ? "text-emerald-400 uppercase" : "text-slate-500 uppercase"}>{isAnalyzing ? 'Active' : 'Standby'}</span></div>
          <div>UPTIME: <span className="text-slate-200 uppercase">04:12:44</span></div>
          <div>LATENCY: <span className="text-slate-200">12ms</span></div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold bg-slate-800 px-3 py-1 rounded">
          {timeStr}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3 bg-slate-950 flex-col xl:flex-row">
        
        {/* Left Column */}
        <div className="flex-shrink-0 xl:w-[600px] flex flex-col gap-3 h-full">
          <div className="flex-shrink-0 border border-slate-800 rounded bg-slate-900 flex flex-col max-h-[60%] relative">
             <div className="p-2 border-b border-slate-800 bg-slate-800/30 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Primary Surveillance Feed
             </div>
             <div className="p-2 flex-1 min-h-0 relative z-20">
               <VideoFeed 
                 isAnalyzing={isAnalyzing} 
                 setIsAnalyzing={setIsAnalyzing} 
                 onFrameCaptured={handleFrameCaptured} 
               />
             </div>
          </div>
          
          <div className="flex-1 border border-slate-800 rounded bg-slate-900 flex flex-col overflow-y-auto">
             <div className="p-2 border-b border-slate-800 bg-slate-800/30 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Architecture Overview
             </div>
             <div className="p-4 text-[11px] text-slate-400 leading-relaxed font-mono">
               <p className="mb-2"><span className="text-cyan-400">»</span> This dashboard operates a multi-agent AI system.</p>
               <p className="mb-2"><span className="text-cyan-400">»</span> When analysis is active, frames are extracted every 5 seconds.</p>
               <p><span className="text-cyan-400">»</span> Three specialized agents (Crowd Flow, Anomaly Detection, and Security) simultaneously evaluate the scene and report their findings in real-time.</p>
             </div>
          </div>
        </div>

        {/* Right Column: Agents Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
          <AgentPanel 
            title="Flow Control" 
            agentId="crowd" 
            icon={Users} 
            latestReport={latestReports['crowd'] || null}
            history={agentHistory['crowd']}
          />
          <AgentPanel 
            title="Behavior" 
            agentId="anomaly" 
            icon={Eye} 
            latestReport={latestReports['anomaly'] || null}
            history={agentHistory['anomaly']}
          />
          <AgentPanel 
            title="Objects" 
            agentId="security" 
            icon={ShieldAlert} 
            latestReport={latestReports['security'] || null}
            history={agentHistory['security']}
          />
        </div>
      </main>
      
      {/* Footer matching High Density */}
      <footer className="h-8 bg-slate-900 border-t border-slate-800 flex items-center px-4 justify-between font-mono text-[9px] text-slate-500 uppercase tracking-widest">
        <div>Secure Protocol v2.9-X</div>
        <div>Encryption: AES-256-GCM</div>
        <div>Auth: Agent_Team_Admin_04</div>
      </footer>
    </div>
  );
}

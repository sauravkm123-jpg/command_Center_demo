import React, { useRef, useEffect, useState, useCallback } from "react";
import { Camera, Upload, Play, Square, Loader2, MonitorPlay, ChevronDown, Youtube, Link as LinkIcon } from "lucide-react";
import ReactPlayer from "react-player";

interface VideoFeedProps {
  onFrameCaptured: (base64Image: string, isDemo: boolean) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export function VideoFeed({ onFrameCaptured, isAnalyzing, setIsAnalyzing }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [sourceType, setSourceType] = useState<'webcam' | 'file' | 'youtube' | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const captureFrame = useCallback(() => {
    if (sourceType === 'youtube') {
      // We cannot extract frames from YouTube iframe due to CORS. We simulate it.
      onFrameCaptured('', true);
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const targetWidth = 640;
      const ratio = video.videoHeight / video.videoWidth;
      const targetHeight = targetWidth * ratio;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        if (base64) onFrameCaptured(base64, false);
      }
    }
  }, [onFrameCaptured, sourceType]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing && sourceType && isReady) {
      const delay = sourceType === 'youtube' ? 2500 : 5000;
      interval = setInterval(() => {
        captureFrame();
      }, delay);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, sourceType, isReady, captureFrame]);

  const startWebcam = async () => {
    try {
      if (stream) stream.getTracks().forEach(track => track.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(newStream);
      setSourceType('webcam');
      setIsAnalyzing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access webcam.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    const url = URL.createObjectURL(file);
    setSourceType('file');
    setIsAnalyzing(true);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
    }
  };

  const submitYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setSourceType('youtube');
    setShowYoutubeInput(false);
    setIsReady(true);
    setIsAnalyzing(true);
  };

  const stopFeed = () => {
    setIsAnalyzing(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
    }
    setSourceType(null);
    setYoutubeUrl("");
    setIsReady(false);
  };

  useEffect(() => {
    if (videoRef.current && sourceType && sourceType !== 'youtube') {
      if (isAnalyzing) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') console.error(e);
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isAnalyzing, sourceType]);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded relative shadow-md h-full">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header controls - High Density matched */}
      <div className="flex flex-wrap items-center justify-between p-2 border-b border-slate-800 bg-slate-800/30 gap-2 relative z-10">
        <div className="flex items-center gap-2">
          {sourceType && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-slate-700">
              <span className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-mono uppercase text-slate-300 tracking-wider">
                {isAnalyzing ? 'Analyzing' : 'Ready'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {!sourceType ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase text-slate-100 bg-red-600 hover:bg-red-500 rounded border border-red-500/50 shadow-md transition-colors"
                >
                  <Youtube size={12} /> YouTube
                </button>
                {showYoutubeInput && (
                  <form onSubmit={submitYoutube} className="absolute top-full right-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded shadow-xl p-2 z-50 flex gap-2">
                     <input 
                       autoFocus
                       type="url" 
                       placeholder="Paste YouTube Link" 
                       value={youtubeUrl}
                       onChange={(e) => setYoutubeUrl(e.target.value)}
                       className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-red-500"
                     />
                     <button type="submit" className="bg-red-600 hover:bg-red-500 text-white rounded px-2 flex items-center justify-center">
                        <LinkIcon size={12} />
                     </button>
                  </form>
                )}
              </div>
              <button
                onClick={startWebcam}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase text-slate-100 bg-emerald-600 hover:bg-emerald-500 rounded border border-emerald-500/50 shadow-md transition-colors"
              >
                <Camera size={12} /> Webcam
              </button>
              <label 
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded transition-colors cursor-pointer shadow-sm"
              >
                <Upload size={12} /> Upload
                <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsAnalyzing(!isAnalyzing)}
                disabled={!isReady && isAnalyzing}
                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors shadow-md ${
                  isAnalyzing 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500/50'
                }`}
              >
                {isAnalyzing ? (
                  <><Square size={10} className="fill-current" /> Pause</>
                ) : (
                  <><Play size={10} className="fill-current" /> Analyze</>
                )}
              </button>
              <button
                onClick={stopFeed}
                className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 rounded transition-colors border border-transparent hover:border-red-500/30"
                title="Stop Feed"
              >
                <Square size={10} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Video View */}
      <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative min-h-0">
        {!sourceType ? (
          <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">[ NO SOURCE SELECTED ]</div>
        ) : sourceType === 'youtube' ? (
          <div className="w-full h-full relative pointer-events-none">
             <ReactPlayer 
               url={youtubeUrl} 
               playing={isAnalyzing} 
               muted 
               loop 
               width="100%" 
               height="100%" 
               style={{ position: 'absolute', top: 0, left: 0 }}
               onReady={() => setIsReady(true)}
             />
             <div className="absolute top-2 left-2 bg-red-600/80 text-white text-[9px] px-1.5 py-0.5 rounded shadow z-10 backdrop-blur font-mono">
                SIMULATED ANALYSIS (CORS Restricted)
             </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            muted
            crossOrigin="anonymous"
            loop={sourceType === 'file' || sourceType === 'demo'}
            onCanPlay={() => setIsReady(true)}
            onError={(e) => console.error("Video error: ", e.currentTarget.error)}
          />
        )}
        
        {isAnalyzing && (
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/80 backdrop-blur-sm border border-slate-700 px-2.5 py-1.5 rounded shadow-lg">
            <Loader2 size={10} className="text-emerald-500 animate-spin" />
            <span className="text-[9px] font-mono text-slate-200 uppercase tracking-wider">Processing</span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, Play, Pause, ListMusic, Battery, Zap, Clock, Lock, Unlock } from 'lucide-react';
import { usePageVisibility } from '@/lib/hooks';

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
}

interface QuoteData {
  quote: string;
  author: string;
  id: string;
  timestamp: Date;
  type?: 'quote' | 'system';
}

const SYSTEM_MESSAGES = [
  "Tip: You can access your grades and schedule even when the official portal is offline!",
  "Did you know? LCC Hub uses AI to help you analyze your academic performance.",
  "How's your experience with the new portal so far? We'd love to hear your feedback!",
  "LCC Hub: Modernizing your student experience at La Concepcion College.",
  "Fact: The AI assistant can execute Python code to help you with complex math problems.",
  "Check out the Community tab to see what's happening around the campus!",
  "LCC Hub is designed to be mobile-first, so you can check your status on the go.",
  "Security: Your credentials are encrypted and stored securely using AES-256 encryption.",
  "Stay updated: Real-time notifications keep you informed about class changes.",
  "Productivity: Use the 'Insights' tab to see a detailed breakdown of your grade trends.",
  "Customization: You can change your theme and notification settings in the profile menu.",
  "Did you know? LCC Hub caches your data locally for near-instant loading times.",
  "Community: Share your thoughts and connect with other LCCians in the forum.",
  "Pro Tip: Ask the AI assistant to 'summarize my grades' for a quick academic overview.",
  "Financials: Track your balance and payment history directly from the dashboard.",
  "LCC Hub is built by students, for students, to make college life a bit easier.",
  "Need help? The AI assistant can answer questions about school policies and events.",
  "Fact: You can see upcoming school holidays and events in the Schedule tab.",
  "Is there a feature you'd like to see added? Let us know in the feedback section!",
  "LCC Hub: Fast, Secure, and AI-Powered.",
];

interface MusicTrack {
  id: string;
  name: string;
  url: string;
}

const CALM_TRACKS: MusicTrack[] = [
  { id: 'flux-chillhop', name: 'ChillHop', url: 'https://fluxmusic.api.radiosphere.io/channels/chillhop/stream.mp3' },
  { id: 'flux-electronic', name: 'Electronic Chillout', url: 'https://fluxmusic.api.radiosphere.io/channels/electronic-chillout/stream.mp3' },
  { id: 'flux-lounge', name: 'Lounge', url: 'https://fluxmusic.api.radiosphere.io/channels/flux-lounge/stream.mp3' },
  { id: 'flux-chillout', name: 'Chillout Radio', url: 'https://fluxmusic.api.radiosphere.io/channels/chillout-radio/stream.mp3' },
  { id: 'flux-yoga', name: 'Yoga Sounds', url: 'https://fluxmusic.api.radiosphere.io/channels/yogasounds/stream.mp3' },
];



// Helper to optimize Cloudinary URLs
const optimizeCloudinaryUrl = (url: string, width: number = 1200) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Insert transformations after /upload/
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

export default function StudyModePage() {
  const [images, setImages] = useState<CloudinaryResource[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(CALM_TRACKS[0]);
  const [nowPlaying, setNowPlaying] = useState<{ title: string; artist: string } | null>(null);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isMobileMode, setIsMobileMode] = useState<boolean | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isBackgroundLocked, setIsBackgroundLocked] = useState(false);
  
  // Sleep Timer State
  const [sleepTimerDuration, setSleepTimerDuration] = useState<number | null>(null); // in minutes
  const [sleepTimerLeft, setSleepTimerLeft] = useState<number | null>(null); // in seconds

  const isVisible = usePageVisibility();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio Visualizer Logic
  useEffect(() => {
    if (!isPlaying || !audioRef.current || isLowPowerMode) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const initAnalyser = async () => {
      if (!audioRef.current) return;
      
      if (!analyserRef.current) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContext();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaElementSource(audioRef.current);
          
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          
          analyser.fftSize = 64; 
          analyserRef.current = analyser;
        } catch (err) {
          console.error("Visualizer initialization failed:", err);
          return;
        }
      }

      // Resume context if suspended
      if (analyserRef.current && analyserRef.current.context.state === 'suspended') {
        try {
          await (analyserRef.current.context as AudioContext).resume();
        } catch (e) {
          console.error("Failed to resume AudioContext:", e);
        }
      }
    };

    initAnalyser();

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerY = canvas.height / 2;
      const centerX = canvas.width / 2;
      // We divide by bufferLength to fit the whole spectrum in half the screen
      const sliceWidth = (canvas.width / 2) / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255;
        const barHeight = v * (canvas.height / 2) * 1.2; 
        const hue = (i / bufferLength) * 360;
        
        // Calculate positions
        const rightX = centerX + (i * sliceWidth);
        const leftX = centerX - ((i + 1) * sliceWidth);

        // Gradient for the bar (vertical)
        // We can reuse the same gradient definition logic
        const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
        gradient.addColorStop(0.5, `hsla(${hue}, 100%, 60%, 1)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

        ctx.fillStyle = gradient;
        
        // Draw Right Bar
        ctx.fillRect(rightX, centerY - barHeight, sliceWidth - 0.5, barHeight * 2);
        
        // Draw Left Bar
        ctx.fillRect(leftX, centerY - barHeight, sliceWidth - 0.5, barHeight * 2);

        // Add glowing caps
        if (barHeight > 5) {
             ctx.fillStyle = `hsla(${hue}, 100%, 90%, 0.8)`;
             ctx.shadowBlur = 10;
             ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
             
             // Top caps
             ctx.fillRect(rightX, centerY - barHeight - 1, sliceWidth - 0.5, 2);
             ctx.fillRect(leftX, centerY - barHeight - 1, sliceWidth - 0.5, 2);

             // Bottom caps
             ctx.fillRect(rightX, centerY + barHeight, sliceWidth - 0.5, 2);
             ctx.fillRect(leftX, centerY + barHeight, sliceWidth - 0.5, 2);
             
             ctx.shadowBlur = 0;
        }
      }
      
      // Center line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentTrack, isLowPowerMode]);

  // Auto-detect mobile mode
  useEffect(() => {
    const checkMode = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile !== isMobileMode) setIsMobileMode(isMobile);
    };
    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, [isMobileMode]);

  // Fetch images
  useEffect(() => {
    if (isMobileMode === null) return;
    
    // Skip fetching if not visible to save bandwidth/battery
    if (!isVisible && images.length > 0) return;

    async function fetchImages() {
      try {
        const folder = isMobileMode ? 'mobile' : 'desktop';
        const imgResponse = await fetch(`/api/cloudinary/images?folder=${folder}&t=${Date.now()}`);
        const imgData = await imgResponse.json();
        if (Array.isArray(imgData)) {
          setImages(imgData);
          setCurrentImageIndex(0);
        }
      } catch (error) {
        console.error('Failed to fetch images:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, [isMobileMode, isVisible]); 

  const fetchNewQuote = useCallback(async () => {
    // Skip if not visible or low power mode
    if (!isVisible || isLowPowerMode) return;

    try {
      const response = await fetch(`/api/quotes?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      if (data && data.quote) {
        const newMessage: QuoteData = {
          quote: data.quote,
          author: data.author,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          type: 'quote'
        };
        setCurrentMessage(newMessage);
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    }
  }, [isVisible, isLowPowerMode]);

  const sendSystemMessage = useCallback(() => {
     // Skip if not visible or low power mode
    if (!isVisible || isLowPowerMode) return;

    const randomMsg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
    const newMessage: QuoteData = {
      quote: randomMsg,
      author: 'LCC Hub',
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: 'system'
    };
    setCurrentMessage(newMessage);
  }, [isVisible, isLowPowerMode]);

  // Message intervals
  useEffect(() => {
    fetchNewQuote(); // Initial fetch
    
    const quoteInterval = setInterval(fetchNewQuote, 60000);
    const systemInterval = setInterval(sendSystemMessage, 180000); // 3 minutes
    
    return () => {
      clearInterval(quoteInterval);
      clearInterval(systemInterval);
    };
  }, [fetchNewQuote, sendSystemMessage]);

  // Sleep Timer Logic
  useEffect(() => {
    if (sleepTimerLeft === null) return;

    if (sleepTimerLeft <= 0) {
      // Timer finished
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setSleepTimerDuration(null);
      setSleepTimerLeft(null);
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerLeft]);

  const toggleSleepMenu = () => {
    if (showSleepMenu) {
      setShowSleepMenu(false);
    } else {
      setShowSleepMenu(true);
      setShowMusicMenu(false);
    }
  };

  const toggleMusicMenu = () => {
    if (showMusicMenu) {
      setShowMusicMenu(false);
    } else {
      setShowMusicMenu(true);
      setShowSleepMenu(false);
    }
  };

  const setSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerDuration(null);
      setSleepTimerLeft(null);
    } else {
      setSleepTimerDuration(minutes);
      setSleepTimerLeft(minutes * 60);
    }
    setShowSleepMenu(false);
  };

  const nextImage = useCallback(() => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images]);

  const prevImage = useCallback(() => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images]);

  // Image rotation interval
  useEffect(() => {
    if (images.length > 0 && isVisible && !isLowPowerMode && !isBackgroundLocked) {
      const interval = setInterval(nextImage, 60000); // 1 min
      return () => clearInterval(interval);
    }
  }, [images, isVisible, isLowPowerMode, isBackgroundLocked, nextImage]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setAudioError(null);
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  const changeTrack = (track: MusicTrack) => {
    setIsPlaying(false);
    setNowPlaying(null);
    setCurrentTrack(track);
    setShowMusicMenu(false);
  };

  // Fetch Now Playing Metadata for FluxFM
  useEffect(() => {
    if (!currentTrack.url.includes('fluxfm') && !currentTrack.url.includes('radiosphere.io')) {
      setNowPlaying(null);
      return;
    }

    const fetchMetadata = async () => {
      try {
        const parts = currentTrack.url.split('/');
        // New URL format: https://fluxmusic.api.radiosphere.io/channels/slug/stream.mp3
        let slug = parts[parts.length - 2]; 
        
        if (!slug || slug === 'radiosphere.io') return;

        // Map some slugs if they differ from the API endpoint
        if (slug === 'chillout-radio') slug = 'chillout';

        // Try direct fetch first (will only work if CORS is open or browser has reachability)
        // Adding a short timeout to avoid hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const res = await fetch(`https://api.fluxfm.de/v1/tracks/current?channel=${slug}`, {
            signal: controller.signal,
            mode: 'cors'
          });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            if (data && data.title && data.artist) {
              setNowPlaying({ title: data.title, artist: data.artist });
              return;
            }
          }
        } catch (e) {
          // Direct fetch failed, likely CORS or connection timeout
        }

        // Secondary attempt using a CORS proxy (allorigins)
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.fluxfm.de/v1/tracks/current?channel=${slug}`)}`;
          const proxyRes = await fetch(proxyUrl);
          if (proxyRes.ok) {
            const proxyData = await proxyRes.json();
            const data = JSON.parse(proxyData.contents);
            if (data && data.title && data.artist) {
              setNowPlaying({ title: data.title, artist: data.artist });
              return;
            }
          }
        } catch (e) {
          // Proxy failed
        }

        // If all else fails, reset to station name
        setNowPlaying(null);
      } catch (err) {
        setNowPlaying(null);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 60000); // Poll every 1m
    return () => clearInterval(interval);
  }, [currentTrack]);

  const optimizedCurrentImageUrl = useMemo(() => {
    if (!images[currentImageIndex]) return '';
    const width = isMobileMode ? 600 : 1920;
    return optimizeCloudinaryUrl(images[currentImageIndex].secure_url, width);
  }, [images, currentImageIndex, isMobileMode]);

  // Preload next image
  useEffect(() => {
    if (images.length > 1 && !isLowPowerMode) {
        const nextIndex = (currentImageIndex + 1) % images.length;
        const width = isMobileMode ? 600 : 1920;
        const nextUrl = optimizeCloudinaryUrl(images[nextIndex].secure_url, width);
        const img = new window.Image();
        img.src = nextUrl;
    }
  }, [currentImageIndex, images, isMobileMode, isLowPowerMode]);


  if (loading && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 animate-pulse">
          Switching to study mode...
        </p>
      </div>
    );
  }

  const imageVariants = {
    enter: { scale: 1.1, opacity: 0 },
    center: { zIndex: 1, scale: 1, opacity: 1 },
    exit: { zIndex: 0, scale: 0.95, opacity: 0 }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white font-sans selection:bg-white/20">
      <audio 
        ref={audioRef} 
        src={currentTrack.url}
        loop 
        autoPlay={!isLowPowerMode} 
        preload="none" 
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)} 
        onError={() => setIsPlaying(false)}
      />

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false}>
          {images.length > 0 && (
            <motion.div 
              key={images[currentImageIndex]?.public_id} 
              variants={isLowPowerMode ? undefined : imageVariants} 
              initial={isLowPowerMode ? false : "enter"} 
              animate={isLowPowerMode ? false : "center"} 
              exit={isLowPowerMode ? undefined : "exit"} 
              transition={{ 
                duration: 2,
                ease: [0.4, 0, 0.2, 1]
              }} 
              className="absolute inset-0 h-full w-full"
            >
              <Image 
                src={optimizedCurrentImageUrl} 
                alt="Background" 
                fill 
                className="object-cover" 
                priority 
                unoptimized // We are manually optimizing
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 z-[2]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="opacity-90" />
          <span className="text-sm font-bold tracking-wider uppercase opacity-80 drop-shadow-sm">LCC Hub</span>
        </div>
        
        {/* Navigation Controls moved to Header */}
        <div className="flex items-center gap-4">
          {/* Low Power Mode Toggle */}
          <button 
            onClick={() => setIsLowPowerMode(!isLowPowerMode)} 
            className={`p-2 rounded-lg transition-all ${isLowPowerMode ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-black/20 text-white/60 hover:bg-black/40 border-white/10'} border backdrop-blur-md`}
            title={isLowPowerMode ? "Disable Efficiency Mode" : "Enable Efficiency Mode"}
          >
            {isLowPowerMode ? <Battery className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          </button>

          <div className="flex gap-1 mr-2 hidden sm:flex">
            {images.map((_, idx) => (
              <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-white/80' : 'w-1 bg-white/20'}`} />
            ))}
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setIsBackgroundLocked(!isBackgroundLocked)} 
              className={`p-1.5 rounded-lg border transition-all ${isBackgroundLocked ? 'bg-white/20 text-white border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-black/60 border-white/10 text-white/60 hover:bg-black/80 hover:text-white'}`}
              title={isBackgroundLocked ? "Unlock Background" : "Lock Background"}
            >
              {isBackgroundLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
            <button onClick={prevImage} className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-black/80 transition-colors">
              <ChevronLeft className="w-4 h-4 opacity-80" />
            </button>
            <button onClick={nextImage} className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-black/80 transition-colors">
              <ChevronRight className="w-4 h-4 opacity-80" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 h-[calc(100vh-140px)] flex flex-col">
        
        {/* Quote Display Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center z-20 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentMessage && (
              <motion.div 
                key={currentMessage.id} 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-3xl flex flex-col items-center gap-6 w-full max-h-full overflow-y-auto overflow-x-hidden scrollbar-hide px-2"
              >
                {currentMessage.type === 'system' ? (
                   <div className="px-8 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shrink-0 max-w-full">
                      <p className="text-xs md:text-sm font-bold tracking-widest text-white/90 uppercase break-words">
                        {currentMessage.quote}
                      </p>
                   </div>
                ) : (
                  <>
                    <div className="relative inline-block px-8 py-2 shrink-0 max-w-full">
                       <span className="absolute -top-4 -left-2 text-6xl md:text-8xl text-white/10 font-serif leading-none select-none">“</span>
                       <p className="text-xl md:text-3xl lg:text-4xl font-medium leading-tight text-white drop-shadow-xl font-serif tracking-wide text-balance break-words">
                        {currentMessage.quote}
                       </p>
                       <span className="absolute -bottom-8 -right-2 text-6xl md:text-8xl text-white/10 font-serif leading-none select-none">”</span>
                    </div>
                    
                    <div className="flex flex-col items-center mt-1 gap-3 opacity-90 shrink-0 pb-4">
                      <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                      <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-white shadow-black drop-shadow-sm break-all">
                        {currentMessage.author}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Area */}
        <div className="pb-10 pt-4 border-t border-white/5 space-y-4">
          <div className="relative h-32 w-full overflow-hidden pointer-events-none">
            <canvas 
              ref={canvasRef} 
              className="absolute inset-x-0 bottom-0 w-full h-full opacity-60" 
              width={400} 
              height={128} 
            />
          </div>

          <div className="relative group">
            {/* Background Container - Glassmorphism */}
            <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-white/20 pointer-events-none" />

            <div className="relative flex items-center gap-5 z-10 p-5">
              <div className="relative">
                <button 
                  onClick={toggleAudio} 
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${isPlaying ? 'bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'}`}
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[7px] font-black bg-red-500 text-white tracking-[0.2em] uppercase animate-pulse shadow-sm">Live</span>
                </div>
                {nowPlaying ? (
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold truncate tracking-tight text-white leading-tight">{nowPlaying.title}</h3>
                    <p className="text-[10px] font-semibold text-white/40 truncate uppercase tracking-widest mt-0.5">{nowPlaying.artist}</p>
                  </div>
                ) : (
                  <h3 className="text-sm font-bold truncate tracking-tight text-white leading-tight">{currentTrack.name}</h3>
                )}
              </div>

              {/* Controls Right */}
              <div className="flex items-center gap-1">
                
                {/* Sleep Timer */}
                <div className="relative">
                  <button 
                    onClick={toggleSleepMenu} 
                    className={`p-2.5 transition-all duration-300 rounded-xl ${sleepTimerLeft ? 'text-white bg-white/20' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                    title="Sleep Timer"
                  >
                    <div className="flex items-center gap-1.5">
                       {sleepTimerLeft ? (
                         <span className="text-[10px] font-black w-6 text-center tabular-nums">{Math.ceil(sleepTimerLeft / 60)}m</span>
                       ) : (
                         <Clock className="w-5 h-5" />
                       )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {showSleepMenu && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: -12, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full right-0 mb-2 w-36 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20">
                        {[15, 30, 45, 60].map((min) => (
                          <button key={min} onClick={() => setSleepTimer(min)} className="w-full text-left px-5 py-3 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all uppercase tracking-wider">
                            {min} Minutes
                          </button>
                        ))}
                        {sleepTimerLeft && (
                          <button onClick={() => setSleepTimer(null)} className="w-full text-left px-5 py-3 text-[10px] font-bold text-red-400 hover:bg-red-500/10 transition-all border-t border-white/5 uppercase tracking-wider">
                            Disable Timer
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Track List */}
                <div className="relative">
                  <button onClick={toggleMusicMenu} className={`p-2.5 transition-all duration-300 rounded-xl ${showMusicMenu ? 'text-white bg-white/20' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
                    <ListMusic className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {showMusicMenu && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: -12, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full right-0 mb-2 w-64 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20 max-h-72 overflow-y-auto scrollbar-hide">
                        <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                           <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Select Station</span>
                        </div>
                        {CALM_TRACKS.map((t) => (
                          <button key={t.id} onClick={() => changeTrack(t)} className={`w-full text-left px-5 py-4 text-[10px] font-bold transition-all border-b border-white/5 last:border-0 uppercase tracking-wider ${currentTrack.id === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                            {t.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
             <span className="text-[8px] font-bold text-white/20 tracking-[0.2em] uppercase">Powered by FluxFM</span>
          </div>
        </div>
      </main>

      {audioError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 text-[9px] font-bold uppercase tracking-widest opacity-90 flex items-center gap-2 bg-red-900/90 px-3 py-1 rounded-full border border-white/10 shadow-lg">
          <AlertCircle className="w-3 h-3" />
          {audioError}
        </div>
      )}
    </div>
  );
}

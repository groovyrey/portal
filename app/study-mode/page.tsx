'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, Play, Pause, ListMusic, Battery, Zap, Clock, Lock, Unlock, RefreshCw, Settings, ImageOff, Image as ImageIcon, Sun, Moon, Wifi, SignalHigh, Bluetooth } from 'lucide-react';
import { usePageVisibility } from '@/lib/hooks';

// Extend Navigator type for Network Information API
interface NetworkInformation extends EventTarget {
  readonly type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  readonly effectiveType?: '2g' | '3g' | '4g';
  readonly saveData?: boolean;
  onchange?: (this: NetworkInformation, ev: Event) => any;
}

interface NavigatorWithNetwork extends Navigator {
  readonly connection?: NetworkInformation;
  readonly mozConnection?: NetworkInformation;
  readonly webkitConnection?: NetworkInformation;
}

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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isMobileMode, setIsMobileMode] = useState<boolean | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isBackgroundLocked, setIsBackgroundLocked] = useState(false);
  const [isBackgroundDisabled, setIsBackgroundDisabled] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [isCellular, setIsCellular] = useState(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null);
  
  // Sleep Timer State
  const [sleepTimerDuration, setSleepTimerDuration] = useState<number | null>(null); // in minutes
  const [sleepTimerLeft, setSleepTimerLeft] = useState<number | null>(null); // in seconds

  const isVisible = usePageVisibility();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Wake Lock Request Logic
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setIsWakeLockActive(true);
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  // Bluetooth Connection Logic
  const connectBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
      setAudioError("Bluetooth not supported in this browser");
      return;
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true
      });

      const server = await device.gatt.connect();
      setIsBluetoothConnected(true);
      setBluetoothDeviceName(device.name || "Device");

      device.addEventListener('gattserverdisconnected', () => {
        setIsBluetoothConnected(false);
        setBluetoothDeviceName(null);
      });
    } catch (err) {
      console.error("Bluetooth connection failed:", err);
    }
  };

  const disconnectBluetooth = () => {
    setIsBluetoothConnected(false);
    setBluetoothDeviceName(null);
  };

  // Re-acquire wake lock on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Network Detection Logic
  useEffect(() => {
    const nav = navigator as NavigatorWithNetwork;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    const checkNetwork = () => {
      if (connection) {
        const cellular = connection.type === 'cellular' || (connection as any).effectiveType === '3g' || (connection as any).effectiveType === '2g';
        setIsCellular(cellular);
        if (cellular || connection.saveData) {
          setIsLowPowerMode(true);
        }
      }
    };

    checkNetwork();
    if (connection) {
      connection.onchange = checkNetwork;
    }
    return () => {
      if (connection) connection.onchange = undefined;
    };
  }, []);

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
      
      const centerY = canvas.height;
      const centerX = canvas.width / 2;
      // We divide by bufferLength to fit the whole spectrum in half the screen
      const sliceWidth = (canvas.width / 2) / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255;
        const barHeight = v * canvas.height * 0.9; 
        const hue = (i / bufferLength) * 360;
        
        // Calculate positions
        const rightX = centerX + (i * sliceWidth);
        const leftX = centerX - ((i + 1) * sliceWidth);

        // Gradient for the bar (vertical)
        const gradient = ctx.createLinearGradient(0, centerY, 0, centerY - barHeight);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 75%, 1)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 65%, 0.4)`);

        ctx.fillStyle = gradient;
        
        // Draw Right Bar (Upper half only)
        ctx.fillRect(rightX, centerY - barHeight, sliceWidth - 0.5, barHeight);
        
        // Draw Left Bar (Upper half only)
        ctx.fillRect(leftX, centerY - barHeight, sliceWidth - 0.5, barHeight);

        // Add glowing caps (Top only)
        if (barHeight > 5) {
             ctx.fillStyle = "#FFFFFF";
             ctx.shadowBlur = 20;
             ctx.shadowColor = `hsla(${hue}, 100%, 75%, 1)`;
             
             // Top caps
             ctx.fillRect(rightX, centerY - barHeight - 1, sliceWidth - 0.5, 2);
             ctx.fillRect(leftX, centerY - barHeight - 1, sliceWidth - 0.5, 2);
             
             ctx.shadowBlur = 0;
        }
      }
      
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
    // Skip if not visible
    if (!isVisible) return;

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
  }, [isVisible]);

  const sendSystemMessage = useCallback(() => {
     // Skip if not visible
    if (!isVisible) return;

    const randomMsg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
    const newMessage: QuoteData = {
      quote: randomMsg,
      author: 'LCC Hub',
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: 'system'
    };
    setCurrentMessage(newMessage);
  }, [isVisible]);

  // Message intervals
  useEffect(() => {
    fetchNewQuote(); // Initial fetch
    // Intervals removed as per user request for manual refresh
  }, []); // Empty dependency array ensures this only runs once on mount

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

  // Image rotation interval removed as per user request
  useEffect(() => {
    // Background rotation is now manual via navigation controls
  }, []);

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
    setNowPlaying(null);
    setCurrentTrack(track);
    setShowMusicMenu(false);
    
    // Explicitly load and play the new track
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      if (!isLowPowerMode) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else {
        setIsPlaying(false);
      }
    }
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
    // Use lower resolution for low power mode, or 2K/1080p for high-quality mode
    const width = isLowPowerMode ? (isMobileMode ? 600 : 1200) : (isMobileMode ? 1080 : 2560);
    return optimizeCloudinaryUrl(images[currentImageIndex].secure_url, width);
  }, [images, currentImageIndex, isMobileMode, isLowPowerMode]);

  // Preload next image
  useEffect(() => {
    if (images.length > 1) {
        const nextIndex = (currentImageIndex + 1) % images.length;
        const width = isLowPowerMode ? (isMobileMode ? 600 : 1200) : (isMobileMode ? 1080 : 2560);
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
      <div className="absolute inset-0 z-0 bg-neutral-950">
        {!isBackgroundDisabled && (
          <>
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
          </>
        )}
      </div>

      {/* Header */}
      <header className="relative z-[100] p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="opacity-90" />
          <span className="text-sm font-bold tracking-wider uppercase opacity-80 drop-shadow-sm">LCC Hub</span>
        </div>
        
        {/* Navigation Controls moved to Header */}
        <div className="flex items-center gap-4">
          {!isBackgroundDisabled && (
            <>
              <div className="flex gap-1 mr-2 hidden sm:flex">
                {images.map((_, idx) => (
                  <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-white/80' : 'w-1 bg-white/20'}`} />
                ))}
              </div>
              
              <div className="flex gap-1">
                <button onClick={prevImage} className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-black/80 transition-colors">
                  <ChevronLeft className="w-4 h-4 opacity-80" />
                </button>
                <button onClick={nextImage} className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-black/80 transition-colors">
                  <ChevronRight className="w-4 h-4 opacity-80" />
                </button>
              </div>
            </>
          )}
          
          <div className="flex gap-1">
            {/* Settings Menu */}
            <div className="relative ml-2">
              <button 
                onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
                className={`p-1.5 rounded-lg border transition-all ${showSettingsMenu ? 'bg-white/20 text-white border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-black/60 border-white/10 text-white/60 hover:bg-black/80 hover:text-white'}`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <div className={`absolute top-full right-0 mt-2 w-56 bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[110] transition-all duration-150 origin-top-right ${showSettingsMenu ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Preferences</span>
                </div>

                {/* Efficiency Mode Toggle */}
                <button 
                  onClick={() => {
                    setIsLowPowerMode(!isLowPowerMode);
                    setShowSettingsMenu(false);
                  }} 
                  className="w-full flex items-center justify-between px-5 py-4 text-[10px] font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all border-b border-white/5 uppercase tracking-wider"
                >
                  <span>Efficiency Mode</span>
                  {isLowPowerMode ? <Battery className="w-3.5 h-3.5 text-yellow-500" /> : <Zap className="w-3.5 h-3.5" />}
                </button>

                {/* Wake Lock Toggle */}
                <button 
                  onClick={() => {
                    if (isWakeLockActive) releaseWakeLock();
                    else requestWakeLock();
                    setShowSettingsMenu(false);
                  }} 
                  className="w-full flex items-center justify-between px-5 py-4 text-[10px] font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all border-b border-white/5 uppercase tracking-wider"
                >
                  <span>Keep Screen On</span>
                  {isWakeLockActive ? <Sun className="w-3.5 h-3.5 text-orange-400" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                {/* Disable Background Toggle */}
                <button 
                  onClick={() => {
                    setIsBackgroundDisabled(!isBackgroundDisabled);
                    setShowSettingsMenu(false);
                  }} 
                  className="w-full flex items-center justify-between px-5 py-4 text-[10px] font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all border-b border-white/5 uppercase tracking-wider"
                >
                  <span>Hide Background</span>
                  {isBackgroundDisabled ? <ImageOff className="w-3.5 h-3.5 text-red-400" /> : <ImageIcon className="w-3.5 h-3.5" />}
                </button>

                {/* Background Lock Toggle */}
                <button 
                  onClick={() => {
                    setIsBackgroundLocked(!isBackgroundLocked);
                    setShowSettingsMenu(false);
                  }} 
                  className={`w-full flex items-center justify-between px-5 py-4 text-[10px] font-bold transition-all uppercase tracking-wider ${isBackgroundDisabled ? 'hidden' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>Lock Background</span>
                  {isBackgroundLocked ? <Lock className="w-3.5 h-3.5 text-blue-400" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                {/* Bluetooth Toggle */}
                <button 
                  onClick={() => {
                    if (isBluetoothConnected) disconnectBluetooth();
                    else connectBluetooth();
                    setShowSettingsMenu(false);
                  }} 
                  className="w-full flex items-center justify-between px-5 py-4 text-[10px] font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all uppercase tracking-wider"
                >
                  <span>Bluetooth Device</span>
                  <Bluetooth className={`w-3.5 h-3.5 ${isBluetoothConnected ? 'text-blue-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

              {/* Main Content */}
              <main className="relative z-10 max-w-xl mx-auto px-6 h-[calc(100vh-100px)] flex flex-col">

              {/* Quote Display Area */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center z-10 overflow-hidden">
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
                 <div className="px-8 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shrink-0 max-w-full flex items-center gap-4">
                    <p className="text-xs md:text-sm font-bold tracking-widest text-white/90 uppercase break-words">
                      {currentMessage.quote}
                    </p>
                    <button 
                      onClick={sendSystemMessage} 
                      className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 transition-all text-white/60 hover:text-white hover:scale-110 active:scale-95"
                      title="New Tip"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                 </div>
              ) : (
                <>
                  <div className="relative inline-block px-8 py-2 shrink-0 max-w-full">
                     <span className="absolute -top-4 -left-2 text-6xl md:text-8xl text-white/10 font-serif leading-none select-none">“</span>
                     <p className="text-xl md:text-2xl lg:text-3xl font-medium leading-tight text-white drop-shadow-xl font-serif tracking-wide text-balance break-words">
                      {currentMessage.quote}
                     </p>
                     <span className="absolute -bottom-8 -right-2 text-6xl md:text-8xl text-white/10 font-serif leading-none select-none">”</span>
                  </div>

                  <div className="flex flex-col items-center mt-1 gap-3 opacity-90 shrink-0 pb-4">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white shadow-black drop-shadow-sm break-all">
                        {currentMessage.author}
                      </span>
                      <button 
                        onClick={fetchNewQuote} 
                        className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 transition-all text-white/60 hover:text-white hover:scale-110 active:scale-95"
                        title="New Quote"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
              </motion.div>
              )}
              </AnimatePresence>
              </div>

              {/* Player Area */}
              <div className="pb-6 pt-4 border-t border-white/5 mt-auto z-30">
              <div className="relative group rounded-[1.5rem] bg-transparent border-2 border-neutral-800 shadow-[0_15px_35px_rgba(0,0,0,0.5)] p-1">
              <div className="relative bg-transparent rounded-[1.3rem] border border-white/10 p-3">

              <div className="relative flex items-center gap-4 z-10">
              {/* Play Button - Tactile Knob Style */}
              <div className="relative">
                <button 
                  onClick={toggleAudio} 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 active:scale-95 ${
                    isPlaying 
                      ? 'bg-white border-white/20 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                      : 'bg-neutral-800 border-neutral-700 text-white/40 hover:text-white hover:border-neutral-600 shadow-lg'
                  }`}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
              </div>

              {/* Digital Display Area */}
              <div className="flex-1 min-w-0 bg-black/60 rounded-xl p-3 border border-white/5 shadow-inner relative overflow-hidden group/display">
                 {/* Audio Visualizer as Background (Clipped) */}
                 {!isLowPowerMode && (
                   <div className="absolute inset-0 pointer-events-none opacity-50">
                     <canvas 
                       ref={canvasRef} 
                       className="absolute bottom-0 inset-x-0 w-full h-full" 
                       width={400} 
                       height={60} 
                     />
                   </div>
                 )}

                 {/* Status Indicators Top Right */}
                 <div className="absolute top-2.5 right-3 flex items-center gap-2 h-2.5">
                    {isBluetoothConnected && <Bluetooth className="w-2.5 h-2.5 text-blue-500 animate-pulse" />}
                    {isWakeLockActive && <Sun className="w-2.5 h-2.5 text-orange-400" />}
                    {isCellular ? <SignalHigh className="w-2.5 h-2.5 text-white/40" /> : <Wifi className="w-2.5 h-2.5 text-white/40" />}

                    <div className="flex items-end gap-0.5 h-full ml-1">
                      {[1.5, 3, 4.5, 6, 7.5].map((h, i) => (
                        <div key={i} className={`w-0.5 bg-white ${i < 4 ? 'opacity-100' : 'opacity-20'}`} style={{ height: `${h}px` }} />
                      ))}
                    </div>
                 </div>

                 <div className="flex items-center gap-2 mb-1.5">
                   <span className="flex items-center gap-1.5 text-[7px] font-black text-red-500 tracking-[0.2em] uppercase">
                     <div className={`w-1 h-1 rounded-full bg-red-500 ${isPlaying ? 'animate-pulse' : ''}`} />
                     Live
                   </span>
                   {isLowPowerMode && (
                      <span className="flex items-center gap-1 text-[7px] font-black text-yellow-500 tracking-[0.2em] uppercase">
                        <Zap className="w-2 h-2" />
                        Eco
                      </span>
                   )}
                   {isBluetoothConnected && (
                      <span className="text-[7px] font-black text-blue-400 tracking-[0.2em] uppercase truncate max-w-[80px]">
                        {bluetoothDeviceName}
                      </span>
                   )}
                 </div>
                 <div className="font-mono space-y-0.5">
                  {nowPlaying ? (
                    <>
                      <h3 className="text-[10px] font-bold truncate text-white/90 uppercase tracking-wider leading-none">{nowPlaying.title}</h3>
                      <p className="text-[8px] font-medium text-white/40 truncate uppercase">{nowPlaying.artist}</p>
                    </>
                  ) : (
                    <h3 className="text-[10px] font-bold truncate text-white/90 uppercase tracking-widest leading-none">{currentTrack.name}</h3>
                  )}
                 </div>
              </div>
                {/* Vertical Controls Area */}
                <div className="flex flex-col gap-1.5">
                  {/* Sleep Timer */}
                  <div className="relative">
                    <button 
                      onClick={toggleSleepMenu} 
                      className={`w-9 h-9 flex items-center justify-center transition-all rounded-lg border ${sleepTimerLeft ? 'bg-white/10 border-white/20 text-white' : 'bg-neutral-800/50 border-white/5 text-white/40 hover:text-white hover:bg-neutral-800'}`}
                      title="Sleep Timer"
                    >
                      {sleepTimerLeft ? (
                        <span className="text-[9px] font-black tabular-nums">{Math.ceil(sleepTimerLeft / 60)}m</span>
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </button>
                    <div className={`absolute bottom-full right-0 mb-3 w-32 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 transition-all duration-150 origin-bottom-right ${showSleepMenu ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                      {[15, 30, 45, 60].map((min) => (
                        <button key={min} onClick={() => setSleepTimer(min)} className="w-full text-left px-4 py-2 text-[9px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all uppercase tracking-wider">
                          {min} Minutes
                        </button>
                      ))}
                      <button onClick={() => setSleepTimer(null)} className={`w-full text-left px-4 py-2 text-[9px] font-bold text-red-400 hover:bg-red-500/10 transition-all border-t border-white/5 uppercase tracking-wider ${!sleepTimerLeft ? 'hidden' : ''}`}>
                        Disable Timer
                      </button>
                    </div>
                  </div>

                  {/* Track List */}
                  <div className="relative">
                    <button 
                      onClick={toggleMusicMenu} 
                      className={`w-9 h-9 flex items-center justify-center transition-all rounded-lg border ${showMusicMenu ? 'bg-white/10 border-white/20 text-white' : 'bg-neutral-800/50 border-white/5 text-white/40 hover:text-white hover:bg-neutral-800'}`}
                    >
                      <ListMusic className="w-4 h-4" />
                    </button>
                    <div className={`absolute bottom-full right-0 mb-3 w-56 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 max-h-64 overflow-y-auto scrollbar-hide transition-all duration-150 origin-bottom-right ${showMusicMenu ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                      <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Stations</span>
                      </div>
                      {CALM_TRACKS.map((t) => (
                        <button key={t.id} onClick={() => changeTrack(t)} className={`w-full text-left px-4 py-3 text-[9px] font-bold transition-all border-b border-white/5 last:border-0 uppercase tracking-wider ${currentTrack.id === t.id ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-3">
             <span className="text-[7px] font-bold text-white/10 tracking-[0.3em] uppercase">High Fidelity Audio Receiver</span>
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

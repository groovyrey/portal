'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, AlertCircle, ChevronLeft, ChevronRight, Music, Play, Pause, ListMusic } from 'lucide-react';

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
  type?: 'audio' | 'spotify';
}

const CALM_TRACKS: MusicTrack[] = [
  { id: 'lofi-radio', name: 'Lofi Radio', url: 'https://streams.fluxfm.de/Chillhop/mp3-128/', type: 'audio' },
  { id: 'lofi-spotify', name: 'Spotify Lofi', url: 'spotify:playlist:0vvXsWCC9xrXsKd4FyS8kM', type: 'spotify' },
];

const MAX_MESSAGES = 5;

export default function StudyModePage() {
  const [images, setImages] = useState<CloudinaryResource[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [messages, setMessages] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(CALM_TRACKS[0]);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isMobileMode, setIsMobileMode] = useState<boolean | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkMode = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile !== isMobileMode) setIsMobileMode(isMobile);
    };
    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, [isMobileMode]);

  useEffect(() => {
    if (isMobileMode === null) return;
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
  }, [isMobileMode]);

  const fetchNewQuote = async () => {
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
        setMessages(prev => [...prev, newMessage].slice(-MAX_MESSAGES));
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    }
  };

  const sendSystemMessage = () => {
    const randomMsg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
    const newMessage: QuoteData = {
      quote: randomMsg,
      author: 'LCC Hub',
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, newMessage].slice(-MAX_MESSAGES));
  };

  useEffect(() => {
    fetchNewQuote();
    const quoteInterval = setInterval(fetchNewQuote, 60000);
    const systemInterval = setInterval(sendSystemMessage, 180000); // 3 minutes
    return () => {
      clearInterval(quoteInterval);
      clearInterval(systemInterval);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const nextImage = () => {
    if (images.length === 0) return;
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(nextImage, 180000);
      return () => clearInterval(interval);
    }
  }, [images]);

  const toggleAudio = () => {
    if (currentTrack.type === 'spotify') return;
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
    if (track.type === 'spotify') {
        const id = track.url.split(':').pop();
        setSpotifyEmbedUrl(`https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`);
        setIsPlaying(true);
        if (audioRef.current) audioRef.current.pause();
    } else {
        setSpotifyEmbedUrl(null);
        setIsPlaying(false);
    }
    setCurrentTrack(track);
    setShowMusicMenu(false);
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  const imageVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 0.95 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? '100%' : '-100%', opacity: 0 })
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white font-sans selection:bg-white/20">
      {currentTrack.type !== 'spotify' && (
        <audio ref={audioRef} loop autoPlay preload="auto" key={currentTrack.url} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onError={() => setIsPlaying(false)}>
          <source src={currentTrack.url} type="audio/mpeg" />
        </audio>
      )}

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false} custom={direction}>
          {images.length > 0 && (
            <motion.div key={images[currentImageIndex]?.public_id} custom={direction} variants={imageVariants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "tween", duration: 0.5 }, opacity: { duration: 0.5 } }} className="absolute inset-0 h-full w-full">
              <Image src={images[currentImageIndex]?.secure_url || ''} alt="Background" fill className="object-cover" priority unoptimized />
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
          <div className="flex gap-1 mr-2 hidden sm:flex">
            {images.map((_, idx) => (
              <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-white/80' : 'w-1 bg-white/20'}`} />
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={prevImage} className="p-1.5 rounded-lg bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
              <ChevronLeft className="w-4 h-4 opacity-80" />
            </button>
            <button onClick={nextImage} className="p-1.5 rounded-lg bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors">
              <ChevronRight className="w-4 h-4 opacity-80" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 h-[calc(100vh-140px)] flex flex-col">
        
        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-8 space-y-6 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.type === 'system' ? 'items-center py-4' : 'items-start'} space-y-1`}>
                {msg.type === 'system' ? (
                  <div className="max-w-[80%] text-center px-6 py-2 bg-white/5 backdrop-blur-sm border border-white/5 rounded-full">
                    <p className="text-[10px] md:text-xs font-medium tracking-wide text-white/40 uppercase">
                      {msg.quote}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 opacity-60 ml-1">
                      <span className="text-[10px] font-bold uppercase tracking-tight">{msg.author}</span>
                      <span className="text-[9px]">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="w-fit max-w-[85%] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-none p-4 shadow-xl">
                      <p className="text-sm md:text-base leading-relaxed text-white break-words whitespace-pre-wrap">“{msg.quote}”</p>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Player Area */}
        <div className="pb-10 pt-4 border-t border-white/10 space-y-4">
          {spotifyEmbedUrl && (
            <div className="rounded-xl overflow-hidden border border-white/20 shadow-2xl">
              <iframe src={spotifyEmbedUrl} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
            </div>
          )}

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
            <button onClick={toggleAudio} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-0.5">Vibe</p>
              <h3 className="text-sm font-semibold truncate opacity-90">{currentTrack.name}</h3>
            </div>

            <div className="relative">
              <button onClick={() => setShowMusicMenu(!showMusicMenu)} className="p-2 opacity-60 hover:opacity-100 transition-opacity">
                <ListMusic className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showMusicMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full right-0 mb-2 w-48 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    {CALM_TRACKS.map((t) => (
                      <button key={t.id} onClick={() => changeTrack(t)} className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors ${currentTrack.id === t.id ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}>{t.name}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {audioError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 text-[9px] font-bold uppercase tracking-widest opacity-70 flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
          <AlertCircle className="w-3 h-3" />
          {audioError}
        </div>
      )}
    </div>
  );
}

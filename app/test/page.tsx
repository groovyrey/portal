'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, AlertCircle, Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
}

interface QuoteData {
  quote: string;
  author: string;
}

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

export default function TestPage() {
  const [images, setImages] = useState<CloudinaryResource[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(CALM_TRACKS[0]);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Spotify Embed State
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const imgResponse = await fetch('/api/cloudinary/images');
        const imgData = await imgResponse.json();
        setImages(imgData);

        const quoteResponse = await fetch('/api/quotes');
        const quoteData = await quoteResponse.json();
        if (quoteData && quoteData.quote) {
          setQuote(quoteData);
        } else {
          setQuote({
            quote: "Education is the most powerful weapon which you can use to change the world.",
            author: "Nelson Mandela"
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);


  const handleAudioError = () => {
    if (currentTrack.type === 'spotify') return;
    const error = audioRef.current?.error;
    console.error("Audio Error Code:", error?.code);
    let message = "Audio unavailable";
    if (error?.code === 1) message = "Playback aborted";
    if (error?.code === 2) message = "Network error";
    if (error?.code === 3) message = "Decoding error";
    if (error?.code === 4) message = "Source not supported";
    setAudioError(message);
    setIsPlaying(false);
  };

  const toggleAudio = () => {
    if (currentTrack.type === 'spotify') {
      // For iframe, we can't control play/pause programmatically easily without SDK
      // So we just toggle the view or maybe show a message
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setAudioError(null);
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error("Playback failed:", error);
            setAudioError("Tap again to play");
            setIsPlaying(false);
          });
      }
    }
  };

  const changeTrack = (track: MusicTrack) => {
    if (track.type === 'spotify') {
        // Extract ID from spotify:playlist:ID or https://open.spotify.com/playlist/ID
        const id = track.url.split(':').pop();
        setSpotifyEmbedUrl(`https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`);
        setIsPlaying(true); // Assume playing for UI state
        if (audioRef.current) audioRef.current.pause();
    } else {
        setSpotifyEmbedUrl(null);
        setIsPlaying(false); // Let audio tag handle this
    }

    setCurrentTrack(track);
    setAudioError(null);
    setShowMusicMenu(false);
  };

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 180000); // Change image every 3 minutes
      return () => clearInterval(interval);
    }
  }, [images]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {currentTrack.type !== 'spotify' && (
        <audio 
          ref={audioRef}
          loop
          autoPlay
          preload="auto"
          key={currentTrack.url}
          onPlay={() => { setIsPlaying(true); setAudioError(null); }}
          onPause={() => setIsPlaying(false)}
          onError={handleAudioError}
        >
          <source src={currentTrack.url} type="audio/mpeg" />
        </audio>
      )}

      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {images.length > 0 && (
            <motion.div
              key={images[currentImageIndex].public_id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.7, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="relative h-full w-full"
            >
              <Image
                src={images[currentImageIndex].secure_url}
                alt="Background"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60 z-1" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col px-6 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="pt-12 md:pt-16 flex flex-col items-center"
        >
          <div className="relative h-12 w-12 md:h-16 md:w-16 mx-auto">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              priority
            />
          </div>
          <h1 className="mt-3 text-xs md:text-sm font-black tracking-[0.4em] text-white uppercase opacity-60">
            LCC HUB
          </h1>
        </motion.div>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          {quote && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="max-w-4xl w-full px-4 md:px-0 space-y-4 md:space-y-6"
            >
              <p className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic text-white leading-tight tracking-tight drop-shadow-2xl">
                "{quote.quote}"
              </p>
              <div className="flex items-center justify-center gap-3 md:gap-4 text-primary">
                <div className="h-[1px] w-6 md:w-8 bg-current opacity-50" />
                <p className="text-[10px] sm:text-xs md:text-base font-black uppercase tracking-[0.2em]">
                  {quote.author}
                </p>
                <div className="h-[1px] w-6 md:w-8 bg-current opacity-50" />
              </div>
            </motion.div>
          )}

          {currentTrack.type === 'spotify' && spotifyEmbedUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 md:mt-12 w-full max-w-[90%] sm:max-w-md mx-auto bg-black/40 backdrop-blur-xl p-3 md:p-4 rounded-[2rem] border border-white/10 shadow-2xl"
            >
              <iframe 
                style={{ borderRadius: '1.25rem' }} 
                src={spotifyEmbedUrl} 
                width="100%" 
                height="152" 
                frameBorder="0" 
                allowFullScreen 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-6 right-6 md:top-16 md:right-12 z-20 flex flex-col items-end gap-2">
        {audioError && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-md"
          >
            <AlertCircle className="h-3 w-3 text-red-400" />
            <p className="text-[10px] font-bold uppercase tracking-tight text-red-400">{audioError}</p>
          </motion.div>
        )}
        
        <div className="flex items-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all overflow-hidden shadow-2xl">
          <button
            onClick={toggleAudio}
            className={`p-2.5 md:p-3 transition-colors ${isPlaying ? 'text-primary' : 'text-white'}`}
          >
            {isPlaying ? (
              <div className="flex items-center gap-1 h-4 md:h-5 px-1">
                {[0.2, 0.4, 0.6].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 16, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay }}
                    className="w-0.5 md:w-1 bg-current rounded-full"
                  />
                ))}
              </div>
            ) : (
              <VolumeX className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </button>
          
          <div className="h-5 md:h-6 w-[1px] bg-white/10" />
          
          <button
            onClick={() => setShowMusicMenu(!showMusicMenu)}
            className="pl-2.5 pr-3.5 md:pl-3 md:pr-4 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 md:gap-2"
          >
            <span className="max-w-[80px] sm:max-w-none truncate">{currentTrack.name}</span>
            <Volume2 className={`h-3 w-3 transition-transform ${showMusicMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showMusicMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mt-2 w-48 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl p-2 shadow-2xl"
            >
              {CALM_TRACKS.map((track) => (
                <button
                  key={track.id}
                  onClick={() => changeTrack(track)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    currentTrack.id === track.id ? 'bg-primary text-primary-foreground' : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  {track.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {images.map((_, idx) => (
          <div 
            key={idx}
            className={`h-1 transition-all duration-500 rounded-full ${idx === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}

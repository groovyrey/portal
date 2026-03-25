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
  { id: 'lofi-spotify', name: 'Spotify Lofi', url: 'spotify:playlist:0vvXsWCC9xrXsKd4FyS8kM', type: 'spotify' },
  { id: 'lofi', name: 'Lofi Chill', url: `/api/audio/proxy?url=${encodeURIComponent('https://www.orangefreesounds.com/wp-content/uploads/2023/01/Lofi-music-loop-120-bpm.mp3')}`, type: 'audio' },
  { id: 'piano', name: 'Ambient Piano', url: `/api/audio/proxy?url=${encodeURIComponent('https://incompetech.com/music/royalty-free/mp3-royalty-free/Gymnopedie%20No.%201.mp3')}`, type: 'audio' },
  { id: 'rain', name: 'Soft Rain', url: `/api/audio/proxy?url=${encodeURIComponent('https://www.orangefreesounds.com/wp-content/uploads/2018/04/Gentle-rain-loop.mp3')}`, type: 'audio' },
  { id: 'ocean', name: 'Ocean Waves', url: `/api/audio/proxy?url=${encodeURIComponent('https://www.orangefreesounds.com/wp-content/uploads/2017/01/Ocean-waves-loop.mp3')}`, type: 'audio' },
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

  // Spotify Web Playback SDK State
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string | null>(null);
  const [spotifyState, setSpotifyState] = useState<any>(null);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [showSpotifyConnect, setShowSpotifyConnect] = useState(false);

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

        // Fetch Spotify Token
        const spotifyRes = await fetch('/api/spotify/token');
        if (spotifyRes.ok) {
          const data = await spotifyRes.json();
          setSpotifyToken(data.access_token);
        } else if (spotifyRes.status === 404) {
          // No spotify connected
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Spotify SDK Loading
  useEffect(() => {
    if (!spotifyToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).Spotify.Player({
        name: 'LCC Hub Player',
        getOAuthToken: (cb: any) => { cb(spotifyToken); },
        volume: 0.5
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setSpotifyDeviceId(device_id);
        setIsSpotifyReady(true);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => { console.error(message); });
      player.addListener('authentication_error', ({ message }: { message: string }) => { console.error(message); });
      player.addListener('account_error', ({ message }: { message: string }) => { console.error(message); });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setSpotifyState(state);
        setIsPlaying(!state.paused);
      });

      player.connect();
      setSpotifyPlayer(player);
    };

    return () => {
      if (spotifyPlayer) {
        spotifyPlayer.disconnect();
      }
    };
  }, [spotifyToken]);

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
      if (!spotifyToken) {
        setShowSpotifyConnect(true);
        return;
      }
      if (spotifyPlayer) {
        spotifyPlayer.togglePlay();
      }
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

  const playSpotifyTrack = async (uri: string) => {
    if (!spotifyToken || !spotifyDeviceId) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ context_uri: uri }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyToken}`
        },
      });
    } catch (e) {
      console.error('Failed to play Spotify track:', e);
    }
  };

  const changeTrack = (track: MusicTrack) => {
    // If switching from/to Spotify, handle it
    if (currentTrack.type === 'spotify' && track.type !== 'spotify') {
      if (spotifyPlayer) spotifyPlayer.pause();
    } else if (currentTrack.type !== 'spotify' && track.type === 'spotify') {
      if (audioRef.current) audioRef.current.pause();
      if (spotifyToken && spotifyDeviceId) {
        playSpotifyTrack(track.url);
      } else if (!spotifyToken) {
        setShowSpotifyConnect(true);
      }
    } else if (track.type === 'spotify' && spotifyToken && spotifyDeviceId) {
      playSpotifyTrack(track.url);
    }

    setCurrentTrack(track);
    setIsPlaying(track.type === 'spotify' ? true : false);
    setAudioError(null);
    setShowMusicMenu(false);
  };

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 8000);
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

  const spotifyTrack = spotifyState?.track_window?.current_track;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {currentTrack.type !== 'spotify' && (
        <audio 
          ref={audioRef}
          loop
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

        <div className="flex-1 flex flex-col items-center justify-center">
          {quote && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="max-w-3xl space-y-6"
            >
              <p className="text-2xl md:text-4xl font-black italic text-white leading-tight tracking-tight drop-shadow-lg">
                "{quote.quote}"
              </p>
              <div className="flex items-center justify-center gap-4 text-primary">
                <div className="h-[1px] w-8 bg-current opacity-50" />
                <p className="text-sm md:text-base font-black uppercase tracking-[0.2em]">
                  {quote.author}
                </p>
                <div className="h-[1px] w-8 bg-current opacity-50" />
              </div>
            </motion.div>
          )}

          {currentTrack.type === 'spotify' && isPlaying && spotifyTrack && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex flex-col items-center gap-4 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl"
            >
              <div className="relative h-24 w-24 rounded-xl overflow-hidden shadow-xl">
                <Image 
                  src={spotifyTrack.album.images[0].url} 
                  alt={spotifyTrack.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight leading-none">{spotifyTrack.name}</h3>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{spotifyTrack.artists.map((a: any) => a.name).join(', ')}</p>
              </div>
              
              <div className="flex items-center gap-6 mt-2">
                <button onClick={() => spotifyPlayer?.previousTrack()} className="text-white/70 hover:text-white transition-colors">
                  <SkipBack className="h-5 w-5 fill-current" />
                </button>
                <button 
                  onClick={() => spotifyPlayer?.togglePlay()} 
                  className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current translate-x-0.5" />}
                </button>
                <button onClick={() => spotifyPlayer?.nextTrack()} className="text-white/70 hover:text-white transition-colors">
                  <SkipForward className="h-5 w-5 fill-current" />
                </button>
              </div>
            </motion.div>
          )}

          {!spotifyToken && currentTrack.type === 'spotify' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => window.location.href = '/api/spotify/login'}
              className="mt-8 flex items-center gap-3 px-6 py-3 bg-[#1DB954] text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
            >
              <Music className="h-4 w-4" />
              Connect Spotify Premium
            </motion.button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-12 right-6 md:top-16 md:right-12 z-20 flex flex-col items-end gap-2">
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
        
        <div className="flex items-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all overflow-hidden shadow-2xl">
          <button
            onClick={toggleAudio}
            className={`p-3 transition-colors ${isPlaying ? 'text-primary' : 'text-white'}`}
          >
            {isPlaying ? (
              <div className="flex items-center gap-1 h-5 px-1">
                {[0.2, 0.4, 0.6].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 16, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay }}
                    className="w-1 bg-current rounded-full"
                  />
                ))}
              </div>
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </button>
          
          <div className="h-6 w-[1px] bg-white/10" />
          
          <button
            onClick={() => setShowMusicMenu(!showMusicMenu)}
            className="pl-3 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <span className="hidden md:inline">{currentTrack.name}</span>
            <Volume2 className={`h-4 w-4 md:h-3 md:w-3 transition-transform ${showMusicMenu ? 'rotate-180' : ''}`} />
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

      {/* Spotify Connect Modal */}
      <AnimatePresence>
        {showSpotifyConnect && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 p-8 rounded-[32px] border border-white/10 max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="h-20 w-20 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(29,185,84,0.3)]">
                <Music className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-tight">Spotify Premium Required</h2>
                <p className="text-sm text-white/60 font-medium leading-relaxed">
                  The Web Playback SDK requires a Spotify Premium account. Connect your account to enable high-quality playback.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.href = '/api/spotify/login'}
                  className="w-full py-4 bg-[#1DB954] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Connect Account
                </button>
                <button
                  onClick={() => setShowSpotifyConnect(false)}
                  className="w-full py-4 bg-white/5 text-white/60 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

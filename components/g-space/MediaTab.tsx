'use client';

import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  PlayCircle, 
  RefreshCw, 
  Youtube, 
  X, 
  GraduationCap, 
  DatabaseZap, 
  ClipboardList, 
  FileText,
  MessageSquare,
  Send,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { YouTubeVideo, ChatMessage } from '@/types/g-space';
import { useState, useRef, useEffect } from 'react';

interface MediaTabProps {
  mediaMode: 'selection' | 'alone' | 'together';
  setMediaMode: (mode: 'selection' | 'alone' | 'together') => void;
  videoQuery: string;
  setVideoQuery: (val: string) => void;
  fetchVideos: (query: string) => void;
  isFetching: boolean;
  linkedEmail: string | null;
  setActiveTab: (tab: any) => void;
  activeMediaSubTab: string;
  setActiveMediaSubTab: (tab: string) => void;
  openVideos: YouTubeVideo[];
  handleCloseVideoTab: (e: React.MouseEvent, id: string) => void;
  videos: YouTubeVideo[];
  handleVideoClick: (video: YouTubeVideo) => void;
  toggleWatchMode: (videoId: string, mode: 'alone' | 'together') => void;
  watchMode: Record<string, 'alone' | 'together'>;
  lobbyParticipants: Record<string, number>;
  activeLobbies: any[];
  broadcastPlayback: (videoId: string, action: 'play' | 'pause' | 'seek', time?: number) => void;
  lobbyMessages: Record<string, ChatMessage[]>;
  sendLobbyMessage: (videoId: string, text: string) => void;
  student: any;
  videoSummaries: Record<string, string>;
  copyToClipboard: (text: string) => void;
  saveSummaryToTasks: (video: YouTubeVideo) => void;
  summarizeVideo: (video: YouTubeVideo) => void;
  isSummarizing: boolean;
  timestamps: Record<string, { time: string, label: string }[]>;
  setIsViewingTimestamps: (id: string | null) => void;
  seekToTimestamp: (videoId: string, timeStr: string) => void;
}

function formatDuration(iso: string | undefined): string {
  if (!iso) return '';
  const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';
  const h = match[1]?.replace('H', '') || 0;
  const m = match[2]?.replace('M', '') || 0;
  const s = match[3]?.replace('S', '') || 0;
  return `${h ? h + ':' : ''}${m.toString().padStart(h ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatViews(count: string | undefined): string {
  if (!count) return '';
  const n = parseInt(count);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M views';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K views';
  return n + ' views';
}

export default function MediaTab({
  mediaMode,
  setMediaMode,
  videoQuery,
  setVideoQuery,
  fetchVideos,
  isFetching,
  linkedEmail,
  setActiveTab,
  activeMediaSubTab,
  setActiveMediaSubTab,
  openVideos,
  handleCloseVideoTab,
  videos,
  handleVideoClick,
  toggleWatchMode,
  watchMode,
  lobbyParticipants,
  activeLobbies,
  broadcastPlayback,
  lobbyMessages,
  sendLobbyMessage,
  student,
  videoSummaries,
  copyToClipboard,
  saveSummaryToTasks,
  summarizeVideo,
  isSummarizing,
  timestamps,
  setIsViewingTimestamps,
  seekToTimestamp
}: MediaTabProps) {
  const [sidebarTab, setSidebarTab] = useState<Record<string, 'ai' | 'chat'>>({});
  const [chatInput, setChatInput] = useState<Record<string, string>>({});
  const chatEndRef = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Scroll to bottom when messages change
    Object.keys(lobbyMessages).forEach(videoId => {
      chatEndRef.current[videoId]?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [lobbyMessages]);

  const handleSendMessage = (videoId: string) => {
    const text = chatInput[videoId];
    if (!text?.trim()) return;
    sendLobbyMessage(videoId, text);
    setChatInput(prev => ({ ...prev, [videoId]: '' }));
  };

  return (
    <motion.div 
      key="media-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          {mediaMode !== 'selection' && (
            <button 
              onClick={() => {
                setMediaMode('selection');
                setActiveMediaSubTab('search');
              }}
              className="p-2 hover:bg-muted rounded-lg transition-all border border-border/50 group"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight">Academy Media</h2>
            <p className="text-xs text-muted-foreground font-medium">
              {mediaMode === 'selection' ? 'Select your study mode' : 
               mediaMode === 'alone' ? 'Personal study session' : 'Collaborative study lobby'}
            </p>
          </div>
        </div>

        {mediaMode !== 'selection' && activeMediaSubTab === 'search' && (
          <div className="relative w-full max-w-sm group">
            <input 
              type="text" 
              placeholder="Search lectures & tutorials..."
              value={videoQuery}
              onChange={(e) => setVideoQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchVideos(videoQuery)}
              className="w-full bg-muted/30 border border-border/50 rounded-lg pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {isFetching ? (
              <RefreshCw className="h-4 w-4 text-primary absolute left-4 top-3 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground absolute left-4 top-3 group-focus-within:text-primary transition-colors" />
            )}
          </div>
        )}
      </div>

      {mediaMode === 'selection' ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full px-4">
            <motion.button
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMediaMode('alone')}
              className="group relative p-8 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-center flex flex-col items-center shadow-sm hover:shadow-xl"
            >
              <div className="h-14 w-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <PlayCircle className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold mb-2">Focused Study</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[240px]">
                Private learning with AI-powered summaries and personal timestamps.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Enter Session <ChevronRight className="h-3 w-3" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!linkedEmail) {
                  setActiveTab('sync');
                  return;
                }
                setMediaMode('together');
              }}
              className="group relative p-8 rounded-xl bg-foreground text-background border border-foreground transition-all text-center flex flex-col items-center shadow-lg"
            >
              <div className="h-14 w-14 bg-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Live Lobby</h3>
              <p className="text-xs text-background/60 font-medium leading-relaxed max-w-[240px]">
                Study in real-time with peers. Sync playback and share insights instantly.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Join Peers <ChevronRight className="h-3 w-3" />
              </div>
            </motion.button>
          </div>
        </div>
      ) : (
        <>
          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-muted/20 border border-border/50 rounded-xl w-fit max-w-full overflow-x-auto no-scrollbar shadow-sm">
            <button
              onClick={() => setActiveMediaSubTab('search')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeMediaSubTab === 'search' 
                  ? 'bg-background text-primary shadow-sm ring-1 ring-border/50' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mediaMode === 'alone' ? <Search className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {mediaMode === 'alone' ? 'Library' : 'Global Lobbies'}
            </button>
            {openVideos.map((video) => (
              <button
                key={video.id.videoId}
                onClick={() => setActiveMediaSubTab(video.id.videoId)}
                className={`flex items-center gap-3 px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap group relative shrink-0 ${
                  activeMediaSubTab === video.id.videoId 
                    ? 'bg-background text-primary shadow-sm ring-1 ring-border/50' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Youtube className="h-3.5 w-3.5 text-[#ff0000]" />
                <span className="max-w-[180px] truncate">{video.snippet.title}</span>
                <X 
                  className="h-3 w-3 hover:bg-rose-500 hover:text-white rounded-md transition-all ml-1" 
                  onClick={(e) => handleCloseVideoTab(e, video.id.videoId)}
                />
              </button>
            ))}
          </div>

          {/* Search / Lobby View */}
          <div className={activeMediaSubTab === 'search' ? 'flex-1 overflow-y-auto custom-scrollbar pt-2' : 'hidden'}>
            {mediaMode === 'together' && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold mb-1">Active Study Lobbies</h3>
                    <p className="text-[11px] text-muted-foreground">Join a live session with other students.</p>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{activeLobbies.length} Lobbies Live</span>
                  </div>
                </div>

                {activeLobbies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeLobbies.map((lobby) => (
                      <motion.div 
                        key={lobby.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-card border border-border/50 rounded-lg overflow-hidden hover:border-primary/40 transition-all flex h-28"
                      >
                        <div className="w-40 shrink-0 relative">
                          <img 
                            src={lobby.videoThumbnail} 
                            alt={lobby.videoTitle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary rounded text-[8px] font-bold text-white flex items-center gap-1">
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                            {lobby.participants} LIVE
                          </div>
                        </div>
                        <div className="p-3 flex flex-col justify-between min-w-0 flex-1">
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-bold truncate group-hover:text-primary transition-colors">
                              {lobby.videoTitle}
                            </h4>
                            <p className="text-[9px] text-muted-foreground truncate mt-0.5">{lobby.channelTitle}</p>
                          </div>
                          <button 
                            onClick={() => {
                              handleVideoClick({ 
                                id: { videoId: lobby.videoId }, 
                                snippet: { 
                                  title: lobby.videoTitle, 
                                  thumbnails: { medium: { url: lobby.videoThumbnail } },
                                  channelTitle: lobby.channelTitle
                                } 
                              } as any);
                              toggleWatchMode(lobby.videoId, 'together');
                            }}
                            className="w-full py-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary text-[9px] font-bold uppercase tracking-wider rounded transition-all"
                          >
                            Join Session
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center bg-muted/20 rounded-xl border border-dashed border-border/50">
                    <div className="h-12 w-12 bg-muted/40 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin-slow" />
                    </div>
                    <h3 className="text-xs font-bold text-muted-foreground mb-1">No Active Lobbies</h3>
                    <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto">
                      Start your own shared session by searching for any educational content below.
                    </p>
                  </div>
                )}
                
                <div className="mt-10 h-px bg-border/50 w-full relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-background text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Search for More
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
              {videos.length > 0 ? (
                videos.map((video) => (
                  <div 
                    key={video.id.videoId}
                    onClick={() => {
                      handleVideoClick(video);
                      toggleWatchMode(video.id.videoId, mediaMode as 'alone' | 'together');
                    }}
                    className="group bg-card border border-border/50 rounded-lg overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer flex flex-col"
                  >
                    <div className="aspect-video bg-black relative overflow-hidden">
                      <img 
                        src={video.snippet.thumbnails.medium.url} 
                        alt={video.snippet.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300">
                          <PlayCircle className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      {video.contentDetails?.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                          {formatDuration(video.contentDetails.duration)}
                        </div>
                      )}
                      {mediaMode === 'together' && (
                        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[8px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                          <div className="h-1 w-1 rounded-lg bg-white animate-pulse" />
                          LIVE
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1">
                      <h4 className="text-xs font-bold leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                        {video.snippet.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">
                          {video.snippet.channelTitle}
                        </span>
                        {video.statistics?.viewCount && (
                          <span className="text-[10px] text-muted-foreground/60">
                            • {formatViews(video.statistics.viewCount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-muted/10 border border-dashed border-border rounded-xl">
                  {isFetching ? (
                    <>
                      <RefreshCw className="h-10 w-10 text-primary/40 mx-auto mb-4 animate-spin" />
                      <h3 className="text-sm font-bold text-muted-foreground">Searching Academy...</h3>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">We're finding the best lectures for you.</p>
                    </>
                  ) : (
                    <>
                      <Youtube className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-muted-foreground">Find Study Content</h3>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">Search for any lecture, tutorial, or documentary.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Player View */}
          {openVideos.map((video) => (
            <div 
              key={video.id.videoId} 
              className={activeMediaSubTab === video.id.videoId ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : 'hidden'}
            >
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm">
                  <div className="aspect-video bg-black">
                    <iframe 
                      id={`yt-player-${video.id.videoId}`}
                      src={`https://www.youtube.com/embed/${video.id.videoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&rel=0&modestbranding=1`}
                      title={video.snippet.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold leading-tight mb-3">{video.snippet.title}</h3>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                          <Youtube className="h-4 w-4 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{video.snippet.channelTitle}</p>
                          <p className="text-[10px] text-muted-foreground">{video.statistics?.viewCount ? formatViews(video.statistics.viewCount) : 'Educational content'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-lg border border-border/50">
                        <button 
                          onClick={() => toggleWatchMode(video.id.videoId, 'alone')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            watchMode[video.id.videoId] !== 'together' 
                              ? 'bg-background text-foreground shadow-sm border border-border/50' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Private
                        </button>
                        <button 
                          onClick={() => toggleWatchMode(video.id.videoId, 'together')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${
                            watchMode[video.id.videoId] === 'together' 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {watchMode[video.id.videoId] === 'together' && <div className="h-1.5 w-1.5 rounded-lg bg-white animate-pulse" />}
                          Shared Lobby
                        </button>
                      </div>
                    </div>

                    {watchMode[video.id.videoId] === 'together' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-6 w-6 rounded-lg border-2 border-background bg-muted flex items-center justify-center">
                                <div className="h-full w-full bg-primary/20 rounded-lg" />
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-primary">
                            {lobbyParticipants[video.id.videoId] || 1} studying together
                          </span>
                        </div>
                        <button 
                          onClick={() => broadcastPlayback(video.id.videoId, 'seek', 0)}
                          className="px-3 py-1 bg-background border border-primary/20 rounded-md text-[9px] font-bold text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                        >
                          Sync
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="bg-card border border-border/50 rounded-lg flex flex-col h-[500px] lg:h-full lg:max-h-[600px] xl:max-h-[800px] shadow-sm relative overflow-hidden">
                  <div className="border-b border-border/50 bg-muted/10 shrink-0">
                    <div className="flex items-center p-1.5 gap-1">
                      <button 
                        onClick={() => setSidebarTab(prev => ({ ...prev, [video.id.videoId]: 'ai' }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                          (sidebarTab[video.id.videoId] || 'ai') === 'ai' 
                            ? 'bg-background text-primary shadow-sm ring-1 ring-border/10' 
                            : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <DatabaseZap className="h-3.5 w-3.5" />
                        AI Studio
                      </button>
                      {watchMode[video.id.videoId] === 'together' && (
                        <button 
                          onClick={() => setSidebarTab(prev => ({ ...prev, [video.id.videoId]: 'chat' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all relative ${
                            sidebarTab[video.id.videoId] === 'chat' 
                              ? 'bg-background text-primary shadow-sm ring-1 ring-border/10' 
                              : 'text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Live Chat
                          {(lobbyMessages[video.id.videoId]?.length || 0) > 0 && sidebarTab[video.id.videoId] !== 'chat' && (
                            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sidebar Content */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <AnimatePresence mode="wait">
                      {(sidebarTab[video.id.videoId] || 'ai') === 'ai' ? (
                        <motion.div 
                          key="ai-content"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="p-5 space-y-6"
                        >
                          {/* AI Content (Keep existing code) */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <DatabaseZap className="h-4 w-4 text-primary" />
                              </div>
                              <h4 className="text-xs font-bold uppercase tracking-wider">Research Summary</h4>
                            </div>
                            {videoSummaries[video.id.videoId] && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => copyToClipboard(videoSummaries[video.id.videoId])}
                                  className="p-1.5 hover:bg-muted rounded-md transition-all text-muted-foreground"
                                  title="Copy"
                                >
                                  <ClipboardList className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => saveSummaryToTasks(video)}
                                  className="p-1.5 hover:bg-muted rounded-md transition-all text-muted-foreground"
                                  title="Save to Tasks"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {videoSummaries[video.id.videoId] ? (
                            <div className="prose prose-invert max-w-none">
                              <div className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-medium">
                                {videoSummaries[video.id.videoId]}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                  Use our AI to extract key insights, formulas, and study points from this lecture automatically.
                                </p>
                              </div>

                              {timestamps[video.id.videoId]?.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chapters</h5>
                                    <button 
                                      onClick={() => setIsViewingTimestamps(video.id.videoId)}
                                      className="text-[9px] font-bold text-primary hover:underline"
                                    >
                                      View All
                                    </button>
                                  </div>
                                  <div className="space-y-1.5">
                                    {timestamps[video.id.videoId].slice(0, 5).map((ts, i) => (
                                      <button 
                                        key={i} 
                                        onClick={() => seekToTimestamp(video.id.videoId, ts.time)}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all text-left border border-transparent hover:border-border/50 group/ts"
                                      >
                                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg group-hover/ts:bg-primary group-hover/ts:text-white transition-colors">{ts.time}</span>
                                        <span className="text-[10px] font-medium text-muted-foreground truncate group-hover/ts:text-foreground">{ts.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="chat-content"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex flex-col h-full overflow-hidden"
                        >
                          <div className="p-4 border-b border-border/50 bg-muted/5 shrink-0">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lobby Chat</h4>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[300px]">
                            {lobbyMessages[video.id.videoId]?.length ? (
                              lobbyMessages[video.id.videoId].map((msg) => (
                                <div 
                                  key={msg.id} 
                                  className={`flex flex-col ${msg.senderId === student?.id ? 'items-end' : 'items-start'}`}
                                >
                                  <div className="flex items-center gap-1.5 mb-1 px-1">
                                    <span className="text-[9px] font-bold text-muted-foreground">{msg.senderName}</span>
                                    <span className="text-[8px] text-muted-foreground/40">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className={`max-w-[85%] px-3 py-2 rounded-lg text-[11px] font-medium leading-relaxed ${
                                    msg.senderId === student?.id 
                                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm' 
                                      : 'bg-muted/50 border border-border/50 rounded-tl-none'
                                  }`}>
                                    {msg.text}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="h-10 w-10 bg-muted/30 rounded-lg flex items-center justify-center mb-3">
                                  <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
                                </div>
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No messages yet</h5>
                                <p className="text-[9px] text-muted-foreground/60 mt-1">Start a conversation with your study buddies!</p>
                              </div>
                            )}
                            <div ref={el => { chatEndRef.current[video.id.videoId] = el; }} />
                          </div>

                          <div className="p-4 border-t border-border/50 bg-muted/5 shrink-0">
                            <div className="relative">
                              <input 
                                type="text"
                                placeholder="Type a message..."
                                value={chatInput[video.id.videoId] || ''}
                                onChange={(e) => setChatInput(prev => ({ ...prev, [video.id.videoId]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(video.id.videoId)}
                                className="w-full bg-background border border-border/50 rounded-lg pl-3 pr-10 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                              />
                              <button 
                                onClick={() => handleSendMessage(video.id.videoId)}
                                disabled={!chatInput[video.id.videoId]?.trim()}
                                className="absolute right-1.5 top-1.5 p-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 active:scale-90 transition-all disabled:opacity-50"
                              >
                                <Send className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {(sidebarTab[video.id.videoId] || 'ai') === 'ai' && (
                    <div className="p-5 border-t border-border/50 shrink-0">
                      <button 
                        onClick={() => summarizeVideo(video)}
                        disabled={isSummarizing || !!videoSummaries[video.id.videoId]}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSummarizing ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <DatabaseZap className="h-3.5 w-3.5" />
                        )}
                        {videoSummaries[video.id.videoId] ? 'Summary Ready' : 'Analyze with AI'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </motion.div>
  );
}

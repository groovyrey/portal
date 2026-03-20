'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Volume2, 
  Zap, 
  Shield, 
  Sparkles,
  History,
  Info,
  CheckCircle2,
  Mic,
  MicOff,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Student } from '@/types';
import { toast } from 'sonner';

interface AssistantTabProps {
  student: Student;
  updateSettings: (newSettings: any) => Promise<void>;
}

export default function AssistantTab({ student, updateSettings }: AssistantTabProps) {
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((status) => {
          setMicPermission(status.state as any);
          status.onchange = () => {
            setMicPermission(status.state as any);
          };
        })
        .catch(() => {
          // Fallback if query fails
        });
    }
  }, []);

  const requestMicPermission = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Microphone access is only available in secure contexts (HTTPS or localhost).");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      toast.success('Microphone access granted');
    } catch (err) {
      setMicPermission('denied');
      toast.error('Microphone access denied');
    }
  };

  const assistantSettings = student?.settings?.assistant || {
    autoSpeak: false,
    voiceModel: 'aura-helios-en',
    saveHistory: true,
    showThinkingProcess: true,
    contextAwareness: true
  };

  const handleToggle = (key: keyof typeof assistantSettings) => {
    const newAssistantSettings = {
      ...assistantSettings,
      [key]: !assistantSettings[key]
    };
    const newFullSettings = {
      ...student?.settings,
      assistant: newAssistantSettings
    };
    updateSettings(newFullSettings);
  };

  const setVoiceModel = (model: string) => {
    const newAssistantSettings = {
      ...assistantSettings,
      voiceModel: model
    };
    const newFullSettings = {
      ...student?.settings,
      assistant: newAssistantSettings
    };
    updateSettings(newFullSettings);
  };

  const voices = [
    { id: 'aura-helios-en', name: 'Helios', desc: 'Deep & Clear' },
    { id: 'aura-luna-en', name: 'Luna', desc: 'Soft & Friendly' },
    { id: 'aura-stella-en', name: 'Stella', desc: 'Calm & Professional' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 py-2"
    >
      {/* Modern Header */}
      <div className="flex items-center gap-5">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Bot size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Assistant Preferences</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Configure your AI study companion</p>
        </div>
      </div>

      {/* Voice Selection Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Sparkles size={14} className="text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Voice Synthesis</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {voices.map((voice) => {
            const isSelected = assistantSettings.voiceModel === voice.id;
            return (
              <button
                key={voice.id}
                onClick={() => setVoiceModel(voice.id)}
                className={`relative flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 text-left ${
                  isSelected 
                    ? 'bg-primary/5 border-primary shadow-sm' 
                    : 'bg-card border-border/50 hover:border-primary/30 hover:bg-accent/50'
                }`}
              >
                <div className="flex w-full justify-between items-start mb-2">
                  <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {voice.name}
                  </span>
                  {isSelected && <CheckCircle2 size={14} className="text-primary" />}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium leading-none">
                  {voice.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Microphone Access Card */}
        <div className="flex flex-col gap-3 p-4 bg-accent/30 rounded-2xl mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic size={18} className={micPermission === 'granted' ? 'text-emerald-500' : 'text-muted-foreground'} />
              <div>
                <p className="text-xs font-bold text-foreground">Microphone Access</p>
                <p className="text-[10px] text-muted-foreground font-medium">Talk to Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {micPermission === 'granted' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 size={12} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Access Granted</span>
                </div>
              ) : micPermission === 'denied' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
                  <MicOff size={12} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Access Blocked</span>
                </div>
              ) : (
                <button
                  onClick={requestMicPermission}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                >
                  Grant Access
                </button>
              )}
            </div>
          </div>

          {micPermission === 'denied' && (
            <div className="mt-1 flex gap-2 p-2.5 bg-red-500/5 rounded-xl border border-red-500/10">
              <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-red-600/80 font-bold uppercase leading-tight">
                Permission was denied. Please reset microphone permissions in your browser settings to enable voice input.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl">
          <div className="flex items-center gap-3">
            <Volume2 size={18} className="text-muted-foreground" />
            <div>
              <p className="text-xs font-bold text-foreground">Auto-Read Responses</p>
              <p className="text-[10px] text-muted-foreground font-medium">Speak output immediately</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('autoSpeak')}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              assistantSettings.autoSpeak ? 'bg-primary' : 'bg-muted-foreground/20'
            }`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              assistantSettings.autoSpeak ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </section>

      {/* Experience Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Zap size={14} className="text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Interaction Style</h3>
        </div>

        <div className="divide-y divide-border/40 bg-card/50 border border-border/50 rounded-2xl overflow-hidden">
          {[
            { 
              id: 'showThinkingProcess' as const, 
              icon: Zap, 
              title: 'Visible Reasoning', 
              desc: 'Show tool usage and thinking steps' 
            },
            { 
              id: 'saveHistory' as const, 
              icon: History, 
              title: 'Session Memory', 
              desc: 'Remember context in current chat' 
            },
            { 
              id: 'contextAwareness' as const, 
              icon: Shield, 
              title: 'Academic Context', 
              desc: 'Access grades and schedules safely' 
            }
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <item.icon size={18} className="text-primary/70" />
                <div>
                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(item.id)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  assistantSettings[item.id] ? 'bg-primary' : 'bg-muted-foreground/20'
                }`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  assistantSettings[item.id] ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modern Footer */}
      <div className="p-4 bg-muted/20 rounded-2xl flex gap-3 border border-border/30">
        <div className="shrink-0 mt-0.5">
            <Info size={14} className="text-muted-foreground" />
        </div>
        <p className="text-[10px] text-muted-foreground/80 font-medium leading-relaxed">
          These preferences are stored in your profile and applied to all assistant interactions. We use enterprise-grade TTS and private models to ensure your academic data remains confidential.
        </p>
      </div>
    </motion.div>
  );
}

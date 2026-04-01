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
  AlertCircle,
  GraduationCap
} from 'lucide-react';
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
    contextAwareness: true,
    tutorMode: true
  };

  const handleToggle = (key: string) => {
    const newAssistantSettings = {
      ...assistantSettings,
      [key]: !assistantSettings[key as keyof typeof assistantSettings]
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
    <div className="space-y-6">
      {/* Header Card (Simplified) */}
      <div className="surface-cyan flex items-center gap-4 p-5 rounded-2xl border border-border/80 shadow-sm overflow-hidden relative group ring-1 ring-black/5 dark:ring-white/10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition duration-700 opacity-50"></div>
        <div className="w-12 h-12 rounded-xl bg-accent border border-border shrink-0 flex items-center justify-center relative z-10 shadow-sm">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-base text-foreground leading-tight">AI Settings</h3>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Configure your academic companion.</p>
        </div>
      </div>

      {/* Interaction Style Section */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Interaction Style</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingsToggle 
            icon={<GraduationCap />} 
            title="Tutor Mode" 
            description="Guide me through problems"
            enabled={assistantSettings.tutorMode}
            onToggle={() => handleToggle('tutorMode')}
          />
          <SettingsToggle 
            icon={<Zap />} 
            title="Show Thinking" 
            description="Visible reasoning process"
            enabled={assistantSettings.showThinkingProcess}
            onToggle={() => handleToggle('showThinkingProcess')}
          />
          <SettingsToggle 
            icon={<History />} 
            title="Session Memory" 
            description="Remember chat context"
            enabled={assistantSettings.saveHistory}
            onToggle={() => handleToggle('saveHistory')}
          />
          <SettingsToggle 
            icon={<Shield />} 
            title="Context Awareness" 
            description="Access academic data"
            enabled={assistantSettings.contextAwareness}
            onToggle={() => handleToggle('contextAwareness')}
          />
        </div>
      </div>

      {/* Voice & Audio Section */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Voice & Audio</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {voices.map((voice) => {
            const isSelected = assistantSettings.voiceModel === voice.id;
            return (
              <button
                key={voice.id}
                onClick={() => setVoiceModel(voice.id)}
                className={`flex flex-col items-start p-3 rounded-xl border transition-all duration-300 text-left ${
                  isSelected 
                    ? 'surface-sky border-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                    : 'surface-neutral border-border/50 hover:bg-card hover:border-border'
                }`}
              >
                <div className="flex w-full justify-between items-center mb-1">
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {voice.name}
                  </span>
                  {isSelected && <CheckCircle2 size={10} className="text-primary" />}
                </div>
                <span className="text-[9px] text-muted-foreground font-medium leading-none">
                  {voice.desc}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <SettingsToggle 
            icon={<Volume2 />} 
            title="Auto-Read" 
            description="Speak responses automatically"
            enabled={assistantSettings.autoSpeak}
            onToggle={() => handleToggle('autoSpeak')}
          />

          <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all ${
                micPermission === 'granted' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-accent dark:bg-card border-border text-muted-foreground'
              }`}>
                <Mic size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-foreground">Microphone</p>
                <p className="text-[10px] font-medium text-muted-foreground">Voice interactions</p>
              </div>
            </div>
            
            {micPermission === 'granted' ? (
              <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
                Enabled
              </div>
            ) : micPermission === 'denied' ? (
              <div className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 text-[9px] font-bold uppercase tracking-wider">
                Blocked
              </div>
            ) : (
              <button
                onClick={requestMicPermission}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[9px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
              >
                Grant Access
              </button>
            )}
          </div>

          {micPermission === 'denied' && (
            <div className="flex gap-2 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
              <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-600/80 font-medium leading-tight">
                Microphone access is blocked. Please update your browser settings.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-primary rounded-xl text-primary-foreground flex items-center gap-4 shadow-lg shadow-primary/20">
        <div className="p-2.5 bg-primary-foreground/10 rounded-lg">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <p className="text-[10px] text-primary-foreground/80 font-medium leading-relaxed">
          Your assistant preferences are private and encrypted. Academic data remains confidential.
        </p>
      </div>
    </div>
  );
}

function SettingsToggle({ icon, title, description, enabled, onToggle }: { icon: React.ReactNode, title: string, description: string, enabled: boolean, onToggle?: () => void }) {
  return (
    <button 
      onClick={onToggle}
      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
        enabled
          ? 'surface-sky border-primary/40 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
          : 'surface-neutral border-border/50 text-muted-foreground hover:bg-card hover:border-border'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all shadow-sm ${
          enabled ? 'bg-primary border-primary text-primary-foreground' : 'bg-accent dark:bg-card border-border text-muted-foreground'
        }`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-foreground leading-none mb-1">{title}</p>
          <p className="text-[10px] font-medium text-muted-foreground leading-tight">{description}</p>
        </div>
      </div>
      <div className={`w-9 h-5 rounded-full relative transition-colors shadow-inner shrink-0 ${enabled ? 'bg-primary' : 'bg-muted'}`}>
        <div
          style={{ transform: `translateX(${enabled ? 18 : 2}px)` }}
          className={`absolute top-1 w-3 h-3 rounded-full shadow-sm transition-colors ${
            enabled ? 'bg-primary-foreground' : 'bg-white'
          }`}
        />
      </div>
    </button>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Volume2, 
  Zap, 
  Shield, 
  History,
  CheckCircle2,
  Mic,
  AlertCircle
} from 'lucide-react';
import { Student } from '@/types';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
        .catch(() => {});
    }
  }, []);

  const requestMicPermission = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Microphone access is only available in secure contexts.");
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

  const handleToggle = (key: string, enabled: boolean) => {
    const newAssistantSettings = {
      ...assistantSettings,
      [key]: enabled
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
    { id: 'aura-helios-en', name: 'Helios', desc: 'Deep' },
    { id: 'aura-luna-en', name: 'Luna', desc: 'Soft' },
    { id: 'aura-stella-en', name: 'Stella', desc: 'Professional' }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Assistant</h4>
        <p className="text-sm text-muted-foreground">
          Configure your AI academic companion.
        </p>
      </div>

      <div className="grid gap-6">
        <SettingsItem 
          title="Show Thinking" 
          description="Visible reasoning process"
          enabled={assistantSettings.showThinkingProcess}
          onToggle={(val) => handleToggle('showThinkingProcess', val)}
        />
        <Separator />
        <SettingsItem 
          title="Session Memory" 
          description="Remember chat context"
          enabled={assistantSettings.saveHistory}
          onToggle={(val) => handleToggle('saveHistory', val)}
        />
        <Separator />
        <SettingsItem 
          title="Context Access" 
          description="Allow assistant to view records"
          enabled={assistantSettings.contextAwareness}
          onToggle={(val) => handleToggle('contextAwareness', val)}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Voice Model</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {voices.map((voice) => {
            const isSelected = assistantSettings.voiceModel === voice.id;
            return (
              <Button
                key={voice.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => setVoiceModel(voice.id)}
                className="h-auto flex-col items-start p-3 gap-1"
              >
                <div className="flex w-full justify-between items-center">
                  <span className="text-xs font-bold">{voice.name}</span>
                  {isSelected && <CheckCircle2 size={12} />}
                </div>
                <span className={cn("text-[10px] font-medium", isSelected ? "opacity-90" : "text-muted-foreground")}>
                  {voice.desc}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <SettingsItem 
          title="Auto-Read" 
          description="Read responses automatically"
          enabled={assistantSettings.autoSpeak}
          onToggle={(val) => handleToggle('autoSpeak', val)}
        />

        <div className="flex items-center justify-between p-4 rounded-md border bg-muted/30">
          <div className="flex items-center gap-3">
            <Mic className={cn("h-4 w-4", micPermission === 'granted' ? "text-primary" : "text-muted-foreground")} />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Microphone</p>
              <p className="text-xs text-muted-foreground">For voice interactions</p>
            </div>
          </div>
          
          {micPermission === 'granted' ? (
            <Badge variant="secondary" className="text-[10px]">Enabled</Badge>
          ) : (
            <Button size="sm" onClick={requestMicPermission} variant="outline" className="h-8 text-[10px] uppercase font-bold tracking-wider">
              Grant Access
            </Button>
          )}
        </div>

        {micPermission === 'denied' && (
          <div className="flex gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-xs font-medium">Microphone access is blocked.</p>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-muted/50 p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Assistant preferences are private and data remains confidential.
        </p>
      </div>
    </div>
  );
}

function SettingsItem({ title, description, enabled, onToggle }: { title: string, description: string, enabled: boolean, onToggle: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-semibold">{title}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
      />
    </div>
  );
}

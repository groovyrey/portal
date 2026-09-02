'use client';

import React, { useState } from 'react';
import { Check, CloudUpload, Palette, Sparkles } from 'lucide-react';
import { ACCENT_THEMES, DEFAULT_ACCENT } from '@/lib/accents';
import { Student } from '@/types';
import { cn } from '@/lib/utils';

interface AppearanceTabProps {
  student: Student;
  updateSettings: (newSettings: any) => Promise<void>;
}

export default function AppearanceTab({ student, updateSettings }: AppearanceTabProps) {
  const [saving, setSaving] = useState(false);

  const currentAccent = student.settings?.accent || DEFAULT_ACCENT;
  const activeTheme = ACCENT_THEMES.find((t) => t.id === currentAccent) || ACCENT_THEMES[0];

  const selectAccent = async (id: string) => {
    if (id === currentAccent || saving) return;
    setSaving(true);
    try {
      await updateSettings({ ...student.settings, accent: id });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">Appearance</h4>
        <p className="text-sm text-muted-foreground">
          Personalize the portal's accent colors. Saved to your account.
        </p>
      </div>

      {/* Live preview */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div
          className="relative h-24 flex items-center justify-center"
          style={{ background: `linear-gradient(120deg, ${activeTheme.from}, ${activeTheme.to})` }}
        >
          <Sparkles className="h-7 w-7 text-white/85" />
          <span className="absolute bottom-2 right-3 text-xs font-medium text-white/70">
            Live preview
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{activeTheme.name} theme</p>
              <p className="text-xs text-muted-foreground">{activeTheme.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                Button
              </button>
              <button className="h-8 px-3 rounded-md border border-border text-xs font-medium text-muted-foreground">
                Ghost
              </button>
            </div>
          </div>
          <div className="h-2 rounded-full bg-primary/15 overflow-hidden">
            <div
              className="h-full w-2/3 rounded-full"
              style={{ background: `linear-gradient(90deg, ${activeTheme.from}, ${activeTheme.to})` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15">
              <Palette className="h-3.5 w-3.5 text-primary" />
            </span>
            <p className="text-xs text-muted-foreground">Active navigation &amp; highlights</p>
          </div>
        </div>
      </div>

      {/* Accent swatches */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold tracking-tight">Accent Color</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {ACCENT_THEMES.map((theme) => {
            const active = theme.id === currentAccent;
            return (
              <button
                key={theme.id}
                onClick={() => selectAccent(theme.id)}
                disabled={saving}
                className={cn(
                  "group text-left rounded-lg border p-2 transition-all active:scale-[0.98]",
                  active
                    ? "border-primary ring-2 ring-primary/25 bg-accent/50"
                    : "border-border hover:border-primary/40 hover:bg-accent/30"
                )}
              >
                <div
                  className="relative h-14 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
                >
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-6 w-6 rounded-md bg-white/90 flex items-center justify-center">
                        <Check className="h-4 w-4 text-foreground" />
                      </span>
                    </span>
                  )}
                </div>
                <div className="px-1 pt-2 pb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{theme.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{theme.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md border bg-muted/50 p-4 flex items-start gap-3">
        <CloudUpload className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your accent color is stored with your account settings, so it follows you across
          devices. It applies in both light and dark mode.
        </p>
      </div>
    </div>
  );
}

'use client';

import { Cloud, Sun, CloudRain, Wind, Droplets, MapPin, Loader2, CloudLightning, CloudFog } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: any;
  color: string;
  bg: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        // Coordinates for San Jose del Monte, Bulacan
        const lat = 14.8111;
        const lon = 121.0451;
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FManila`
        );
        
        if (!response.ok) throw new Error('Weather fetch failed');
        
        const data = await response.json();
        const current = data.current;
        const code = current.weather_code;

        // Map WMO Weather Codes to UI states
        let state = {
          condition: 'Clear',
          icon: Sun,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10'
        };

        if (code === 0) {
          state = { condition: 'Sunny', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10' };
        } else if (code >= 1 && code <= 3) {
          state = { condition: 'Partly Cloudy', icon: Cloud, color: 'text-sky-400', bg: 'bg-sky-400/10' };
        } else if (code >= 45 && code <= 48) {
          state = { condition: 'Foggy', icon: CloudFog, color: 'text-slate-400', bg: 'bg-slate-400/10' };
        } else if (code >= 51 && code <= 67 || code >= 80 && code <= 82) {
          state = { condition: 'Rainy', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-500/10' };
        } else if (code >= 95) {
          state = { condition: 'Stormy', icon: CloudLightning, color: 'text-purple-500', bg: 'bg-purple-500/10' };
        }

        setWeather({
          temp: Math.round(current.temperature_2m),
          condition: state.condition,
          humidity: current.relative_humidity_2m,
          wind: Math.round(current.wind_speed_10m),
          icon: state.icon,
          color: state.color,
          bg: state.bg
        });
        setError(false);
      } catch (err) {
        console.error('Weather error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">Service Offline</p>
        <p className="text-xs font-bold text-muted-foreground">Unable to fetch SJDM weather</p>
      </div>
    );
  }

  const WeatherIcon = weather.icon;

  return (
    <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden group hover:shadow-md transition-all h-full flex flex-col justify-between">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
        <WeatherIcon className={`h-32 w-32 ${weather.color}`} />
      </div>

      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Live Weather</p>
            </div>
            <h3 className="text-sm font-black text-foreground tracking-tight">
              SJDM, Bulacan
            </h3>
          </div>
          <div className={`h-10 w-10 rounded-2xl ${weather.bg} flex items-center justify-center ${weather.color} border border-current/10 shadow-sm`}>
            <WeatherIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-foreground tracking-tighter tabular-nums leading-none">
            {weather.temp}°
          </span>
          <div className="pb-1">
             <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground block leading-none">
              {weather.condition}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent rounded-lg text-muted-foreground border border-border/50">
            <Droplets className="h-3 w-3" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider leading-none mb-1">Humidity</p>
            <p className="text-xs font-bold text-foreground tabular-nums leading-none">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent rounded-lg text-muted-foreground border border-border/50">
            <Wind className="h-3 w-3" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider leading-none mb-1">Wind</p>
            <p className="text-xs font-bold text-foreground tabular-nums leading-none">{weather.wind} <span className="text-[8px]">km/h</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}



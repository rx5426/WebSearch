import React, { useState, useEffect } from 'react';
import { Clock, Globe, Sun, Moon, Calendar, Copy, Check } from 'lucide-react';
import { TimeData } from '../types.ts';

interface TimeWidgetProps {
  initialTime: TimeData;
}

export const TimeWidget: React.FC<TimeWidgetProps> = ({ initialTime }) => {
  const [time12, setTime12] = useState(initialTime.time12h);
  const [time24, setTime24] = useState(initialTime.time24h);
  const [copied, setCopied] = useState(false);

  // Live ticking clock in target timezone
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const now = new Date();
        const t12 = new Intl.DateTimeFormat('en-US', {
          timeZone: initialTime.timezone,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now);

        const t24 = new Intl.DateTimeFormat('en-US', {
          timeZone: initialTime.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now);

        setTime12(t12);
        setTime24(t24);
      } catch {
        // Ignore fallback errors
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [initialTime.timezone]);

  const copyTime = () => {
    navigator.clipboard.writeText(`${initialTime.location}: ${time12} (${initialTime.timezone}, ${initialTime.utcOffset})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-medium mb-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Time & Timezone Service</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Time in {initialTime.location}</span>
            {initialTime.country && <span className="text-sm font-normal text-slate-400">({initialTime.country})</span>}
          </h2>
        </div>

        <button
          onClick={copyTime}
          className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-slate-800 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Time'}</span>
        </button>
      </div>

      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Giant Live Clock Display */}
        <div className="flex items-center space-x-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
            {initialTime.isDaytime ? (
              <Sun className="w-12 h-12 text-amber-400" />
            ) : (
              <Moon className="w-12 h-12 text-indigo-300" />
            )}
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
              {time12}
            </div>
            <div className="text-sm font-mono text-cyan-400 mt-1 flex items-center gap-2">
              <span>24-Hour: {time24}</span>
              <span>•</span>
              <span>{initialTime.isDaytime ? 'Daytime' : 'Nighttime'}</span>
            </div>
          </div>
        </div>

        {/* Date & Timezone Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Date</span>
            </div>
            <div className="text-sm font-bold text-white mt-1.5">{initialTime.dateFormatted}</div>
            <div className="text-xs text-slate-400 mt-0.5">{initialTime.dayOfWeek}</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Timezone / Offset</span>
            </div>
            <div className="text-sm font-bold text-white mt-1.5 truncate" title={initialTime.timezone}>
              {initialTime.timezone}
            </div>
            <div className="text-xs text-emerald-400 mt-0.5 truncate">
              {initialTime.utcOffset} {initialTime.timeZoneName ? `• ${initialTime.timeZoneName}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

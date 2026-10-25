import React, { useState } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Calendar,
  Compass,
  MapPin,
} from 'lucide-react';
import { WeatherData } from '../types.ts';

interface WeatherWidgetProps {
  weather: WeatherData;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  const getConditionIcon = (category: string, isDay = true, size = 'w-8 h-8') => {
    switch (category) {
      case 'clear':
        return isDay ? (
          <Sun className={`${size} text-amber-400 animate-spin-slow`} />
        ) : (
          <Sun className={`${size} text-indigo-300`} />
        );
      case 'rain':
        return <CloudRain className={`${size} text-cyan-400`} />;
      case 'snow':
        return <CloudSnow className={`${size} text-blue-200`} />;
      case 'thunder':
        return <CloudLightning className={`${size} text-amber-300`} />;
      case 'fog':
        return <CloudFog className={`${size} text-slate-400`} />;
      case 'cloudy':
      default:
        return <Cloud className={`${size} text-slate-300`} />;
    }
  };

  const current = weather.current;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Instant Weather Report</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{weather.location}</span>
            {weather.country && <span className="text-sm font-normal text-slate-400">({weather.country})</span>}
          </h2>
          <div className="text-xs font-mono text-slate-400 mt-0.5">
            Timezone: {weather.timezone} • Coordinates: {weather.latitude.toFixed(2)}°, {weather.longitude.toFixed(2)}°
          </div>
        </div>

        {/* Temperature Unit Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono font-bold">
          <button
            onClick={() => setUnit('C')}
            className={`px-3 py-1 rounded transition-colors ${
              unit === 'C' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            °C
          </button>
          <button
            onClick={() => setUnit('F')}
            className={`px-3 py-1 rounded transition-colors ${
              unit === 'F' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            °F
          </button>
        </div>
      </div>

      {/* Main Temperature & Conditions Display */}
      <div className="my-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
            {getConditionIcon(current.conditionCategory, current.isDay, 'w-14 h-14')}
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
                {unit === 'C' ? `${current.temperatureC}°` : `${current.temperatureF}°`}
              </span>
              <span className="text-slate-400 text-sm font-mono">
                Feels like {unit === 'C' ? `${current.feelsLikeC}°C` : `${current.feelsLikeF}°F`}
              </span>
            </div>
            <div className="text-base sm:text-lg font-semibold text-slate-200 mt-1">
              {current.condition}
            </div>
          </div>
        </div>

        {/* Real-time Atmospheric Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
            <div className="text-slate-400 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Humidity</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">{current.humidityPercent}%</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
            <div className="text-slate-400 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-indigo-400" />
              <span>Wind</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {unit === 'C' ? `${current.windSpeedKph} km/h` : `${current.windSpeedMph} mph`}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 col-span-2 sm:col-span-1">
            <div className="text-slate-400 flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>Precipitation</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">{current.precipitationMm} mm</div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast Grid */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>5-Day Weather Forecast</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {weather.forecast.map((f, i) => (
              <div
                key={i}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-center flex flex-col items-center justify-between"
              >
                <span className="text-xs font-mono text-slate-300 font-semibold">{f.dayName}</span>
                <div className="my-2">{getConditionIcon(f.conditionCategory, true, 'w-6 h-6')}</div>
                <div className="text-xs font-mono font-bold text-white">
                  {unit === 'C' ? `${f.maxTempC}°` : `${f.maxTempF}°`}
                  <span className="text-slate-500 font-normal ml-1">
                    {unit === 'C' ? `${f.minTempC}°` : `${f.minTempF}°`}
                  </span>
                </div>
                {f.precipitationProbability > 0 && (
                  <span className="text-[10px] text-cyan-400 font-mono mt-1">
                    {f.precipitationProbability}% rain
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Real-Time Weather & Time Intelligence Service
 * Provides global live meteorological data and timezone-aware time calculation
 * without requiring any paid API keys or hitting rate limits.
 */

export interface WeatherData {
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  current: {
    temperatureC: number;
    temperatureF: number;
    feelsLikeC: number;
    feelsLikeF: number;
    condition: string;
    conditionCode: number;
    conditionCategory: 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'fog';
    humidityPercent: number;
    windSpeedKph: number;
    windSpeedMph: number;
    precipitationMm: number;
    isDay: boolean;
    timestamp: string;
  };
  forecast: Array<{
    date: string;
    dayName: string;
    maxTempC: number;
    minTempC: number;
    maxTempF: number;
    minTempF: number;
    condition: string;
    conditionCategory: 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'fog';
    precipitationProbability: number;
  }>;
}

export interface TimeData {
  location: string;
  country?: string;
  timezone: string;
  currentTimeFormatted: string;
  time12h: string;
  time24h: string;
  dateFormatted: string;
  dayOfWeek: string;
  utcOffset: string;
  unixTimestamp: number;
  isDaytime: boolean;
}

// Major cities fallback coordinate map
const CITY_FALLBACKS: Record<string, { lat: number; lon: number; name: string; country: string; timezone: string }> = {
  tokyo: { lat: 35.6895, lon: 139.6917, name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  london: { lat: 51.5074, lon: -0.1278, name: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  'new york': { lat: 40.7128, lon: -74.006, name: 'New York', country: 'United States', timezone: 'America/New_York' },
  paris: { lat: 48.8566, lon: 2.3522, name: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  singapore: { lat: 1.3521, lon: 103.8198, name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  manila: { lat: 14.5995, lon: 120.9842, name: 'Manila', country: 'Philippines', timezone: 'Asia/Manila' },
  sydney: { lat: -33.8688, lon: 151.2093, name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  dubai: { lat: 25.2048, lon: 55.2708, name: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  berlin: { lat: 52.52, lon: 13.405, name: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin' },
  'san francisco': { lat: 37.7749, lon: -122.4194, name: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' },
};

function wmoCodeToCondition(code: number): { condition: string; category: WeatherData['current']['conditionCategory'] } {
  if (code === 0) return { condition: 'Clear sky', category: 'clear' };
  if (code === 1) return { condition: 'Mainly clear', category: 'clear' };
  if (code === 2) return { condition: 'Partly cloudy', category: 'cloudy' };
  if (code === 3) return { condition: 'Overcast', category: 'cloudy' };
  if (code === 45 || code === 48) return { condition: 'Foggy', category: 'fog' };
  if (code >= 51 && code <= 55) return { condition: 'Drizzle', category: 'rain' };
  if (code >= 61 && code <= 65) return { condition: 'Rain', category: 'rain' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', category: 'snow' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', category: 'rain' };
  if (code >= 85 && code <= 86) return { condition: 'Snow Showers', category: 'snow' };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', category: 'thunder' };
  return { condition: 'Partly Cloudy', category: 'cloudy' };
}

export class WeatherTimeService {
  /**
   * Resolve location name to latitude, longitude, and timezone
   */
  public async resolveLocation(query: string): Promise<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }> {
    const clean = query.trim().toLowerCase();

    // Check predefined cache/fallbacks
    if (CITY_FALLBACKS[clean]) {
      const c = CITY_FALLBACKS[clean];
      return { name: c.name, country: c.country, latitude: c.lat, longitude: c.lon, timezone: c.timezone };
    }

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(geoUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const r = data.results[0];
          return {
            name: r.name,
            country: r.country || '',
            latitude: r.latitude,
            longitude: r.longitude,
            timezone: r.timezone || 'UTC',
          };
        }
      }
    } catch {
      // Fallback
    }

    // Default to UTC or Tokyo if query can't be resolved
    return {
      name: query,
      country: 'Global',
      latitude: 35.6895,
      longitude: 139.6917,
      timezone: 'UTC',
    };
  }

  /**
   * Get real-time weather and 5-day forecast for a location
   */
  public async getWeather(locationQuery: string): Promise<WeatherData> {
    const geo = await this.resolveLocation(locationQuery);

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(weatherUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Weather service returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const currentCondition = wmoCodeToCondition(current.weather_code);

    const tempC = Math.round(current.temperature_2m * 10) / 10;
    const tempF = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;

    const feelsLikeC = Math.round(current.apparent_temperature * 10) / 10;
    const feelsLikeF = Math.round(((feelsLikeC * 9) / 5 + 32) * 10) / 10;

    const windKph = Math.round(current.wind_speed_10m * 10) / 10;
    const windMph = Math.round(windKph * 0.621371 * 10) / 10;

    // Daily forecast
    const forecast: WeatherData['forecast'] = [];
    if (data.daily && data.daily.time) {
      const times = data.daily.time as string[];
      for (let i = 0; i < Math.min(times.length, 5); i++) {
        const dStr = times[i];
        const dateObj = new Date(dStr + 'T12:00:00');
        const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const maxC = Math.round(data.daily.temperature_2m_max[i]);
        const minC = Math.round(data.daily.temperature_2m_min[i]);
        const cond = wmoCodeToCondition(data.daily.weather_code[i]);

        forecast.push({
          date: dStr,
          dayName,
          maxTempC: maxC,
          minTempC: minC,
          maxTempF: Math.round((maxC * 9) / 5 + 32),
          minTempF: Math.round((minC * 9) / 5 + 32),
          condition: cond.condition,
          conditionCategory: cond.category,
          precipitationProbability: data.daily.precipitation_probability_max?.[i] ?? 0,
        });
      }
    }

    return {
      location: geo.name,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: data.timezone || geo.timezone,
      elevation: data.elevation || 0,
      current: {
        temperatureC: tempC,
        temperatureF: tempF,
        feelsLikeC,
        feelsLikeF,
        condition: currentCondition.condition,
        conditionCode: current.weather_code,
        conditionCategory: currentCondition.category,
        humidityPercent: current.relative_humidity_2m,
        windSpeedKph: windKph,
        windSpeedMph: windMph,
        precipitationMm: current.precipitation,
        isDay: current.is_day === 1,
        timestamp: current.time,
      },
      forecast,
    };
  }

  /**
   * Get accurate real-time time information for any location or timezone
   */
  public async getTime(locationQuery: string): Promise<TimeData> {
    const geo = await this.resolveLocation(locationQuery);
    const timezone = geo.timezone;
    const now = new Date();

    const fullFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'long',
    });

    const time12Formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const time24Formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
    });

    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });

    const hour24 = parseInt(hourFormatter.format(now), 10);
    const isDaytime = hour24 >= 6 && hour24 < 18;

    // Extract UTC offset string (e.g. GMT+9)
    const formattedLong = fullFormatter.format(now);
    const gmtMatch = formattedLong.match(/GMT[+-]?\d+/);
    const utcOffset = gmtMatch ? gmtMatch[0] : 'UTC';

    return {
      location: geo.name,
      country: geo.country,
      timezone,
      currentTimeFormatted: formattedLong,
      time12h: time12Formatter.format(now),
      time24h: time24Formatter.format(now),
      dateFormatted: dateFormatter.format(now),
      dayOfWeek: dayOfWeekFormatter.format(now),
      utcOffset,
      unixTimestamp: Math.floor(now.getTime() / 1000),
      isDaytime,
    };
  }

  /**
   * Detects if a search query contains weather or time intent
   */
  public detectIntent(query: string): { type: 'weather' | 'time' | null; location: string } {
    const q = query.trim().toLowerCase();

    // Check Weather intent
    const weatherPatterns = [
      /^(?:what(?:'s| is) the )?(?:current |latest )?weather (?:in |for |at )?(.+)$/i,
      /^weather (?:in |for |at )?(.+)$/i,
      /^temperature (?:in |for |at )?(.+)$/i,
      /^(.+) weather(?: forecast)?$/i,
      /^is it raining in (.+)$/i,
    ];

    for (const pat of weatherPatterns) {
      const match = q.match(pat);
      if (match && match[1]) {
        const loc = match[1].replace(/today|tomorrow|now|currently/gi, '').trim();
        if (loc.length > 1) {
          return { type: 'weather', location: loc };
        }
      }
    }

    // Check Time intent
    const timePatterns = [
      /^(?:what(?:'s| is) the )?(?:current |latest )?time (?:in |for |at )?(.+)$/i,
      /^time (?:in |for |at )?(.+)$/i,
      /^what time is it in (.+)$/i,
      /^current time (.+)$/i,
      /^timezone (?:in |of |for )?(.+)$/i,
    ];

    for (const pat of timePatterns) {
      const match = q.match(pat);
      if (match && match[1]) {
        const loc = match[1].replace(/now|today|currently/gi, '').trim();
        if (loc.length > 1) {
          return { type: 'time', location: loc };
        }
      }
    }

    return { type: null, location: '' };
  }
}

export const weatherTimeService = new WeatherTimeService();

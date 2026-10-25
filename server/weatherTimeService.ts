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
  city?: string;
  timezone: string;
  timeZoneName?: string;
  abbreviation?: string;
  currentTimeFormatted: string;
  time12h: string;
  time24h: string;
  dateFormatted: string;
  dayOfWeek: string;
  utcOffset: string;
  utcOffsetHours?: number;
  unixTimestamp: number;
  isDaytime: boolean;
  isoString?: string;
}

interface LocationEntry {
  lat: number;
  lon: number;
  name: string;
  country: string;
  timezone: string;
}

// Comprehensive offline registry of major countries, territories, and cities
const GLOBAL_LOCATION_REGISTRY: Record<string, LocationEntry> = {
  // Countries & Primary Capitals / Financial Centers
  malaysia: { lat: 3.139, lon: 101.6869, name: 'Malaysia', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  singapore: { lat: 1.3521, lon: 103.8198, name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  japan: { lat: 35.6895, lon: 139.6917, name: 'Japan', country: 'Japan', timezone: 'Asia/Tokyo' },
  'united states': { lat: 40.7128, lon: -74.006, name: 'United States', country: 'United States', timezone: 'America/New_York' },
  usa: { lat: 40.7128, lon: -74.006, name: 'United States', country: 'United States', timezone: 'America/New_York' },
  us: { lat: 40.7128, lon: -74.006, name: 'United States', country: 'United States', timezone: 'America/New_York' },
  america: { lat: 40.7128, lon: -74.006, name: 'United States', country: 'United States', timezone: 'America/New_York' },
  'united kingdom': { lat: 51.5074, lon: -0.1278, name: 'United Kingdom', country: 'United Kingdom', timezone: 'Europe/London' },
  uk: { lat: 51.5074, lon: -0.1278, name: 'United Kingdom', country: 'United Kingdom', timezone: 'Europe/London' },
  england: { lat: 51.5074, lon: -0.1278, name: 'England', country: 'United Kingdom', timezone: 'Europe/London' },
  scotland: { lat: 55.9533, lon: -3.1883, name: 'Scotland', country: 'United Kingdom', timezone: 'Europe/London' },
  wales: { lat: 51.4816, lon: -3.1791, name: 'Wales', country: 'United Kingdom', timezone: 'Europe/London' },
  australia: { lat: -33.8688, lon: 151.2093, name: 'Australia', country: 'Australia', timezone: 'Australia/Sydney' },
  canada: { lat: 43.6532, lon: -79.3832, name: 'Canada', country: 'Canada', timezone: 'America/Toronto' },
  china: { lat: 39.9042, lon: 116.4074, name: 'China', country: 'China', timezone: 'Asia/Shanghai' },
  india: { lat: 28.6139, lon: 77.209, name: 'India', country: 'India', timezone: 'Asia/Kolkata' },
  indonesia: { lat: -6.2088, lon: 106.8456, name: 'Indonesia', country: 'Indonesia', timezone: 'Asia/Jakarta' },
  philippines: { lat: 14.5995, lon: 120.9842, name: 'Philippines', country: 'Philippines', timezone: 'Asia/Manila' },
  thailand: { lat: 13.7563, lon: 100.5018, name: 'Thailand', country: 'Thailand', timezone: 'Asia/Bangkok' },
  vietnam: { lat: 21.0285, lon: 105.8542, name: 'Vietnam', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  'south korea': { lat: 37.5665, lon: 126.978, name: 'South Korea', country: 'South Korea', timezone: 'Asia/Seoul' },
  korea: { lat: 37.5665, lon: 126.978, name: 'South Korea', country: 'South Korea', timezone: 'Asia/Seoul' },
  taiwan: { lat: 25.033, lon: 121.5654, name: 'Taiwan', country: 'Taiwan', timezone: 'Asia/Taipei' },
  'hong kong': { lat: 22.3193, lon: 114.1694, name: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  macau: { lat: 22.1987, lon: 113.5439, name: 'Macau', country: 'Macau', timezone: 'Asia/Macau' },
  france: { lat: 48.8566, lon: 2.3522, name: 'France', country: 'France', timezone: 'Europe/Paris' },
  germany: { lat: 52.52, lon: 13.405, name: 'Germany', country: 'Germany', timezone: 'Europe/Berlin' },
  italy: { lat: 41.9028, lon: 12.4964, name: 'Italy', country: 'Italy', timezone: 'Europe/Rome' },
  spain: { lat: 40.4168, lon: -3.7038, name: 'Spain', country: 'Spain', timezone: 'Europe/Madrid' },
  netherlands: { lat: 52.3676, lon: 4.9041, name: 'Netherlands', country: 'Netherlands', timezone: 'Europe/Amsterdam' },
  holland: { lat: 52.3676, lon: 4.9041, name: 'Netherlands', country: 'Netherlands', timezone: 'Europe/Amsterdam' },
  switzerland: { lat: 47.3769, lon: 8.5417, name: 'Switzerland', country: 'Switzerland', timezone: 'Europe/Zurich' },
  sweden: { lat: 59.3293, lon: 18.0686, name: 'Sweden', country: 'Sweden', timezone: 'Europe/Stockholm' },
  norway: { lat: 59.9139, lon: 10.7522, name: 'Norway', country: 'Norway', timezone: 'Europe/Oslo' },
  denmark: { lat: 55.6761, lon: 12.5683, name: 'Denmark', country: 'Denmark', timezone: 'Europe/Copenhagen' },
  finland: { lat: 60.1699, lon: 24.9384, name: 'Finland', country: 'Finland', timezone: 'Europe/Helsinki' },
  poland: { lat: 52.2297, lon: 21.0122, name: 'Poland', country: 'Poland', timezone: 'Europe/Warsaw' },
  ireland: { lat: 53.3498, lon: -6.2603, name: 'Ireland', country: 'Ireland', timezone: 'Europe/Dublin' },
  portugal: { lat: 38.7223, lon: -9.1393, name: 'Portugal', country: 'Portugal', timezone: 'Europe/Lisbon' },
  greece: { lat: 37.9838, lon: 23.7275, name: 'Greece', country: 'Greece', timezone: 'Europe/Athens' },
  turkey: { lat: 41.0082, lon: 28.9784, name: 'Turkey', country: 'Turkey', timezone: 'Europe/Istanbul' },
  turkiye: { lat: 41.0082, lon: 28.9784, name: 'Turkey', country: 'Turkey', timezone: 'Europe/Istanbul' },
  russia: { lat: 55.7558, lon: 37.6173, name: 'Russia', country: 'Russia', timezone: 'Europe/Moscow' },
  ukraine: { lat: 50.4501, lon: 30.5234, name: 'Ukraine', country: 'Ukraine', timezone: 'Europe/Kyiv' },
  austria: { lat: 48.2082, lon: 16.3738, name: 'Austria', country: 'Austria', timezone: 'Europe/Vienna' },
  belgium: { lat: 50.8503, lon: 4.3517, name: 'Belgium', country: 'Belgium', timezone: 'Europe/Brussels' },
  'czech republic': { lat: 50.0755, lon: 14.4378, name: 'Czechia', country: 'Czechia', timezone: 'Europe/Prague' },
  czechia: { lat: 50.0755, lon: 14.4378, name: 'Czechia', country: 'Czechia', timezone: 'Europe/Prague' },
  hungary: { lat: 47.4979, lon: 19.0402, name: 'Hungary', country: 'Hungary', timezone: 'Europe/Budapest' },
  romania: { lat: 44.4268, lon: 26.1025, name: 'Romania', country: 'Romania', timezone: 'Europe/Bucharest' },
  uae: { lat: 25.2048, lon: 55.2708, name: 'United Arab Emirates', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  'united arab emirates': { lat: 25.2048, lon: 55.2708, name: 'United Arab Emirates', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  'saudi arabia': { lat: 24.7136, lon: 46.6753, name: 'Saudi Arabia', country: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  qatar: { lat: 25.2854, lon: 51.531, name: 'Qatar', country: 'Qatar', timezone: 'Asia/Qatar' },
  kuwait: { lat: 29.3759, lon: 47.9774, name: 'Kuwait', country: 'Kuwait', timezone: 'Asia/Kuwait' },
  israel: { lat: 31.7683, lon: 35.2137, name: 'Israel', country: 'Israel', timezone: 'Asia/Jerusalem' },
  egypt: { lat: 30.0444, lon: 31.2357, name: 'Egypt', country: 'Egypt', timezone: 'Africa/Cairo' },
  'south africa': { lat: -26.2041, lon: 28.0473, name: 'South Africa', country: 'South Africa', timezone: 'Africa/Johannesburg' },
  nigeria: { lat: 6.5244, lon: 3.3792, name: 'Nigeria', country: 'Nigeria', timezone: 'Africa/Lagos' },
  kenya: { lat: -1.2921, lon: 36.8219, name: 'Kenya', country: 'Kenya', timezone: 'Africa/Nairobi' },
  morocco: { lat: 33.5731, lon: -7.5898, name: 'Morocco', country: 'Morocco', timezone: 'Africa/Casablanca' },
  ghana: { lat: 5.6037, lon: -0.187, name: 'Ghana', country: 'Ghana', timezone: 'Africa/Accra' },
  mexico: { lat: 19.4326, lon: -99.1332, name: 'Mexico', country: 'Mexico', timezone: 'America/Mexico_City' },
  brazil: { lat: -23.5505, lon: -46.6333, name: 'Brazil', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  argentina: { lat: -34.6037, lon: -58.3816, name: 'Argentina', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  chile: { lat: -33.4489, lon: -70.6693, name: 'Chile', country: 'Chile', timezone: 'America/Santiago' },
  colombia: { lat: 4.711, lon: -74.0721, name: 'Colombia', country: 'Colombia', timezone: 'America/Bogota' },
  peru: { lat: -12.0464, lon: -77.0428, name: 'Peru', country: 'Peru', timezone: 'America/Lima' },
  'new zealand': { lat: -36.8485, lon: 174.7633, name: 'New Zealand', country: 'New Zealand', timezone: 'Pacific/Auckland' },
  nz: { lat: -36.8485, lon: 174.7633, name: 'New Zealand', country: 'New Zealand', timezone: 'Pacific/Auckland' },
  pakistan: { lat: 24.8607, lon: 67.0011, name: 'Pakistan', country: 'Pakistan', timezone: 'Asia/Karachi' },
  bangladesh: { lat: 23.8103, lon: 90.4125, name: 'Bangladesh', country: 'Bangladesh', timezone: 'Asia/Dhaka' },
  nepal: { lat: 27.7172, lon: 85.324, name: 'Nepal', country: 'Nepal', timezone: 'Asia/Kathmandu' },
  'sri lanka': { lat: 6.9271, lon: 79.8612, name: 'Sri Lanka', country: 'Sri Lanka', timezone: 'Asia/Colombo' },
  myanmar: { lat: 16.8661, lon: 96.1951, name: 'Myanmar', country: 'Myanmar', timezone: 'Asia/Yangon' },
  burma: { lat: 16.8661, lon: 96.1951, name: 'Myanmar', country: 'Myanmar', timezone: 'Asia/Yangon' },
  iceland: { lat: 64.1466, lon: -21.9426, name: 'Iceland', country: 'Iceland', timezone: 'Atlantic/Reykjavik' },

  // Global Metropolises & Cities
  'kuala lumpur': { lat: 3.139, lon: 101.6869, name: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  penang: { lat: 5.4141, lon: 100.3288, name: 'Penang', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  'george town': { lat: 5.4141, lon: 100.3288, name: 'George Town', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  'johor bahru': { lat: 1.4927, lon: 103.7414, name: 'Johor Bahru', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  kuching: { lat: 1.5533, lon: 110.3592, name: 'Kuching', country: 'Malaysia', timezone: 'Asia/Kuching' },
  'kota kinabalu': { lat: 5.9804, lon: 116.0735, name: 'Kota Kinabalu', country: 'Malaysia', timezone: 'Asia/Kuching' },
  malacca: { lat: 2.1896, lon: 102.2501, name: 'Malacca', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  ipoh: { lat: 4.5975, lon: 101.0901, name: 'Ipoh', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },

  tokyo: { lat: 35.6895, lon: 139.6917, name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  osaka: { lat: 34.6937, lon: 135.5023, name: 'Osaka', country: 'Japan', timezone: 'Asia/Tokyo' },
  kyoto: { lat: 35.0116, lon: 135.7681, name: 'Kyoto', country: 'Japan', timezone: 'Asia/Tokyo' },
  yokohama: { lat: 35.4437, lon: 139.638, name: 'Yokohama', country: 'Japan', timezone: 'Asia/Tokyo' },
  sapporo: { lat: 43.0618, lon: 141.3545, name: 'Sapporo', country: 'Japan', timezone: 'Asia/Tokyo' },
  fukuoka: { lat: 33.5904, lon: 130.4017, name: 'Fukuoka', country: 'Japan', timezone: 'Asia/Tokyo' },

  london: { lat: 51.5074, lon: -0.1278, name: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  manchester: { lat: 53.4808, lon: -2.2426, name: 'Manchester', country: 'United Kingdom', timezone: 'Europe/London' },
  birmingham: { lat: 52.4862, lon: -1.8904, name: 'Birmingham', country: 'United Kingdom', timezone: 'Europe/London' },
  edinburgh: { lat: 55.9533, lon: -3.1883, name: 'Edinburgh', country: 'United Kingdom', timezone: 'Europe/London' },

  'new york': { lat: 40.7128, lon: -74.006, name: 'New York', country: 'United States', timezone: 'America/New_York' },
  nyc: { lat: 40.7128, lon: -74.006, name: 'New York', country: 'United States', timezone: 'America/New_York' },
  'los angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles', country: 'United States', timezone: 'America/Los_Angeles' },
  la: { lat: 34.0522, lon: -118.2437, name: 'Los Angeles', country: 'United States', timezone: 'America/Los_Angeles' },
  chicago: { lat: 41.8781, lon: -87.6298, name: 'Chicago', country: 'United States', timezone: 'America/Chicago' },
  houston: { lat: 29.7604, lon: -95.3698, name: 'Houston', country: 'United States', timezone: 'America/Chicago' },
  phoenix: { lat: 33.4484, lon: -112.074, name: 'Phoenix', country: 'United States', timezone: 'America/Phoenix' },
  philadelphia: { lat: 39.9526, lon: -75.1652, name: 'Philadelphia', country: 'United States', timezone: 'America/New_York' },
  'san francisco': { lat: 37.7749, lon: -122.4194, name: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' },
  seattle: { lat: 47.6062, lon: -122.3321, name: 'Seattle', country: 'United States', timezone: 'America/Los_Angeles' },
  boston: { lat: 42.3601, lon: -71.0589, name: 'Boston', country: 'United States', timezone: 'America/New_York' },
  miami: { lat: 25.7617, lon: -80.1918, name: 'Miami', country: 'United States', timezone: 'America/New_York' },
  atlanta: { lat: 33.749, lon: -84.388, name: 'Atlanta', country: 'United States', timezone: 'America/New_York' },
  denver: { lat: 39.7392, lon: -104.9903, name: 'Denver', country: 'United States', timezone: 'America/Denver' },
  'las vegas': { lat: 36.1699, lon: -115.1398, name: 'Las Vegas', country: 'United States', timezone: 'America/Los_Angeles' },
  washington: { lat: 38.9072, lon: -77.0369, name: 'Washington, D.C.', country: 'United States', timezone: 'America/New_York' },
  'washington dc': { lat: 38.9072, lon: -77.0369, name: 'Washington, D.C.', country: 'United States', timezone: 'America/New_York' },
  dallas: { lat: 32.7767, lon: -96.797, name: 'Dallas', country: 'United States', timezone: 'America/Chicago' },
  austin: { lat: 30.2672, lon: -97.7431, name: 'Austin', country: 'United States', timezone: 'America/Chicago' },
  honolulu: { lat: 21.3069, lon: -157.8583, name: 'Honolulu', country: 'United States', timezone: 'Pacific/Honolulu' },
  anchorage: { lat: 61.2181, lon: -149.9003, name: 'Anchorage', country: 'United States', timezone: 'America/Anchorage' },

  california: { lat: 36.7783, lon: -119.4179, name: 'California', country: 'United States', timezone: 'America/Los_Angeles' },
  texas: { lat: 31.9686, lon: -99.9018, name: 'Texas', country: 'United States', timezone: 'America/Chicago' },
  florida: { lat: 27.6648, lon: -81.5158, name: 'Florida', country: 'United States', timezone: 'America/New_York' },

  toronto: { lat: 43.6532, lon: -79.3832, name: 'Toronto', country: 'Canada', timezone: 'America/Toronto' },
  vancouver: { lat: 49.2827, lon: -123.1207, name: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver' },
  montreal: { lat: 45.5017, lon: -73.5673, name: 'Montreal', country: 'Canada', timezone: 'America/Toronto' },
  calgary: { lat: 51.0447, lon: -114.0719, name: 'Calgary', country: 'Canada', timezone: 'America/Edmonton' },
  ottawa: { lat: 45.4215, lon: -75.6972, name: 'Ottawa', country: 'Canada', timezone: 'America/Toronto' },

  paris: { lat: 48.8566, lon: 2.3522, name: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  marseille: { lat: 43.2965, lon: 5.3698, name: 'Marseille', country: 'France', timezone: 'Europe/Paris' },
  lyon: { lat: 45.764, lon: 4.8357, name: 'Lyon', country: 'France', timezone: 'Europe/Paris' },

  berlin: { lat: 52.52, lon: 13.405, name: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin' },
  munich: { lat: 48.1351, lon: 11.582, name: 'Munich', country: 'Germany', timezone: 'Europe/Berlin' },
  frankfurt: { lat: 50.1109, lon: 8.6821, name: 'Frankfurt', country: 'Germany', timezone: 'Europe/Berlin' },
  hamburg: { lat: 53.5511, lon: 9.9937, name: 'Hamburg', country: 'Germany', timezone: 'Europe/Berlin' },

  rome: { lat: 41.9028, lon: 12.4964, name: 'Rome', country: 'Italy', timezone: 'Europe/Rome' },
  milan: { lat: 45.4642, lon: 9.19, name: 'Milan', country: 'Italy', timezone: 'Europe/Rome' },

  madrid: { lat: 40.4168, lon: -3.7038, name: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid' },
  barcelona: { lat: 41.3879, lon: 2.1699, name: 'Barcelona', country: 'Spain', timezone: 'Europe/Madrid' },

  amsterdam: { lat: 52.3676, lon: 4.9041, name: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam' },
  rotterdam: { lat: 51.9244, lon: 4.4777, name: 'Rotterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam' },
  brussels: { lat: 50.8503, lon: 4.3517, name: 'Brussels', country: 'Belgium', timezone: 'Europe/Brussels' },
  zurich: { lat: 47.3769, lon: 8.5417, name: 'Zurich', country: 'Switzerland', timezone: 'Europe/Zurich' },
  geneva: { lat: 46.2044, lon: 6.1432, name: 'Geneva', country: 'Switzerland', timezone: 'Europe/Zurich' },
  vienna: { lat: 48.2082, lon: 16.3738, name: 'Vienna', country: 'Austria', timezone: 'Europe/Vienna' },
  stockholm: { lat: 59.3293, lon: 18.0686, name: 'Stockholm', country: 'Sweden', timezone: 'Europe/Stockholm' },
  oslo: { lat: 59.9139, lon: 10.7522, name: 'Oslo', country: 'Norway', timezone: 'Europe/Oslo' },
  copenhagen: { lat: 55.6761, lon: 12.5683, name: 'Copenhagen', country: 'Denmark', timezone: 'Europe/Copenhagen' },
  helsinki: { lat: 60.1699, lon: 24.9384, name: 'Helsinki', country: 'Finland', timezone: 'Europe/Helsinki' },
  warsaw: { lat: 52.2297, lon: 21.0122, name: 'Warsaw', country: 'Poland', timezone: 'Europe/Warsaw' },
  athens: { lat: 37.9838, lon: 23.7275, name: 'Athens', country: 'Greece', timezone: 'Europe/Athens' },
  moscow: { lat: 55.7558, lon: 37.6173, name: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow' },
  istanbul: { lat: 41.0082, lon: 28.9784, name: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul' },

  dubai: { lat: 25.2048, lon: 55.2708, name: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  'abu dhabi': { lat: 24.4539, lon: 54.3773, name: 'Abu Dhabi', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  riyadh: { lat: 24.7136, lon: 46.6753, name: 'Riyadh', country: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  doha: { lat: 25.2854, lon: 51.531, name: 'Doha', country: 'Qatar', timezone: 'Asia/Qatar' },
  cairo: { lat: 30.0444, lon: 31.2357, name: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo' },
  johannesburg: { lat: -26.2041, lon: 28.0473, name: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg' },
  'cape town': { lat: -33.9249, lon: 18.4241, name: 'Cape Town', country: 'South Africa', timezone: 'Africa/Johannesburg' },
  nairobi: { lat: -1.2921, lon: 36.8219, name: 'Nairobi', country: 'Kenya', timezone: 'Africa/Nairobi' },
  lagos: { lat: 6.5244, lon: 3.3792, name: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos' },

  'sao paulo': { lat: -23.5505, lon: -46.6333, name: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  'rio de janeiro': { lat: -22.9068, lon: -43.1729, name: 'Rio de Janeiro', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  'buenos aires': { lat: -34.6037, lon: -58.3816, name: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  santiago: { lat: -33.4489, lon: -70.6693, name: 'Santiago', country: 'Chile', timezone: 'America/Santiago' },
  lima: { lat: -12.0464, lon: -77.0428, name: 'Lima', country: 'Peru', timezone: 'America/Lima' },
  bogota: { lat: 4.711, lon: -74.0721, name: 'Bogotá', country: 'Colombia', timezone: 'America/Bogota' },
  'mexico city': { lat: 19.4326, lon: -99.1332, name: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City' },

  sydney: { lat: -33.8688, lon: 151.2093, name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  melbourne: { lat: -37.8136, lon: 144.9631, name: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' },
  brisbane: { lat: -27.4698, lon: 153.0251, name: 'Brisbane', country: 'Australia', timezone: 'Australia/Brisbane' },
  perth: { lat: -31.9505, lon: 115.8605, name: 'Perth', country: 'Australia', timezone: 'Australia/Perth' },
  adelaide: { lat: -34.9285, lon: 138.6007, name: 'Adelaide', country: 'Australia', timezone: 'Australia/Adelaide' },
  auckland: { lat: -36.8485, lon: 174.7633, name: 'Auckland', country: 'New Zealand', timezone: 'Pacific/Auckland' },
  wellington: { lat: -41.2865, lon: 174.7762, name: 'Wellington', country: 'New Zealand', timezone: 'Pacific/Auckland' },

  seoul: { lat: 37.5665, lon: 126.978, name: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul' },
  beijing: { lat: 39.9042, lon: 116.4074, name: 'Beijing', country: 'China', timezone: 'Asia/Shanghai' },
  shanghai: { lat: 31.2304, lon: 121.4737, name: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' },
  shenzhen: { lat: 22.5431, lon: 114.0579, name: 'Shenzhen', country: 'China', timezone: 'Asia/Shanghai' },
  guangzhou: { lat: 23.1291, lon: 113.2644, name: 'Guangzhou', country: 'China', timezone: 'Asia/Shanghai' },
  taipei: { lat: 25.033, lon: 121.5654, name: 'Taipei', country: 'Taiwan', timezone: 'Asia/Taipei' },
  bangkok: { lat: 13.7563, lon: 100.5018, name: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' },
  jakarta: { lat: -6.2088, lon: 106.8456, name: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta' },
  bali: { lat: -8.4095, lon: 115.1889, name: 'Bali', country: 'Indonesia', timezone: 'Asia/Makassar' },
  manila: { lat: 14.5995, lon: 120.9842, name: 'Manila', country: 'Philippines', timezone: 'Asia/Manila' },
  hanoi: { lat: 21.0285, lon: 105.8542, name: 'Hanoi', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  'ho chi minh': { lat: 10.8231, lon: 106.6297, name: 'Ho Chi Minh City', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  'ho chi minh city': { lat: 10.8231, lon: 106.6297, name: 'Ho Chi Minh City', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  saigon: { lat: 10.8231, lon: 106.6297, name: 'Ho Chi Minh City', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },

  mumbai: { lat: 19.076, lon: 72.8777, name: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
  delhi: { lat: 28.6139, lon: 77.209, name: 'Delhi', country: 'India', timezone: 'Asia/Kolkata' },
  'new delhi': { lat: 28.6139, lon: 77.209, name: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' },
  bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru', country: 'India', timezone: 'Asia/Kolkata' },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru', country: 'India', timezone: 'Asia/Kolkata' },
  hyderabad: { lat: 17.385, lon: 78.4867, name: 'Hyderabad', country: 'India', timezone: 'Asia/Kolkata' },
  chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai', country: 'India', timezone: 'Asia/Kolkata' },
  kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata' },
  karachi: { lat: 24.8607, lon: 67.0011, name: 'Karachi', country: 'Pakistan', timezone: 'Asia/Karachi' },
  lahore: { lat: 31.5204, lon: 74.3587, name: 'Lahore', country: 'Pakistan', timezone: 'Asia/Karachi' },
  dhaka: { lat: 23.8103, lon: 90.4125, name: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka' },
};

// Common timezone abbreviations
const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  pst: 'America/Los_Angeles',
  pdt: 'America/Los_Angeles',
  est: 'America/New_York',
  edt: 'America/New_York',
  cst: 'America/Chicago',
  cdt: 'America/Chicago',
  mst: 'America/Denver',
  mdt: 'America/Denver',
  akst: 'America/Anchorage',
  akdt: 'America/Anchorage',
  hst: 'Pacific/Honolulu',
  gmt: 'UTC',
  utc: 'UTC',
  z: 'UTC',
  bst: 'Europe/London',
  cet: 'Europe/Paris',
  cest: 'Europe/Paris',
  eet: 'Europe/Athens',
  eest: 'Europe/Athens',
  msk: 'Europe/Moscow',
  ist: 'Asia/Kolkata',
  jst: 'Asia/Tokyo',
  kst: 'Asia/Seoul',
  hkt: 'Asia/Hong_Kong',
  sgt: 'Asia/Singapore',
  myt: 'Asia/Kuala_Lumpur',
  wib: 'Asia/Jakarta',
  wita: 'Asia/Makassar',
  wit: 'Asia/Jayapura',
  ict: 'Asia/Bangkok',
  pht: 'Asia/Manila',
  aest: 'Australia/Sydney',
  aedt: 'Australia/Sydney',
  acst: 'Australia/Adelaide',
  acdt: 'Australia/Adelaide',
  awst: 'Australia/Perth',
  nzst: 'Pacific/Auckland',
  nzdt: 'Pacific/Auckland',
  cat: 'Africa/Johannesburg',
  eat: 'Africa/Nairobi',
  wat: 'Africa/Lagos',
  brt: 'America/Sao_Paulo',
  art: 'America/Argentina/Buenos_Aires',
};

function isValidIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

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
   * Cleans location search query by stripping common time intent phrases
   */
  public cleanLocationQuery(query: string): string {
    let clean = query.trim().replace(/^["']|["']$/g, '');
    clean = clean.replace(/^(?:what(?:'s| is) the )?(?:local |current |exact |latest )?time (?:in |for |at |of )?/i, '');
    clean = clean.replace(/^(?:what time is it in |time in |time for |time at |time of )/i, '');
    clean = clean.replace(/(?: (?:local )?time(?: now)?| current time| timezone| right now| now| today|\?)+$/i, '');
    clean = clean.trim();
    return clean || query.trim();
  }

  /**
   * Resolve location name to accurate latitude, longitude, and true local IANA timezone
   */
  public async resolveLocation(rawQuery: string): Promise<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }> {
    const query = this.cleanLocationQuery(rawQuery);
    const key = query.toLowerCase();

    // 1. Check comprehensive offline registry of countries and cities (instant 0ms resolution)
    if (GLOBAL_LOCATION_REGISTRY[key]) {
      const entry = GLOBAL_LOCATION_REGISTRY[key];
      return {
        name: entry.name,
        country: entry.country,
        latitude: entry.lat,
        longitude: entry.lon,
        timezone: entry.timezone,
      };
    }

    // 2. Common timezone abbreviation match (e.g. "PST", "JST", "MYT", "SGT")
    if (TIMEZONE_ABBREVIATIONS[key]) {
      const mappedTz = TIMEZONE_ABBREVIATIONS[key];
      const parts = mappedTz.split('/');
      return {
        name: key.toUpperCase(),
        country: parts[0] || 'Global',
        latitude: 0,
        longitude: 0,
        timezone: mappedTz,
      };
    }

    // 3. Direct IANA timezone match (e.g. "Asia/Tokyo", "America/New_York", "Europe/London")
    if (isValidIanaTimezone(query)) {
      const parts = query.split('/');
      const cityPart = parts[parts.length - 1].replace(/_/g, ' ');
      const regionPart = parts.length > 1 ? parts[0].replace(/_/g, ' ') : '';
      return {
        name: cityPart,
        country: regionPart,
        latitude: 0,
        longitude: 0,
        timezone: query,
      };
    }

    // 4. Query Open-Meteo Geocoding Search API
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
          let timezone = r.timezone;

          // If the geocoded entity (such as a country like Malaysia or US) has no timezone or returned generic UTC,
          // dynamically resolve the exact local timezone using coordinates via Open-Meteo's polygon lookup
          if (!timezone || timezone === 'UTC') {
            try {
              const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${r.latitude}&longitude=${r.longitude}&timezone=auto`;
              const forecastRes = await fetch(forecastUrl, { signal: AbortSignal.timeout(3000) });
              if (forecastRes.ok) {
                const forecastData = await forecastRes.json();
                if (forecastData.timezone && isValidIanaTimezone(forecastData.timezone)) {
                  timezone = forecastData.timezone;
                }
              }
            } catch {
              // Ignore forecast lookup failure
            }
          }

          // If still no valid timezone, compute estimated timezone from longitude
          if (!timezone || !isValidIanaTimezone(timezone)) {
            timezone = this.estimateTimezoneFromCoordinates(r.latitude, r.longitude);
          }

          return {
            name: r.name,
            country: r.country || '',
            latitude: r.latitude,
            longitude: r.longitude,
            timezone,
          };
        }
      }
    } catch {
      // Ignore network errors and proceed to fallback
    }

    // 5. Fallback: estimate from coordinates or default
    return {
      name: query.charAt(0).toUpperCase() + query.slice(1),
      country: '',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
    };
  }

  /**
   * Helper to estimate timezone when geocoding has coordinates but no polygon mapping
   */
  private estimateTimezoneFromCoordinates(lat: number, lon: number): string {
    const rawOffset = Math.round(lon / 15);
    // Return standard UTC or major region zone
    if (rawOffset >= 7 && rawOffset <= 9 && lat > -15 && lat < 30) return 'Asia/Singapore';
    if (rawOffset === 9 && lat > 20) return 'Asia/Tokyo';
    if (rawOffset === 8) return 'Asia/Shanghai';
    if (rawOffset === 0 && lat > 45) return 'Europe/London';
    if (rawOffset === 1 && lat > 35) return 'Europe/Paris';
    if (rawOffset === -5 && lat > 20) return 'America/New_York';
    if (rawOffset === -8 && lat > 20) return 'America/Los_Angeles';
    if (rawOffset === 5 && lat > 5 && lat < 35) return 'Asia/Kolkata';
    return 'UTC';
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
   * Get accurate real-time time information for any location, city, country, or timezone
   */
  public async getTime(locationQuery: string): Promise<TimeData> {
    const geo = await this.resolveLocation(locationQuery);
    const timezone = geo.timezone || 'UTC';
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

    // Extract exact UTC offset (e.g. GMT+8, GMT-4, GMT+5:30)
    let utcOffset = 'UTC';
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset',
      }).formatToParts(now);
      const offsetPart = parts.find((p) => p.type === 'timeZoneName');
      if (offsetPart && offsetPart.value) {
        utcOffset = offsetPart.value;
      }
    } catch {
      const formattedLong = fullFormatter.format(now);
      const gmtMatch = formattedLong.match(/GMT[+-]?\d+(?::\d+)?/);
      utcOffset = gmtMatch ? gmtMatch[0] : 'UTC';
    }

    // Extract descriptive timezone name (e.g. "Malaysia Time", "Japan Standard Time")
    let timeZoneName = '';
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'long',
      }).formatToParts(now);
      const tzPart = parts.find((p) => p.type === 'timeZoneName');
      if (tzPart && tzPart.value) {
        timeZoneName = tzPart.value;
      }
    } catch {
      timeZoneName = timezone;
    }

    // Calculate numeric UTC offset hours
    let utcOffsetHours = 0;
    const match = utcOffset.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (match) {
      const sign = match[1] === '-' ? -1 : 1;
      const hours = parseInt(match[2], 10);
      const mins = match[3] ? parseInt(match[3], 10) / 60 : 0;
      utcOffsetHours = sign * (hours + mins);
    }

    // ISO string formatted for local time
    const localNow = new Date(now.getTime() + utcOffsetHours * 3600 * 1000);
    const offsetStr = utcOffset === 'UTC' || utcOffsetHours === 0
      ? 'Z'
      : `${utcOffsetHours >= 0 ? '+' : '-'}${String(Math.floor(Math.abs(utcOffsetHours))).padStart(2, '0')}:${String(
          Math.round((Math.abs(utcOffsetHours) % 1) * 60)
        ).padStart(2, '0')}`;
    const isoString = localNow.toISOString().replace('Z', '') + offsetStr;

    return {
      location: geo.name,
      country: geo.country || undefined,
      timezone,
      timeZoneName,
      abbreviation: utcOffset,
      currentTimeFormatted: fullFormatter.format(now),
      time12h: time12Formatter.format(now),
      time24h: time24Formatter.format(now),
      dateFormatted: dateFormatter.format(now),
      dayOfWeek: dayOfWeekFormatter.format(now),
      utcOffset,
      utcOffsetHours,
      unixTimestamp: Math.floor(now.getTime() / 1000),
      isDaytime,
      isoString,
    };
  }

  /**
   * Detects if a search query contains weather or time intent
   */
  public detectIntent(query: string): { type: 'weather' | 'time' | null; location: string } {
    const q = query.trim().toLowerCase();

    // Check Weather intent
    const weatherPatterns = [
      /^(?:what(?:'s| is) the )?(?:current |latest )?weather (?:in |for |at |of )?(.+)$/i,
      /^weather (?:in |for |at |of )?(.+)$/i,
      /^temperature (?:in |for |at |of )?(.+)$/i,
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
      /^(?:what(?:'s| is) the )?(?:current |latest |local |exact )?time (?:in |for |at |of )?(.+)$/i,
      /^time (?:in |for |at |of )?(.+)$/i,
      /^what time is it (?:in |at |for )?(.+)$/i,
      /^current time (?:in |at )?(.+)$/i,
      /^local time (?:in |at )?(.+)$/i,
      /^timezone (?:in |of |for |at )?(.+)$/i,
      /^(.+) (?:local )?time(?: now)?$/i,
      /^(.+) timezone$/i,
    ];

    for (const pat of timePatterns) {
      const match = q.match(pat);
      if (match && match[1]) {
        const loc = match[1].replace(/now|today|currently|please|right now|\?/gi, '').trim();
        if (loc.length > 1) {
          return { type: 'time', location: loc };
        }
      }
    }

    return { type: null, location: '' };
  }
}

export const weatherTimeService = new WeatherTimeService();

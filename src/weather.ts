export type Coordinates = { latitude: number; longitude: number };

export type HourlyWeather = {
  time: string[];
  temperature_2m?: number[];
  apparent_temperature?: number[];
  precipitation_probability?: number[];
  rain?: number[];
  relative_humidity_2m?: number[];
  wind_speed_10m?: number[];
};

export type WeatherResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: HourlyWeather;
};

export interface WeatherCache {
  get(key: string): WeatherResponse | undefined;
  set(key: string, value: WeatherResponse, ttlMs: number): void;
}

export class MemoryWeatherCache implements WeatherCache {
  private readonly entries = new Map<string, { value: WeatherResponse; expiresAt: number }>();

  get(key: string): WeatherResponse | undefined {
    const entry = this.entries.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: WeatherResponse, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

export function roundCoordinates(coordinates: Coordinates, decimals = 2): Coordinates {
  if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
    throw new Error("Coordinates must be finite numbers");
  }
  const factor = 10 ** decimals;
  return {
    latitude: Math.round(coordinates.latitude * factor) / factor,
    longitude: Math.round(coordinates.longitude * factor) / factor
  };
}

export function weatherCacheKey(coordinates: Coordinates, date: string, decimals = 2): string {
  const rounded = roundCoordinates(coordinates, decimals);
  return `${rounded.latitude.toFixed(decimals)},${rounded.longitude.toFixed(decimals)}:${date}`;
}

export type WeatherClientOptions = {
  fetch?: typeof globalThis.fetch;
  cache?: WeatherCache;
  cacheTtlMs?: number;
  endpoint?: string;
  coordinateDecimals?: number;
};

export class OpenMeteoClient {
  private readonly fetcher: typeof globalThis.fetch;
  private readonly cache: WeatherCache;
  private readonly cacheTtlMs: number;
  private readonly endpoint: string;
  private readonly coordinateDecimals: number;

  constructor(options: WeatherClientOptions = {}) {
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.cache = options.cache ?? new MemoryWeatherCache();
    this.cacheTtlMs = options.cacheTtlMs ?? 30 * 60 * 1000;
    this.endpoint = options.endpoint ?? "https://api.open-meteo.com/v1/forecast";
    this.coordinateDecimals = options.coordinateDecimals ?? 2;
  }

  async forecast(coordinates: Coordinates, date: string): Promise<WeatherResponse> {
    const rounded = roundCoordinates(coordinates, this.coordinateDecimals);
    const key = weatherCacheKey(rounded, date, this.coordinateDecimals);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const params = new URLSearchParams({
      latitude: String(rounded.latitude),
      longitude: String(rounded.longitude),
      hourly: "temperature_2m,apparent_temperature,precipitation_probability,rain,relative_humidity_2m,wind_speed_10m",
      start_date: date,
      end_date: date,
      timezone: "auto"
    });
    const response = await this.fetcher(`${this.endpoint}?${params}`);
    if (!response.ok) throw new Error(`Open-Meteo request failed (${response.status})`);
    const weather = await response.json() as WeatherResponse;
    this.cache.set(key, weather, this.cacheTtlMs);
    return weather;
  }
}

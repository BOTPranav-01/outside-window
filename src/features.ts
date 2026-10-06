import type { Coordinates } from "./weather.js";

export type WeatherFeatures = {
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationProbability: number;
  rainMm: number;
  humidity: number;
  windKmh: number;
};

export type FeatureObservation = {
  observedAt: string;
  went: boolean;
  coordinates?: Coordinates;
  weather?: Partial<WeatherFeatures>;
};

export type FeatureRow = WeatherFeatures & {
  hour: number;
  dayOfWeek: number;
  latitude?: number;
  longitude?: number;
  label: 0 | 1;
};

const numberOr = (value: number | undefined, fallback: number): number =>
  Number.isFinite(value) ? value as number : fallback;

export function buildFeatureRow(observation: FeatureObservation): FeatureRow {
  const date = new Date(observation.observedAt);
  if (Number.isNaN(date.valueOf())) throw new Error("observedAt must be a valid ISO date");
  const weather = observation.weather ?? {};
  return {
    hour: date.getHours(),
    dayOfWeek: date.getDay(),
    temperatureC: numberOr(weather.temperatureC, 0),
    apparentTemperatureC: numberOr(weather.apparentTemperatureC, numberOr(weather.temperatureC, 0)),
    precipitationProbability: numberOr(weather.precipitationProbability, 0),
    rainMm: numberOr(weather.rainMm, 0),
    humidity: numberOr(weather.humidity, 0),
    windKmh: numberOr(weather.windKmh, 0),
    latitude: observation.coordinates?.latitude,
    longitude: observation.coordinates?.longitude,
    label: observation.went ? 1 : 0
  };
}

export function buildFeatures(observations: FeatureObservation[]): FeatureRow[] {
  return observations.map(buildFeatureRow);
}

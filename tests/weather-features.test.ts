import { describe, expect, it, vi } from "vitest";
import { buildFeatureRow } from "../src/features.js";
import { OpenMeteoClient, roundCoordinates } from "../src/weather.js";

describe("Milestone 2 weather and features", () => {
  it("rounds coordinates before creating a cacheable request", () => {
    expect(roundCoordinates({ latitude: 12.97161, longitude: 77.59462 })).toEqual({
      latitude: 12.97, longitude: 77.59
    });
  });

  it("reuses a forecast for the same coarse location and date", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      latitude: 12.97, longitude: 77.59, timezone: "Asia/Calcutta", hourly: { time: [] }
    }), { status: 200 }));
    const client = new OpenMeteoClient({ fetch: fetcher });
    await client.forecast({ latitude: 12.97161, longitude: 77.59462 }, "2026-10-07");
    await client.forecast({ latitude: 12.972, longitude: 77.593 }, "2026-10-07");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("builds a stable, labelled row with weather defaults", () => {
    expect(buildFeatureRow({ observedAt: "2026-10-07T18:00:00+05:30", went: true })).toMatchObject({
      hour: 18, temperatureC: 0, precipitationProbability: 0, label: 1
    });
  });
});

# Outside Window — DEV Hacktoberfest 2026 submission draft

## What I Built

Outside Window is a personal agent that will learn the best time today for one
small outdoor break. It is designed around a one-tap or voice check-in rather
than a dashboard: predict a window, send a short nudge, suggest a ten-minute
micro-quest, and learn from went/skipped.

## Demo

Local demo: run `npm install`, `npm test`, `npm run seed`, then `npm run dev`
and open `http://localhost:8787/`. The screen recommends a window, generates a
validated ten-minute quest through Gemma when Ollama is available (with an
offline fallback), and records a one-tap went/skipped check-in locally.

## Code

Repository: TODO — add the public repository URL before publishing.

## How I Built It

The TypeScript Hono API writes a local SQLite log and exposes CSV export. A
Gemma provider adapter requests strict JSON and validates it with Zod. A Python
FastAPI sidecar is reserved for TabPFN evaluation. Open-Meteo, Temporal,
ElevenLabs, Sentry, and Render are optional integrations. External calls stay
coarse, optional, and inspectable.

## Why Does Open Innovation Matter?

The useful part of a personal agent is not a black-box score. It is the ability
to inspect the features, own the event history, swap the model, and run the
offline path without sending a life log to a vendor.

## My Agent Session

TODO — add the public session link if one is shared.

## Prize Categories

Gemma · TabPFN · Render · Temporal · Entire · ElevenLabs · Sentry · GitHub Copilot

## Limitations and disclosure

This is an agent-assisted, new-work project. Synthetic seed rows are marked and
will not be used as real evidence. Accuracy requires real observations. Weather
coordinates and optional TTS text are the only planned user-adjacent external
calls; the privacy details and costs are documented in the README.

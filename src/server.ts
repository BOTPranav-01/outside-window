import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { openDatabase, addOuting, listOutings } from "./db.js";
import { outingInput } from "./contracts.js";
import { generateQuest } from "./agent.js";
import { advanceUserDay, resumeUserDay } from "./workflow.js";

const app = new Hono();
const db = openDatabase(process.env.DATABASE_PATH ?? "./data/outside-window.db");

app.get("/health", (c) => c.json({ ok: true, service: "outside-window-api" }));

app.get("/api/outings", (c) => c.json({ outings: listOutings(db) }));

app.get("/api/today", async (c) => {
  const now = new Date();
  const hour = now.getHours() < 12 ? 8 : now.getHours() < 17 ? 17 : 18;
  const userDay = now.toISOString().slice(0, 10);
  const state = resumeUserDay(db, userDay, hour);
  const quest = await generateQuest(`recommended hour ${hour}, weekday ${now.getDay()}`);
  return c.json({
    userDay, recommendedWindow: `${String(hour).padStart(2, "0")}:00`,
    confidence: "demo heuristic until enough real observations exist",
    state, quest
  });
});

app.post("/api/outings", async (c) => {
  const parsed = outingInput.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const id = addOuting(db, parsed.data);
  advanceUserDay(db, new Date(parsed.data.observedAt).toISOString().slice(0, 10), "checked_in", new Date(parsed.data.observedAt).getHours());
  return c.json({ id, outing: parsed.data }, 201);
});

app.get("/api/export", (c) => {
  const csv = ["observedAt,went,source,note", ...listOutings(db).map((o) =>
    [o.observedAt, o.went, o.source, o.note ?? ""].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")
  )].join("\n") + "\n";
  return c.body(csv, 200, { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=outside-window.csv" });
});

app.get("/debug", (c) => c.html(
  "<h1>Outside Window debug</h1><p>Tracing is enabled when SENTRY_DSN is configured.</p>" +
  "<p><a href='/health'>Health</a> · <a href='/api/outings'>Outing log</a></p>"
));

app.get("/", (c) => c.html(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Outside Window</title><style>
body{font:16px system-ui;max-width:620px;margin:0 auto;padding:28px;background:#f4f7f2;color:#17351f}
main{background:white;border-radius:20px;padding:28px;box-shadow:0 8px 30px #17351f18}h1{font-size:40px;margin:0 0 8px}
.eyebrow{color:#36734a;font-weight:700}.window{font-size:64px;font-weight:800;margin:18px 0}
button{border:0;border-radius:999px;padding:14px 22px;margin:6px;background:#1d6b3c;color:white;font-weight:700;cursor:pointer}
button.secondary{background:#e1ede3;color:#17351f}.quest{border-left:4px solid #76b486;padding-left:16px}
</style></head><body><main><div class="eyebrow">TOUCH GRASS, GENTLY</div><h1>Outside Window</h1>
<p id="status">Finding a realistic window for today…</p><div class="window" id="window">—</div>
<section class="quest"><h2 id="title">Your micro-quest</h2><ol id="steps"></ol><p id="safety"></p></section>
<button onclick="check(true)">I went outside</button><button class="secondary" onclick="check(false)">Not today</button>
<p><a href="/api/export">Export my data</a> · <a href="/debug">Debug</a></p>
<script>
async function load(){const d=await fetch('/api/today').then(r=>r.json());window.today=d;
document.querySelector('#window').textContent=d.recommendedWindow;document.querySelector('#status').textContent=d.confidence;
document.querySelector('#title').textContent=d.quest.title;document.querySelector('#steps').innerHTML=d.quest.steps.map(x=>'<li>'+x+'</li>').join('');
document.querySelector('#safety').textContent=d.quest.safetyNote}
async function check(went){await fetch('/api/outings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({observedAt:new Date().toISOString(),went,note:'One-tap check-in'})});document.querySelector('#status').textContent=went?'Logged — nice work.':'Logged — no guilt, the model learns.'}
load();
</script></main></body></html>`));

const port = Number(process.env.PORT ?? 8787);
if (process.env.NODE_ENV !== "test") {
  serve({ fetch: app.fetch, port });
  console.log(`Outside Window listening on http://localhost:${port}`);
}

export { app };

import { openDatabase, addOuting } from "../src/db.js";

const db = openDatabase(process.env.DATABASE_PATH ?? "./data/outside-window.db");
const rows = [
  { observedAt: "2026-10-05T18:00:00+05:30", went: true, note: "Synthetic demo row" },
  { observedAt: "2026-10-06T18:00:00+05:30", went: false, note: "Synthetic demo row" }
];
for (const row of rows) addOuting(db, { ...row, source: "synthetic" });
console.log(`Inserted ${rows.length} synthetic rows; replace them with real user observations.`);

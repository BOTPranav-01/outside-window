import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { openDatabase, addOuting, listOutings } from "../src/db.js";

const db = openDatabase(process.env.DATABASE_PATH ?? "./data/outside-window.db");
const file = process.argv[3] ?? "./exports/outings.csv";
const command = process.argv[2];

if (command === "export") {
  const csv = ["observedAt,went,source,note", ...listOutings(db).map((o) =>
    [o.observedAt, o.went, o.source, o.note ?? ""].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")
  )].join("\n") + "\n";
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, csv);
  console.log(`Exported ${listOutings(db).length} outings to ${file}`);
} else if (command === "import") {
  const lines = readFileSync(file, "utf8").trim().split(/\r?\n/).slice(1);
  for (const line of lines) {
    const [observedAt, went, source, note] = line.split(",").map((v) => v.replace(/^"|"$/g, ""));
    addOuting(db, { observedAt, went: went === "true", source: source === "synthetic" ? "synthetic" : "user", note });
  }
  console.log(`Imported ${lines.length} outings from ${file}`);
} else {
  throw new Error("Usage: npm run csv:export -- [path] or npm run csv:import -- [path]");
}

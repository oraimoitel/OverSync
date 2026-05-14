import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load `node:sqlite` via createRequire so Vite/Vitest do not try to
// transform the import. This module is built into Node 22.5+/24.x and
// is the recommended zero-install SQLite driver.
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite") as typeof import("node:sqlite");

export type Database = InstanceType<typeof DatabaseSync>;

/**
 * Open (or create) the coordinator's SQLite database and apply the
 * schema. The schema is idempotent so calling this on an existing DB
 * is safe.
 *
 * The DB is treated as a CACHE of on-chain state. If it is lost or
 * corrupted, the coordinator can rebuild it by re-reading events from
 * both chains.
 */
export function openDatabase(url: string): Database {
  const filename = url.startsWith("file:") ? url.slice("file:".length) : url;
  const db = new DatabaseSync(filename);
  const schema = readFileSync(resolve(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
  return db;
}

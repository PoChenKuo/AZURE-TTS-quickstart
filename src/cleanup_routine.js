import fs from "fs/promises";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const STALE_MS = 3 * 60 * 1000;
const POLL_MS = 60 * 1000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const audioDir = path.resolve(projectRoot, "data", "audio");
const dbDir = path.resolve(projectRoot, "data", "db");
mkdirSync(audioDir, { recursive: true });
mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, "syntheses.db");

const db = new Database(dbPath);
db.exec(`
    CREATE TABLE IF NOT EXISTS syntheses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        utterance TEXT NOT NULL,
        created_utc TEXT NOT NULL,
        updated_utc TEXT NOT NULL
    )
`);
const selectStale = db.prepare(`
    SELECT id, filename, created_utc
    FROM syntheses
    WHERE created_utc <= ?
`);
const deleteRow = db.prepare("DELETE FROM syntheses WHERE id = ?");

function cutoffIso() {
    return new Date(Date.now() - STALE_MS).toISOString();
}

async function deleteFileIfPresent(fullPath) {
    try {
        await fs.unlink(fullPath);
        console.log(`Deleted file: ${fullPath}`);
        return true;
    }
    catch (err) {
        if (err.code === "ENOENT") {
            console.warn(`File already missing: ${fullPath}`);
            return false;
        }
        console.error(`Failed to delete ${fullPath}: ${err.message}`);
        return false;
    }
}

async function cleanupOnce() {
    const rows = selectStale.all(cutoffIso());
    if (!rows.length) {
        console.log(`[${new Date().toISOString()}] No expired syntheses found.`);
        return;
    }

    console.log(`[${new Date().toISOString()}] Found ${rows.length} expired syntheses. Cleaning up...`);
    for (const row of rows) {
        const wavPath = path.join(audioDir, row.filename);
        await deleteFileIfPresent(wavPath);
        deleteRow.run(row.id);
        console.log(`Removed DB entry #${row.id} (${row.filename}) created at ${row.created_utc}`);
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mainLoop() {
    while (true) {
        await cleanupOnce();
        await delay(POLL_MS);
    }
}

function shutdown(code = 0) {
    try {
        db.close();
    }
    catch (err) {
        console.error(`Failed to close database: ${err.message}`);
    }
    process.exit(code);
}

process.on("SIGINT", () => {
    console.log("Received SIGINT. Exiting cleanup routine.");
    shutdown(0);
});

process.on("SIGTERM", () => {
    console.log("Received SIGTERM. Exiting cleanup routine.");
    shutdown(0);
});

mainLoop().catch((err) => {
    console.error(`Cleanup routine crashed: ${err.message}`);
    shutdown(1);
});

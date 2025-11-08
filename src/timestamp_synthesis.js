import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

function usageAndExit() {
    console.error("Usage: node src/timestamp_synthesis.js <text-to-synthesize>");
    process.exit(1);
}

const text = process.argv.slice(2).join(" ").trim();
if (!text) {
    usageAndExit();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const synthesisScript = path.resolve(__dirname, "synthesis.js");
const projectRoot = path.resolve(__dirname, "..");
const audioDir = path.resolve(projectRoot, "data", "audio");
const dbDir = path.resolve(projectRoot, "data", "db");
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(dbDir, { recursive: true });
const logDbPath = path.join(dbDir, "syntheses.db");

const timestamp = Date.now();
const outputFileName = `synthesis-${timestamp}.wav`;
const outputFilePath = path.join(audioDir, outputFileName);

const db = new Database(logDbPath);
db.exec(`
    CREATE TABLE IF NOT EXISTS syntheses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        utterance TEXT NOT NULL,
        created_utc TEXT NOT NULL,
        updated_utc TEXT NOT NULL
    )
`);

function ensureUpdatedColumn() {
    const columns = db.prepare("PRAGMA table_info(syntheses)").all();
    const hasUpdated = columns.some((column) => column.name === "updated_utc");
    if (!hasUpdated) {
        db.exec(`
            ALTER TABLE syntheses
            ADD COLUMN updated_utc TEXT NOT NULL DEFAULT ''
        `);
        db.exec(`
            UPDATE syntheses
            SET updated_utc = created_utc
            WHERE updated_utc = ''
        `);
    }
}

ensureUpdatedColumn();

const insertStatement = db.prepare("INSERT INTO syntheses (filename, utterance, created_utc, updated_utc) VALUES (?, ?, ?, ?)");

function closeDbSafely() {
    try {
        db.close();
    }
    catch (err) {
        console.error(`Failed to close syntheses database: ${err.message}`);
    }
}

console.log(`Creating audio file: ${outputFilePath}`);
console.log(`Text: ${text}`);

const child = spawn(
    process.execPath,
    [synthesisScript, outputFilePath, text],
    { stdio: "inherit" }
);

child.on("error", (err) => {
    console.error(`Failed to start synthesis: ${err.message}`);
    closeDbSafely();
    process.exit(1);
});

child.on("exit", (code) => {
    if (code === 0) {
        try {
            const createdUtc = new Date(timestamp).toISOString();
            const updatedUtc = new Date().toISOString();
            insertStatement.run(outputFileName, text, createdUtc, updatedUtc);
            console.log(`Logged synthesis in SQLite at ${logDbPath}`);
        }
        catch (err) {
            console.error(`Failed to log synthesis details: ${err.message}`);
        }
    }
    closeDbSafely();
    process.exit(code ?? 1);
});

# Synthesis Quickstart

Minimal Node.js sample that uses the Microsoft Cognitive Services Speech SDK to synthesize text into an audio file.

## Prerequisites

- Node.js 18+
- Azure AI Foundry (Speech service) resource with a valid `SPEECH_KEY` and custom `ENDPOINT`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. In Azure AI Foundry, provision a Speech resource and gather the corresponding endpoint/key/region, then create a `.env` file in the project root with:
   ```ini
   SPEECH_KEY=<your-speech-key>
   ENDPOINT=<https-endpoint-from-azure>
   SPEECH_REGION=<azure-region-of-your-speech-resource>
   ```

## Project structure

```
project-root/
  src/
    synthesis.js
    timestamp_synthesis.js
    cleanup_routine.js
  data/
    audio/        # generated WAV files
    db/           # SQLite database (syntheses.db)
  .env
  package.json
  README.md
```

All executable scripts now live under `src/`, while generated artifacts (audio + SQLite DB) live under `data/`.

## Usage

Supply the output WAV path followed by the text you want to synthesize:

```bash
node src/synthesis.js data/audio/output.wav "Hello from the Speech SDK"
```

The synthesized audio is written to whichever path you provide (the example keeps everything under `data/audio`). Any missing arguments will cause the script to print the usage guidance and exit.

### Timestamp helper + SQLite log

If you prefer automatic timestamped filenames (UTC) and would like each run recorded in a SQLite database (`syntheses.db`), use:

```bash
node src/timestamp_synthesis.js "Hello from the Speech SDK"
```

Each invocation produces a WAV named `synthesis-<unix-milliseconds>.wav` inside `data/audio/`, then inserts a row into `data/db/syntheses.db` that captures the filename, original text, plus `created_utc` and `updated_utc` timestamps.

**Usage**

1. Ensure `.env` is populated with valid `SPEECH_KEY` and `ENDPOINT`.
2. Run `node src/timestamp_synthesis.js "your text"`.
3. The resulting WAV appears in `data/audio/` (name matches the Unix-millisecond timestamp).
4. (Optional) Inspect the log with `npx better-sqlite3 data/db/syntheses.db "SELECT * FROM syntheses ORDER BY id DESC LIMIT 5;"`.

**Manual notes**

- Keep WAV files inside `data/audio/` if you want `cleanup_routine.js` to remove them automatically; it looks for files in that directory using the stored filename.
- To remove a single entry manually, delete the WAV and run `npx better-sqlite3 data/db/syntheses.db "DELETE FROM syntheses WHERE filename='synthesis-<timestamp>.wav';"`.

### Cleanup routine

To remove WAV files (and their DB entries) that are more than 3 minutes old, run the looping cleanup helper:

```bash
node src/cleanup_routine.js
```

It wakes up every minute, finds rows where `created_utc` is older than 3 minutes, deletes the corresponding WAV from `data/audio/`, and then deletes the row from `data/db/syntheses.db`. Use `Ctrl+C` to stop the routine when you're done.

**Usage**

1. Open a separate terminal window/tab.
2. Run `node src/cleanup_routine.js`.
3. Leave it running to continuously purge stale audio; the script logs every deletion.
4. Stop with `Ctrl+C` when cleanup is no longer needed.

**Manual notes**

- Adjust the retention window by editing `STALE_MS` near the top of `src/cleanup_routine.js`.
- If you prefer a one-off cleanup, run the script, wait for the first pass to finish (it logs "No expired syntheses" or the deletions), then press `Ctrl+C`.

### Combined console (main.js)

For a single console experience that keeps the cleanup routine running and provides a text input prompt for on-demand synthesis, use:

```bash
node src/main.js
```

- The cleanup worker starts automatically (logs appear in the same terminal).
- You’ll see `Enter text (or /exit):` — type any utterance and press Enter to trigger `timestamp_synthesis` in the background.
- Type `/exit` (or press `Ctrl+C`) to stop both the prompt and the cleanup worker gracefully.
- Cleanup messages are prefixed with `[cleanup]` and are printed above the input prompt so your typing stays uninterrupted.

## Voice Selection

The sample defaults to the `zh-TW-HsiaoChenNeural` voice. You can change `speechConfig.speechSynthesisVoiceName` in `src/synthesis.js` to any supported Azure AI Foundry speech voice. See the catalog at https://learn.microsoft.com/en-us/azure/ai-services/speech-service/openai-voices for available options and IDs.

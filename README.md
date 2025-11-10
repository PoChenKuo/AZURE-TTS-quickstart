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

## Browser SPA (client-only web prototype)

A companion web experience now lives under `web/`. It is a Vite + React + TypeScript single-page app that keeps everything client-side:

- IndexedDB (via Dexie) stores settings, voices, chats, worker logs, audio blobs, and per-chat metadata (SHA-256 IDs + Gemini cache text).
- Three routes are available: `/settings`, `/manager`, and `/conversation`.
- Gemini replies can be turned into audio previews via Azure Speech REST or a local waveform fallback when Azure credentials are missing.
- The Conversation page now ships with a ChatGPT-style session list so you can juggle multiple chats, rename them, and inspect their metadata instantly.

### Run locally

```bash
cd web
npm install        # first run only
npm run dev        # launches Vite dev server on http://localhost:5173
```

For a production build (used by CI/local smoke tests):

```bash
cd web
npm run build
npm run preview    # optional: serves the dist build locally
```

Settings, voices, and audio blobs stay in your browser profile. Use the **Settings** page to paste keys/endpoints before heading to the **Conversation** tab.

#### Conversation cache chain (web/)

1. `useChatSessionSelection` (web/src/hooks/useChatSessionSelection.ts) keeps a per-tab `activeSessionId`, bootstraps a session if none exist, and ensures the current selection always points to a live `chatSessions` row.
2. Each session row stores a serialized cache descriptor `{ name, hash }` in `chatSessions.geminiCache`. `parseSessionGeminiCacheState` surfaces that metadata so the Conversation header can display the active `cachedContents/...` resource.
3. When the user sends a prompt, `useConversationMutation` (web/src/hooks/useConversationMutation.ts) slices the history via `partitionHistoryForCache` / `fingerprintHistory` (web/src/lib/conversationHistory.ts). The hash distinguishes one chat's cached prefix from another, even if their text briefly matches.
4. The hook builds `GeminiCallOptions`: if the stored hash matches the freshly computed one, the cached content name is reused; otherwise it is omitted so `callGemini` is forced to mint a new cache.
5. `callGemini` (web/src/lib/gemini.ts) creates the cache with `ai.caches.create`, attaches the returned name through `config.cachedContent`, and automatically retries when Gemini reports an expired cache. Every chat therefore references only its own cached context.
6. On success, `useConversationMutation` persists the new `{ name, hash }` pair via `saveSessionGeminiCache`, keeping Dexie in sync. When a chat is deleted, its cache pointer disappears with the row, so other sessions remain unaffected.

This chain keeps the cache lifecycle transparent (displayed in the UI), resilient (auto-refresh on expiry), and scoped per chat without any server components.

#### Web workflow (high-level architecture)

1. **State + storage**  
   - Dexie models (`web/src/db/database.ts`) back all persistent data: settings, sessions, chats, audio blobs, worker logs.  
   - React components subscribe through `use*` hooks in `web/src/db/hooks.ts`, so UI re-renders whenever IndexedDB changes.
2. **User interaction loop**  
   - ConversationPage (`web/src/pages/ConversationPage.tsx`) wires store data, selection state, and UI-only controls (autoplay, composer) while delegating complex behavior to hooks.  
   - SessionSidebar (`web/src/components/SessionSidebar.tsx`) handles CRUD on chat rows; MessageComposer emits submit events; ConversationLog renders messages/audio previews.
3. **Request pipeline**  
   - `useConversationMutation` accepts a prompt, partitions history (`web/src/lib/conversationHistory.ts`), and calls `callGemini` with cache-aware options.  
   - Responses persist through `db/actions` (new chat rows, Dexie-backed audio via `storeUtterance`) and wire to autoplay via `useAutoPlayAssistantAudio`.
4. **Speech synthesis**  
   - Azure path (`web/src/lib/azureSpeech.ts`) returns raw WAV buffers into the same storage flow; fallback tone generation lives in `web/src/lib/audio.ts`.
5. **UI feedback**  
   - Toasts are dispatched from hooks (`pushToast`) for error paths, while the Conversation header shows deterministic session metadata (hash, cache id) pulled from Dexie.

This workflow means a single prompt travels through React state → Dexie mutation → Gemini/Azure libraries → Dexie → UI/autoplay, with every step encapsulated behind dedicated hooks or helpers.

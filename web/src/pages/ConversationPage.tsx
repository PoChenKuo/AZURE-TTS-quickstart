import { useMemo, useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import {
  useChatMessages,
  useChatSessions,
  useSettingsRecord,
  useUtterances,
  useVoices,
} from "../db/hooks";
import {
  createChatSession,
  deleteChatSession,
  renameChatSession,
} from "../db/actions";
import { SessionSidebar } from "../components/SessionSidebar";
import { ConversationLog } from "../components/ConversationLog";
import { MessageComposer } from "../components/MessageComposer";
import { useAutoPlayAssistantAudio } from "../hooks/useAutoPlayAssistantAudio";
import { parseSessionGeminiCacheState } from "../lib/geminiCache";
import { useChatSessionSelection } from "../hooks/useChatSessionSelection";
import { useConversationMutation } from "../hooks/useConversationMutation";

// Top-level conversation surface: wires reactive data + UI scaffolding while delegating heavy logic to hooks/components.
function ConversationPage() {
  const settings = useSettingsRecord();
  const voices = useVoices() ?? [];
  const sessions = useChatSessions();
  const { activeSessionId, setActiveSessionId } = useChatSessionSelection(sessions);
  const messages = useChatMessages(activeSessionId ?? undefined) ?? [];
  const utterances = useUtterances(100) ?? [];
  const [input, setInput] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const autoPlayAudioRef = useRef<HTMLAudioElement>(null);

  const utteranceById = useMemo(() => {
    const map = new Map<number, (typeof utterances)[number]>();
    utterances.forEach((item) => {
      if (item.id != null) {
        map.set(item.id, item);
      }
    });
    return map;
  }, [utterances]);

  const defaultVoice = useMemo(() => {
    if (!voices.length) {
      return undefined;
    }
    if (settings?.defaultVoiceId) {
      return voices.find((voice) => voice.id === settings.defaultVoiceId) ?? voices[0];
    }
    return voices.find((voice) => voice.isDefault) ?? voices[0];
  }, [voices, settings?.defaultVoiceId]);

  const activeSession = sessions?.find((session) => session.id === activeSessionId);
  const sessionCacheState = activeSession
    ? parseSessionGeminiCacheState(activeSession.geminiCache)
    : undefined;
  const cacheDisplayLabel = sessionCacheState?.name ?? null;

  useEffect(() => {
    setSessionDetailsOpen(false);
  }, [activeSessionId]);

  const messageMutation = useConversationMutation({
    settings,
    messages,
    sessionCacheState,
    activeSession,
    defaultVoice,
    onSuccess: () => setInput(""),
  });

  useAutoPlayAssistantAudio(
    messages,
    utteranceById,
    autoPlay,
    autoPlayAudioRef,
    activeSessionId
  );

  // Bridge form submission to the conversation mutation, auto-creating a session when needed.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }
    let sessionId = activeSessionId;
    if (sessionId == null) {
      sessionId = await createChatSession();
      setActiveSessionId(sessionId);
    }
    messageMutation.mutate({ text: input, sessionId });
  }

  async function handleNewChat() {
    const id = await createChatSession();
    setActiveSessionId(id);
    setInput("");
  }

  async function handleDeleteSession(sessionId: number) {
    await deleteChatSession(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  }

  async function handleRename(sessionId: number, title: string) {
    const next = title.trim();
    if (!next) {
      return;
    }
    await renameChatSession(sessionId, next);
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-160px)] min-h-0 overflow-hidden max-lg:flex-col max-lg:h-auto max-lg:overflow-visible">
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={setActiveSessionId}
        onNewChat={handleNewChat}
        onDelete={handleDeleteSession}
        onRename={handleRename}
      />

      <section className="flex-1 min-h-0">
        <div className="card flex h-full min-h-0 flex-col gap-5">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-white">Conversation</h2>
              <p className="text-sm text-slate-400">
                Gemini replies are synthesized into audio blobs and cached in IndexedDB. Toggle autoplay if you prefer manual playback.
              </p>
            </div>
            {activeSession && (
              <div
                className="relative ml-auto"
                onMouseEnter={() => setSessionDetailsOpen(true)}
                onMouseLeave={() => setSessionDetailsOpen(false)}
              >
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white backdrop-blur hover:bg-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  aria-label="View session metadata"
                  aria-expanded={sessionDetailsOpen}
                  onClick={() => setSessionDetailsOpen((prev) => !prev)}
                >
                  i
                </button>
                <div
                  className={clsx(
                    "absolute right-0 top-full mt-3 w-80 max-w-[80vw] rounded-2xl border border-white/15 bg-slate-900/95 p-4 shadow-2xl transition-all duration-150",
                    sessionDetailsOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  )}
                >
                  <div className="space-y-2 text-xs text-slate-100">
                    <div className="break-all">
                      <span className="font-semibold text-slate-50">SHA256:</span>{" "}
                      <code className="text-cyan-100">{activeSession.sha256}</code>
                    </div>
                    <div className="break-all">
                      <span className="font-semibold text-slate-50">Gemini cache:</span>{" "}
                      {cacheDisplayLabel ? (
                        <span className="text-cyan-200">{cacheDisplayLabel}</span>
                      ) : (
                        <span className="text-slate-400">Pending first prompt</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </header>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
              />
              Auto-play assistant audio
            </label>
            {defaultVoice && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm text-white">
                Voice: {defaultVoice.name}
              </span>
            )}
            <audio
              ref={autoPlayAudioRef}
              controls
              className="w-full max-w-xs rounded-xl border border-white/10 bg-black/30 p-2"
              aria-label="Assistant playback"
            />
          </div>

          <ConversationLog
            messages={messages}
            utteranceById={utteranceById}
            className="flex-1 min-h-0 overflow-y-auto pr-2"
          />

          <MessageComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isSubmitting={messageMutation.isPending}
          />
        </div>
      </section>
    </div>
  );
}

export default ConversationPage;

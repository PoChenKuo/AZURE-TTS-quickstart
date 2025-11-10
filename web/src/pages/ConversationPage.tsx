import { useMemo, useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
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
  const { activeSessionId, setActiveSessionId } = useChatSessionSelection(
    sessions
  );
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

  const activeSession = sessions?.find(
    (session) => session.id === activeSessionId
  );
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
    <div className="conversation-shell">
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={setActiveSessionId}
        onNewChat={handleNewChat}
        onDelete={handleDeleteSession}
        onRename={handleRename}
      />

      <section className="conversation-panel">
        <div className="card grid" style={{ gap: "1.25rem" }}>
          <header>
            <h2 className="flex">Conversation {activeSession && (
              <div
                className="session-details-popover"
                onMouseEnter={() => setSessionDetailsOpen(true)}
                onMouseLeave={() => setSessionDetailsOpen(false)}
              >
                <button
                  type="button"
                  className="session-details-trigger"
                  aria-label="View session metadata"
                  aria-expanded={sessionDetailsOpen}
                  onClick={() => setSessionDetailsOpen((prev) => !prev)}
                >
                  ℹ️
                </button>
                <div
                  className={`session-details-card${sessionDetailsOpen ? " is-visible" : ""
                    }`}
                >
                  <div className="session-details">
                    <div>
                      <span className="session-details-label">SHA256:</span>
                      <code>{activeSession.sha256}</code>
                    </div>
                    <div>
                      <span className="session-details-label">Gemini cache:</span>
                      {cacheDisplayLabel ? (
                        <span className="session-cache-value">{cacheDisplayLabel}</span>
                      ) : (
                        <span className="session-cache-value text-muted">
                          Pending first prompt
                        </span>
                      )}
                    </div>
                          <p className="text-muted">
              Gemini replies are synthesized into audio blobs and cached in IndexedDB. Toggle autoplay if you prefer manual playback.
            </p>
                  </div>
                </div>
              </div>
            )}</h2>
      

          </header>

          <div className="conversation-controls">
            <label className="label" style={{ alignItems: "center", gap: "0.4rem" }}>
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
              />
              Auto-play assistant audio
            </label>
            {defaultVoice && (
              <span className="pill">Voice: {defaultVoice.name}</span>
            )}
            <audio
              ref={autoPlayAudioRef}
              controls
              style={{ width: "100%", maxWidth: 320 }}
              aria-label="Assistant playback"
            />
          </div>

          <ConversationLog messages={messages} utteranceById={utteranceById} />

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

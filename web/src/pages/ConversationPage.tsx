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
import type { AppSettings, ChatMessage } from "../types";
import { synthesizeAndStoreAssistantAudio } from "../lib/assistantAudio";
import { pushToast } from "../state/toastStore";

// Top-level conversation surface: wires reactive data + UI scaffolding while delegating heavy logic to hooks/components.
function ConversationPage() {
  const settings = useSettingsRecord();
  const voices = useVoices() ?? [];
  const sessions = useChatSessions();
  const { activeSessionId, setActiveSessionId } = useChatSessionSelection(sessions);
  const messages = useChatMessages(activeSessionId ?? undefined) ?? [];
  const utterances = useUtterances(100) ?? [];
  const [input, setInput] = useState("");
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
    true,
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

  async function handleRegenerateAudio(message: ChatMessage) {
    if (message.role !== "assistant" || !message.id) {
      return;
    }
    if (!settings) {
      pushToast("Save your Gemini settings before regenerating audio.", "info");
      return;
    }
    const preparedSettings = normalizeSettingsRecord(settings);
    if (!preparedSettings.geminiKey || !preparedSettings.endpoint) {
      pushToast("Gemini settings are incomplete.", "info");
      return;
    }

    try {
      await synthesizeAndStoreAssistantAudio({
        text: message.content,
        settings: preparedSettings,
        defaultVoice,
        assistantId: message.id,
        requestId: message.geminiMeta?.requestId ?? undefined,
      });
      pushToast("Audio regenerated.", "success");
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to regenerate audio.", "error");
    }
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
            <div className="space-y-1 flex justify-between w-full items-center">
              <h2 className="text-2xl font-semibold text-white">
                <p>Conversation</p>
              </h2>
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

                      <div className="break-all">
                        <span className="text-sm text-slate-400">
                          Gemini replies are synthesized into audio blobs and cached in IndexedDB. Toggle autoplay if you prefer manual playback.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-slate-200 flex items-center gap-2">
              Assistant audio auto-plays on each response.
            </span>
            {defaultVoice && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm text-white">
                Voice: {defaultVoice.name}
              </span>
            )}
            <audio
              ref={autoPlayAudioRef}
              className="hidden"
              aria-label="Assistant playback"
            />
          </div>

          <ConversationLog
            messages={messages}
            utteranceById={utteranceById}
            className="flex-1 min-h-0 overflow-y-auto pr-2"
            onRegenerateAudio={handleRegenerateAudio}
            sharedAudioRef={autoPlayAudioRef}
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

function normalizeSettingsRecord(settings: AppSettings): AppSettings {
  return {
    ...settings,
    speechKey: settings.speechKey ?? undefined,
    endpoint: settings.endpoint ?? undefined,
  };
}


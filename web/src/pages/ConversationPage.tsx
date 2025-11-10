import { useMemo, useRef, useState, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
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
  setDefaultVoice,
  deleteChatAudio,
  updateChatSessionDetails,
  deleteChatMessage,
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
import { callGemini, DEFAULT_GEMINI_MODEL } from "../lib/gemini";
import { buildSystemPrompt } from "../lib/systemPrompt";
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
  const [isUpdatingVoice, setIsUpdatingVoice] = useState(false);
  const [deletingAudioIds, setDeletingAudioIds] = useState<Set<number>>(
    () => new Set()
  );
  const [achievementPlan, setAchievementPlan] = useState<string | null>(null);
  const [isGeneratingAchievements, setIsGeneratingAchievements] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [constraintsDraft, setConstraintsDraft] = useState("");
  const [isSavingSessionDetails, setIsSavingSessionDetails] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [deletingMessageIds, setDeletingMessageIds] = useState<Set<number>>(
    () => new Set()
  );
  const [playbackRate, setPlaybackRate] = useState(1);
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
  const normalizedSettings = settings
    ? normalizeSettingsRecord(settings)
    : undefined;
  const selectableVoices = useMemo(
    () => voices.filter((voice): voice is (typeof voices)[number] & { id: number } => voice.id != null),
    [voices]
  );
  const selectedVoiceId = defaultVoice?.id != null ? String(defaultVoice.id) : "";

  const activeSession = sessions?.find((session) => session.id === activeSessionId);
  const sessionCacheState = activeSession
    ? parseSessionGeminiCacheState(activeSession.geminiCache)
    : undefined;
  const cacheDisplayLabel = sessionCacheState?.name ?? null;

  useEffect(() => {
    setSessionDetailsOpen(false);
    const session = sessions?.find((item) => item.id === activeSessionId);
    setGoalDraft(session?.goalPersona ?? "");
    setConstraintsDraft(session?.customConstraints ?? "");
    setShowContextEditor(false);
    setAchievementPlan(session?.achievementLog ? session.achievementLog : null);
  }, [activeSessionId, sessions]);

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

  useEffect(() => {
    const element = autoPlayAudioRef.current;
    if (element) {
      element.playbackRate = playbackRate;
    }
  }, [playbackRate]);

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

  async function handleVoiceChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (!value) {
      return;
    }
    const nextId = Number(value);
    if (!Number.isFinite(nextId) || defaultVoice?.id === nextId) {
      return;
    }
    setIsUpdatingVoice(true);
    try {
      await setDefaultVoice(nextId);
      pushToast("Default voice updated.", "success");
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to update voice.", "error");
    }
    finally {
      setIsUpdatingVoice(false);
    }
  }

  async function handleRegenerateAudio(message: ChatMessage) {
    if (message.role !== "assistant" || !message.id) {
      return;
    }
    if (!normalizedSettings) {
      pushToast("Save your Gemini settings before regenerating audio.", "info");
      return;
    }
    if (!normalizedSettings.geminiKey || !normalizedSettings.endpoint) {
      pushToast("Gemini settings are incomplete.", "info");
      return;
    }

    try {
      
      await synthesizeAndStoreAssistantAudio({
        text: message.content,
        settings: normalizedSettings,
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

  async function handleDeleteAudio(message: ChatMessage) {
    if (message.role !== "assistant" || !message.id) {
      return;
    }
    setDeletingAudioIds((prev) => {
      const next = new Set(prev);
      next.add(message.id!);
      return next;
    });
    try {
      const removed = await deleteChatAudio(message.id);
      if (removed) {
        pushToast("Deleted assistant audio.", "info");
      }
      else {
        pushToast("Audio already removed.", "info");
      }
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to delete audio.", "error");
    }
    finally {
      setDeletingAudioIds((prev) => {
        const next = new Set(prev);
        next.delete(message.id!);
        return next;
      });
    }
  }

  async function handleSaveSessionDetails() {
    if (!activeSession?.id) {
      return;
    }
    setIsSavingSessionDetails(true);
    try {
      await updateChatSessionDetails(activeSession.id, {
        goalPersona: goalDraft.trim(),
        customConstraints: constraintsDraft.trim(),
      });
      pushToast("Updated chat goal & constraints.", "success");
      setShowContextEditor(false);
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to save chat details.", "error");
    }
    finally {
      setIsSavingSessionDetails(false);
    }
  }

  async function handleDeleteMessage(message: ChatMessage) {
    if (!message.id) {
      return;
    }
    setDeletingMessageIds((prev) => {
      const next = new Set(prev);
      next.add(message.id!);
      return next;
    });
    try {
      await deleteChatMessage(message.id);
      pushToast("Deleted message.", "info");
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to delete message.", "error");
    }
    finally {
      setDeletingMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(message.id!);
        return next;
      });
    }
  }

  async function handleGenerateAchievements() {
    if (!normalizedSettings?.geminiKey) {
      pushToast("Add your Gemini key in Settings first.", "info");
      return;
    }
    if (!messages.length) {
      pushToast("Start a conversation before generating achievements.", "info");
      return;
    }
    setIsGeneratingAchievements(true);
    try {
      const systemPrompt = buildSystemPrompt(
        activeSession?.goalPersona,
        activeSession?.customConstraints
      );
      const history: ChatMessage[] = [
        ...(systemPrompt
          ? [
              {
                sessionId: activeSessionId ?? 0,
                role: "system",
                content: systemPrompt,
                createdUtc: new Date().toISOString(),
              } as ChatMessage,
            ]
          : []),
        ...messages,
      ];
      const result = await callGemini(
        "Provide a factual summary of the user's progress toward their stated goal based solely on the conversation and constraints. List verifiable achievements and explain their direct contribution to goal advancement. Exclude encouragement, interpretation, or subjective language.",
        normalizedSettings,
        history,
        undefined,
        normalizedSettings.geminiModel ?? DEFAULT_GEMINI_MODEL
      );
      const plan = result.text.trim();
      setAchievementPlan(plan);
      if (activeSession?.id) {
        await updateChatSessionDetails(activeSession.id, {
          achievementLog: plan,
        });
      }
      pushToast("Achievements updated.", "success");
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to generate achievements.", "error");
    }
    finally {
      setIsGeneratingAchievements(false);
    }
  }

  async function handleClearAchievements() {
    if (!activeSession?.id) {
      setAchievementPlan(null);
      return;
    }
    setAchievementPlan(null);
    try {
      await updateChatSessionDetails(activeSession.id, { achievementLog: "" });
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to clear achievements.", "error");
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
        <div className="card flex h-full min-h-0 flex-col gap-5 sm-pl-0 sm-pr-0">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1 flex justify-between w-full items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-white truncate">
                  {activeSession?.title?.trim() || "Conversation"}
                </h2>
                {activeSession && (
                  <button
                    type="button"
                    className={clsx(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                      showContextEditor ? "bg-white/10" : ""
                    )}
                    aria-label="Edit chat goal and constraints"
                    onClick={() =>
                      setShowContextEditor((prev) => !prev)
                    }
                  >
                    ⚙️
                  </button>
                )}
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
                      "absolute right-0 top-full mt-3 w-80 max-w-[80vw] rounded-2xl border border-white/15 bg-slate-900/95 p-4 shadow-2xl transition-all duration-150 z-10",
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
                      <div className="break-word">
                        <span className="font-semibold text-slate-50">Gemini cache:</span>{" "}
                        {cacheDisplayLabel ? (
                          <span className="text-cyan-200">{cacheDisplayLabel}</span>
                        ) : (
                          <span className="text-slate-400">Pending first prompt</span>
                        )}
                      </div>

                      <div className="break-word">
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

          {activeSession && showContextEditor && (
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 overflow-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Chat context</p>
                  <p className="text-xs text-slate-400">
                    Clarify the mission and rules for this conversation.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm text-white hover:bg-white/10 disabled:opacity-60"
                  onClick={handleGenerateAchievements}
                  disabled={isGeneratingAchievements}
                >
                  {isGeneratingAchievements ? "Generating..." : "Generate achievements"}
                </button>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Goal / Persona
                </label>
                <textarea
                  className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                  placeholder="Describe what you're trying to achieve in this chat."
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Constraints &amp; Guidelines
                </label>
                <textarea
                  className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                  placeholder="List tone, boundaries, or requirements for this conversation."
                  value={constraintsDraft}
                  onChange={(e) => setConstraintsDraft(e.target.value)}
                  rows={2}
                />
              </div>

              {achievementPlan && (
                <div className="rounded-2xl border border-white/15 bg-slate-900/80 p-4 shadow-inner shadow-black/30 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Achievement log</p>
                      <p className="text-xs text-slate-400">
                        {isGeneratingAchievements
                          ? "Hold tight—updating achievements…"
                          : "Snapshot of accomplishments based on this conversation."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-white"
                      onClick={handleClearAchievements}
                    >
                      Clear
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-slate-100 bg-slate-950/70 rounded-xl p-3 overflow-x-auto">
                    {achievementPlan}
                  </pre>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="text-sm text-slate-400 hover:text-white"
                  onClick={() => {
                    setGoalDraft(activeSession.goalPersona ?? "");
                    setConstraintsDraft(activeSession.customConstraints ?? "");
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveSessionDetails}
                  disabled={isSavingSessionDetails}
                >
                  {isSavingSessionDetails ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-slate-200 flex items-center gap-2">
              Assistant audio auto-plays on each response.
            </span>
            {selectableVoices.length > 0 && (
              <label className="voice-select inline-flex items-center gap-3 rounded-full border border-white/20 px-3 py-1 text-sm text-white">
                <span className="text-xs uppercase tracking-wide text-slate-300">
                  Voice
                </span>
                <div className="voice-select-control">
                  <select
                    className="voice-select-input"
                    value={selectedVoiceId}
                    onChange={handleVoiceChange}
                    disabled={isUpdatingVoice}
                  >
                    {!selectedVoiceId && (
                      <option value="" disabled>
                        Select voice
                      </option>
                    )}
                    {selectableVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                        {voice.isDefault ? " • default" : ""}
                      </option>
                    ))}
                  </select>
                  <span className="voice-select-arrow" aria-hidden="true">
                    ▾
                  </span>
                </div>
              </label>
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
            onDeleteAudio={handleDeleteAudio}
            deletingAudioIds={deletingAudioIds}
            onDeleteMessage={handleDeleteMessage}
            deletingMessageIds={deletingMessageIds}
            playbackRate={playbackRate}
          />

          <MessageComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isSubmitting={messageMutation.isPending}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
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
    geminiModel: settings.geminiModel ?? DEFAULT_GEMINI_MODEL,
  };
}

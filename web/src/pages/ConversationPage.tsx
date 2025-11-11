import clsx from "clsx";
import { SessionSidebar } from "../components/SessionSidebar";
import { ConversationLog } from "../components/ConversationLog";
import { MessageComposer } from "../components/MessageComposer";
import {
  ConversationProvider,
  useConversationContext,
} from "../context/ConversationContext";

// Composition-only shell: stateful logic now lives inside ConversationProvider.
function ConversationPage() {
  return (
    <ConversationProvider>
      <ConversationSurface />
    </ConversationProvider>
  );
}

function ConversationSurface() {
  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    handleNewChat,
    handleDeleteSession,
    handleRename,
    sessionDetailsOpen,
    setSessionDetailsOpen,
    cacheDisplayLabel,
    showContextEditor,
    setShowContextEditor,
    handleGenerateAchievements,
    isGeneratingAchievements,
    goalDraft,
    setGoalDraft,
    constraintsDraft,
    setConstraintsDraft,
    achievementPlan,
    handleClearAchievements,
    isSavingSessionDetails,
    handleSaveSessionDetails,
    selectableVoices,
    selectedVoiceId,
    handleVoiceChange,
    isUpdatingVoice,
    autoPlayAudioRef,
    messages,
    utteranceById,
    handleRegenerateAudio,
    handleDeleteAudio,
    deletingAudioIds,
    handleDeleteMessage,
    deletingMessageIds,
    playbackRate,
    setPlaybackRate,
    input,
    setInput,
    handleSubmit,
    isMessagePending,
  } = useConversationContext();

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
                    onClick={() => setShowContextEditor((prev) => !prev)}
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
            isSubmitting={isMessagePending}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
          />
        </div>
      </section>
    </div>
  );
}

export default ConversationPage;

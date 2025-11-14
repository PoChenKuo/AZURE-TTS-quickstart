import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
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
  deleteChatAudio,
  deleteChatMessage,
  renameChatSession,
  setDefaultVoice,
  updateChatSessionDetails,
} from "../db/actions";
import { useAutoPlayAssistantAudio } from "../hooks/useAutoPlayAssistantAudio";
import { parseSessionGeminiCacheState } from "../lib/geminiCache";
import { useChatSessionSelection } from "../hooks/useChatSessionSelection";
import { useConversationMutation } from "../hooks/useConversationMutation";
import type {
  AppSettings,
  ChatMessage,
  ChatSession,
  UtteranceRecord,
  VoiceProfile,
} from "../types";
import { synthesizeAndStoreAssistantAudio } from "../lib/assistantAudio";
import { callGemini, DEFAULT_GEMINI_MODEL } from "../lib/gemini";
import { buildSystemPrompt } from "../lib/systemPrompt";
import { pushToast } from "../state/toastStore";

type ConversationContextValue = {
  sessions?: ChatSession[];
  messages: ChatMessage[];
  activeSession?: ChatSession;
  activeSessionId: number | null;
  setActiveSessionId: Dispatch<SetStateAction<number | null>>;
  cacheDisplayLabel: string | null;
  sessionDetailsOpen: boolean;
  setSessionDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showContextEditor: boolean;
  setShowContextEditor: React.Dispatch<React.SetStateAction<boolean>>;
  goalDraft: string;
  setGoalDraft: Dispatch<SetStateAction<string>>;
  constraintsDraft: string;
  setConstraintsDraft: Dispatch<SetStateAction<string>>;
  handleSaveSessionDetails: () => Promise<void>;
  isSavingSessionDetails: boolean;
  achievementPlan: string | null;
  handleGenerateAchievements: () => Promise<void>;
  handleClearAchievements: () => Promise<void>;
  isGeneratingAchievements: boolean;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleDeleteSession: (sessionId: number) => Promise<void>;
  handleRename: (sessionId: number, title: string) => Promise<void>;
  isMessagePending: boolean;
  utteranceById: Map<number, UtteranceRecord>;
  handleRegenerateAudio: (message: ChatMessage) => Promise<void>;
  handleDeleteAudio: (message: ChatMessage) => Promise<void>;
  deletingAudioIds: Set<number>;
  regeneratingAudioIds: Set<number>;
  handleDeleteMessage: (message: ChatMessage) => Promise<void>;
  deletingMessageIds: Set<number>;
  handleRetryResponse: (message: ChatMessage) => Promise<void>;
  retryingMessageIds: Set<number>;
  isAudioPanelCollapsed: boolean;
  setAudioPanelCollapsed: Dispatch<SetStateAction<boolean>>;
  audioPanelState: AudioPanelState;
  playbackRate: number;
  setPlaybackRate: Dispatch<SetStateAction<number>>;
  autoPlayAudioRef: RefObject<HTMLAudioElement | null>;
  selectableVoices: Array<VoiceProfile & { id: number }>;
  selectedVoiceId: string;
  handleVoiceChange: (event: ChangeEvent<HTMLSelectElement>) => Promise<void>;
  isUpdatingVoice: boolean;
  conversationFontScale: number;
};

type AudioPanelState = {
  isPlaying: boolean;
  hasSource: boolean;
  currentTime: number;
  duration: number;
};

const ConversationContext = createContext<ConversationContextValue | undefined>(
  undefined
);

export function ConversationProvider({ children }: { children: ReactNode }) {
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
  const [regeneratingAudioIds, setRegeneratingAudioIds] = useState<Set<number>>(
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
  const [retryingMessageIds, setRetryingMessageIds] = useState<Set<number>>(
    () => new Set()
  );
  const [isAudioPanelCollapsed, setAudioPanelCollapsed] = useState(false);
  const [audioPanelState, setAudioPanelState] = useState<AudioPanelState>({
    isPlaying: false,
    hasSource: false,
    currentTime: 0,
    duration: 0,
  });
  const [playbackRate, setPlaybackRate] = useState(1);
  const autoPlayAudioRef = useRef<HTMLAudioElement>(null);

  const utteranceById = useMemo(() => {
    const map = new Map<number, UtteranceRecord>();
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
    () =>
      voices.filter(
        (voice): voice is VoiceProfile & { id: number } => voice.id != null
      ),
    [voices]
  );
  const selectedVoiceId = defaultVoice?.id != null ? String(defaultVoice.id) : "";
  const conversationFontScale = settings?.conversationFontScale ?? 1;

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
    onAudioStart: (assistantId: number) => {
      setRegeneratingAudioIds((prev) => {
        const next = new Set(prev);
        next.add(assistantId);
        return next;
      });
    },
    onAudioDone: (assistantId: number) => {
      setRegeneratingAudioIds((prev) => {
        const next = new Set(prev);
        next.delete(assistantId);
        return next;
      });
    },
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
    if (!element) {
      setAudioPanelState({
        isPlaying: false,
        hasSource: false,
        currentTime: 0,
        duration: 0,
      });
      return;
    }

    const updatePanelState = () => {
      const duration = Number.isFinite(element.duration) ? element.duration : 0;
      setAudioPanelState({
        isPlaying: !element.paused && !element.ended,
        hasSource: Boolean(element.currentSrc || element.src),
        currentTime: element.currentTime ?? 0,
        duration,
      });
    };

    updatePanelState();
    const events: Array<keyof HTMLMediaElementEventMap> = [
      "play",
      "pause",
      "timeupdate",
      "ended",
      "loadedmetadata",
      "emptied",
    ];
    events.forEach((event) => element.addEventListener(event, updatePanelState));
    return () => {
      events.forEach((event) =>
        element.removeEventListener(event, updatePanelState)
      );
    };
  }, [autoPlayAudioRef]);

  useEffect(() => {
    const element = autoPlayAudioRef.current;
    if (element) {
      element.playbackRate = playbackRate;
    }
  }, [playbackRate]);

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
    messageMutation.mutate(
      { text: input, sessionId, historyOverride: messages },
      {
        onSuccess: () => setInput(""),
      }
    );
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
    } catch (error) {
      console.error(error);
      pushToast("Failed to update voice.", "error");
    } finally {
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

    setRegeneratingAudioIds((prev) => {
      const next = new Set(prev);
      next.add(message.id!);
      return next;
    });

    try {
      await synthesizeAndStoreAssistantAudio({
        text: message.content,
        settings: normalizedSettings,
        defaultVoice,
        assistantId: message.id,
        requestId: message.geminiMeta?.requestId ?? undefined,
      });
      pushToast("Audio regenerated.", "success");
    } catch (error) {
      console.error(error);
      pushToast("Failed to regenerate audio.", "error");
    } finally {
      setRegeneratingAudioIds((prev) => {
        const next = new Set(prev);
        next.delete(message.id!);
        return next;
      });
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
      } else {
        pushToast("Audio already removed.", "info");
      }
    } catch (error) {
      console.error(error);
      pushToast("Failed to delete audio.", "error");
    } finally {
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
    } catch (error) {
      console.error(error);
      pushToast("Failed to save chat details.", "error");
    } finally {
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
    } catch (error) {
      console.error(error);
      pushToast("Failed to delete message.", "error");
    } finally {
      setDeletingMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(message.id!);
        return next;
      });
    }
  }

  function findAssistantReply(userMessage: ChatMessage) {
    if (!userMessage.id) {
      return undefined;
    }
    const startIndex = messages.findIndex((item) => item.id === userMessage.id);
    if (startIndex === -1) {
      return undefined;
    }
    for (let index = startIndex + 1; index < messages.length; index += 1) {
      const candidate = messages[index];
      if (candidate.role === "assistant") {
        return candidate;
      }
      if (candidate.role === "user") {
        break;
      }
    }
    return undefined;
  }

  async function handleRetryResponse(message: ChatMessage) {
    if (message.role !== "user" || !message.id) {
      return;
    }
    if (retryingMessageIds.has(message.id)) {
      return;
    }
    if (!normalizedSettings?.geminiKey) {
      pushToast("Add your Gemini key in Settings first.", "info");
      return;
    }
    if (messageMutation.isPending) {
      pushToast("Wait for the current Gemini request to finish.", "info");
      return;
    }
    const assistantReply = findAssistantReply(message);
    if (!assistantReply?.id) {
      pushToast("No Gemini reply to retry for this message yet.", "info");
      return;
    }

    setRetryingMessageIds((prev) => {
      const next = new Set(prev);
      next.add(message.id!);
      return next;
    });

    const historyOverride = messages.filter(
      (entry) => entry.id !== assistantReply.id
    );

    try {
      const removed = await deleteChatMessage(assistantReply.id);
      if (!removed) {
        pushToast("Response already removed.", "info");
      }
      await messageMutation.mutateAsync({
        text: message.content,
        sessionId: message.sessionId,
        existingUserEntry: message,
        historyOverride,
      });
    } catch (error) {
      console.error(error);
      pushToast("Failed to retry Gemini response.", "error");
    } finally {
      setRetryingMessageIds((prev) => {
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
    } catch (error) {
      console.error(error);
      pushToast("Failed to generate achievements.", "error");
    } finally {
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
    } catch (error) {
      console.error(error);
      pushToast("Failed to clear achievements.", "error");
    }
  }

  const value: ConversationContextValue = {
    sessions,
    messages,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    cacheDisplayLabel,
    sessionDetailsOpen,
    setSessionDetailsOpen,
    showContextEditor,
    setShowContextEditor,
    goalDraft,
    setGoalDraft,
    constraintsDraft,
    setConstraintsDraft,
    handleSaveSessionDetails,
    isSavingSessionDetails,
    achievementPlan,
    handleGenerateAchievements,
    handleClearAchievements,
    isGeneratingAchievements,
    input,
    setInput,
    handleSubmit,
    handleNewChat,
    handleDeleteSession,
    handleRename,
    isMessagePending: messageMutation.isPending,
    utteranceById,
    handleRegenerateAudio,
    handleDeleteAudio,
    deletingAudioIds,
    regeneratingAudioIds,
    handleDeleteMessage,
    deletingMessageIds,
    handleRetryResponse,
    retryingMessageIds,
    isAudioPanelCollapsed,
    setAudioPanelCollapsed,
    audioPanelState,
    playbackRate,
    setPlaybackRate,
    autoPlayAudioRef,
    selectableVoices,
    selectedVoiceId,
    handleVoiceChange,
    isUpdatingVoice,
    conversationFontScale,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversationContext must be used within a ConversationProvider"
    );
  }
  return context;
}

function normalizeSettingsRecord(settings: AppSettings): AppSettings {
  return {
    ...settings,
    speechKey: settings.speechKey ?? undefined,
    endpoint: settings.endpoint ?? undefined,
    geminiModel: settings.geminiModel ?? DEFAULT_GEMINI_MODEL,
    conversationFontScale: settings.conversationFontScale ?? 1,
  };
}

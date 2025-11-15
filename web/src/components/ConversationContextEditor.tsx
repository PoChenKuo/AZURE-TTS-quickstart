import { useTranslation } from "react-i18next";
import type { ChatSession } from "../types";
import { ConversationAchievementLog } from "./ConversationAchievementLog";

type ConversationContextEditorProps = {
  activeSession: ChatSession;
  goalDraft: string;
  setGoalDraft: (value: string) => void;
  constraintsDraft: string;
  setConstraintsDraft: (value: string) => void;
  achievementPlan: string | null;
  isGeneratingAchievements: boolean;
  isSavingSessionDetails: boolean;
  onGenerateAchievements: () => void | Promise<void>;
  onClearAchievements: () => void | Promise<void>;
  onSaveSessionDetails: () => void | Promise<void>;
};

export function ConversationContextEditor({
  activeSession,
  goalDraft,
  setGoalDraft,
  constraintsDraft,
  setConstraintsDraft,
  achievementPlan,
  isGeneratingAchievements,
  isSavingSessionDetails,
  onGenerateAchievements,
  onClearAchievements,
  onSaveSessionDetails,
}: ConversationContextEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 overflow-auto conversation-context-editor">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">
            {t("conversation.contextHeading")}
          </p>
          <p className="text-xs text-slate-400">
            {t("conversation.contextDescription")}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm text-white hover:bg-white/10 disabled:opacity-60"
          onClick={onGenerateAchievements}
          disabled={isGeneratingAchievements}
        >
          {isGeneratingAchievements
            ? t("conversation.generateAchievementsBusy")
            : t("conversation.generateAchievements")}
        </button>
      </div>

      <div className="grid gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          {t("conversation.goalLabel")}
        </label>
        <textarea
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          placeholder={t("conversation.goalPlaceholder")}
          value={goalDraft}
          onChange={(event) => setGoalDraft(event.target.value)}
          rows={2}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          {t("conversation.constraintsLabel")}
        </label>
        <textarea
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          placeholder={t("conversation.constraintsPlaceholder")}
          value={constraintsDraft}
          onChange={(event) => setConstraintsDraft(event.target.value)}
          rows={2}
        />
      </div>

      <ConversationAchievementLog
        achievementPlan={achievementPlan}
        isGeneratingAchievements={isGeneratingAchievements}
        onClearAchievements={onClearAchievements}
      />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="text-sm text-slate-400 hover:text-white"
          onClick={() => {
            setGoalDraft(activeSession.goalPersona ?? "");
            setConstraintsDraft(activeSession.customConstraints ?? "");
          }}
        >
          {t("conversation.reset")}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSaveSessionDetails}
          disabled={isSavingSessionDetails}
        >
          {isSavingSessionDetails ? t("settings.saving") : t("conversation.save")}
        </button>
      </div>
    </div>
  );
}


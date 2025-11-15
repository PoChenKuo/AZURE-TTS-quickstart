import { useTranslation } from "react-i18next";

type ConversationAchievementLogProps = {
  achievementPlan: string | null;
  isGeneratingAchievements: boolean;
  onClearAchievements: () => void | Promise<void>;
};

export function ConversationAchievementLog({
  achievementPlan,
  isGeneratingAchievements,
  onClearAchievements,
}: ConversationAchievementLogProps) {
  const { t } = useTranslation();

  if (!achievementPlan) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-900/80 p-4 shadow-inner shadow-black/30 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {t("conversation.achievementsHeading")}
          </p>
          <p className="text-xs text-slate-400">
            {isGeneratingAchievements
              ? t("conversation.achievementsUpdating")
              : t("conversation.achievementsDescription")}
          </p>
        </div>
        <button
          type="button"
          className="text-xs text-slate-400 hover:text-white"
          onClick={onClearAchievements}
        >
          {t("common.clear")}
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-sm text-slate-100 bg-slate-950/70 rounded-xl p-3 overflow-x-auto">
        {achievementPlan}
      </pre>
    </div>
  );
}


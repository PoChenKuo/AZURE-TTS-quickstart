const common = {
  app: {
    title: "Indexed スピーチスタジオ",
    subtitle: "Gemini + Azure を活用したクライアントサイド実験",
    nav: {
      conversation: "会話",
      voice: "音声とデータ",
      settings: "設定",
    },
    cleanup: {
      last: "直近のクリーンアップ {{time}}",
      pending: "未実行",
    },
    language: "言語",
  },
  common: {
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    reset: "リセット",
    close: "閉じる",
    clear: "クリア",
    loading: "読み込み中…",
    default: "デフォルト",
  },
  toasts: {
    settingsSaved: "設定を保存しました。",
    settingsFailed: "設定の保存に失敗しました。",
    azureTestFailed: "Azure のテストに失敗しました。詳細はコンソールをご覧ください。",
    azureTestSuccess: "Azure 音声テストを再生しました。",
    geminiTestFailed: "Gemini のテストに失敗しました。",
    geminiTestSuccess: "Gemini が応答しました！",
    achievementsFailed: "成果の生成に失敗しました。",
    achievementsCleared: "成果をクリアしました。",
    achievementsUpdated: "成果を更新しました。",
    chatContextSaved: "チャットの目標と制約を更新しました。",
    chatContextFailed: "チャット詳細の保存に失敗しました。",
  },
};

export default common;

const common = {
  app: {
    title: "Indexed 語音工作室",
    subtitle: "Gemini + Azure 打造的純前端實驗",
    nav: {
      conversation: "對話",
      voice: "語音與資料",
      settings: "設定",
    },
    cleanup: {
      last: "上次清理 {{time}}",
      pending: "等待清理",
    },
    language: "語言",
  },
  common: {
    cancel: "取消",
    save: "儲存",
    delete: "刪除",
    reset: "重設",
    close: "關閉",
    clear: "清除",
    loading: "載入中…",
    default: "預設",
  },
  toasts: {
    settingsSaved: "設定已儲存。",
    settingsFailed: "設定儲存失敗。",
    azureTestFailed: "Azure 測試失敗，請查看主控台以了解詳情。",
    azureTestSuccess: "已播放 Azure 語音測試。",
    geminiTestFailed: "Gemini 測試失敗。",
    geminiTestSuccess: "Gemini 已回應！",
    achievementsFailed: "生成成果失敗。",
    achievementsCleared: "成果已清除。",
    achievementsUpdated: "成果已更新。",
    chatContextSaved: "已更新對話目標和約束。",
    chatContextFailed: "對話詳情儲存失敗。",
  },
};

export default common;

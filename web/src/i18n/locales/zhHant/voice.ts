const voice = {
  voice: {
    voiceLibrary: "語音庫",
    voiceLibraryDesc:
      "管理可供對話視圖使用的語音，匯入/匯出功能即將上線。",
    table: {
      name: "名稱",
      locale: "區域",
      style: "風格",
      voiceId: "語音 ID",
      actions: "操作",
      defaultBadge: "預設",
    },
    actions: {
      setDefault: "設為預設",
      delete: "刪除",
    },
    form: {
      title: "新增 / 編輯語音",
      namePlaceholder: "語音名稱",
      localePlaceholder: "區域（例如 en-US）",
      azureIdPlaceholder: "Azure 語音 ID（選填）",
      stylePlaceholder: "風格（casual、news、general 等）",
      tagsPlaceholder: "標籤（以逗號分隔）",
      save: "儲存語音",
      saving: "儲存中…",
    },
    cachedAudio: "已快取音訊",
    cachedAudioEmpty: "尚未快取音訊，傳送 Gemini 提示即可產生。",
    workerLog: "工作紀錄",
    noVoices: "目前沒有語音，請使用下方表單新增第一筆。",
    noLogs: "尚無訊息。",
    messages: {
      nameRequired: "語音名稱為必填欄位。",
      voiceSaved: "語音已儲存。",
      voiceSaveFailed: "儲存語音失敗。",
      defaultSet: '「{{name}}」已成為預設語音。',
      setDefaultFirst: "請先設定其他預設語音。",
      voiceDeleted: '語音「{{name}}」已刪除。',
      audioDeleted: "已刪除音訊片段。",
      cachedSummary: "{{count}} 段 | {{size}}",
      expiresLabel: "到期時間 {{time}}",
      sizeLabel: "{{size}}",
      runCleanup: "立即執行清理",
      cleaning: "清理中…",
      defaultStyle: "通用",
      notAvailable: "無",
    },
  },
};

export default voice;

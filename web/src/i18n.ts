import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "zh-Hans", label: "简体中文" },
  { value: "zh-Hant", label: "繁體中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

const en = {
  app: {
    title: "Indexed Speech Studio",
    subtitle: "Client-only experiments powered by Gemini + Azure",
    nav: {
      conversation: "Conversation",
      voice: "Voice & Data",
      settings: "Settings",
    },
    cleanup: {
      last: "Last cleanup {{time}}",
      pending: "Cleanup pending",
    },
    language: "Language",
  },
  common: {
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    reset: "Reset",
    close: "Close",
    clear: "Clear",
    loading: "Loading…",
    default: "Default",
  },
  sidebar: {
    newChat: "+ New chat",
    rename: "Rename",
    delete: "Delete",
    empty: "Creating your first chat...",
    save: "Save",
    cancel: "Cancel",
    deleteTitle: "Delete chat?",
    deleteBody:
      "This removes \"{{title}}\" and its cached audio. This action cannot be undone.",
    deleteAction: "Delete chat",
  },
  conversation: {
    titleFallback: "Conversation",
    contextHeading: "Chat context",
    contextDescription: "Clarify the mission and rules for this conversation.",
    empty: "No messages yet. Say hello to Gemini!",
    goalLabel: "Goal / Persona",
    goalPlaceholder: "Describe what you're trying to achieve in this chat.",
    constraintsLabel: "Constraints & Guidelines",
    constraintsPlaceholder:
      "List tone, boundaries, or requirements for this conversation.",
    achievementsHeading: "Achievement log",
    achievementsDescription: "Snapshot of accomplishments based on this conversation.",
    achievementsUpdating: "Hold tight—updating achievements…",
    generateAchievements: "Generate achievements",
    generateAchievementsBusy: "Generating…",
    audioAutoplayHint: "Assistant audio auto-plays on each response.",
    deleteMessage: "Delete",
    reset: "Reset",
    save: "Save",
    systemMetadataHint:
      "Gemini replies are synthesized into audio blobs and cached in IndexedDB. Toggle autoplay if you prefer manual playback.",
  },
  composer: {
    placeholder: "Ask Gemini anything...",
    send: "Send",
    sending: "Sending...",
    speed: "Speed",
  },
  audio: {
    play: "Play assistant audio",
    pause: "Pause assistant audio",
    playLabel: "Play audio",
  },
  log: {
    audioUnavailable: "Audio unavailable.",
    regenerate: "Re-generate audio",
    tokens: "{{count}} tokens | {{model}}",
    timeLabel: "{{time}}",
    deleteMessage: "Delete",
  },
  settings: {
    title: "Settings",
    description:
      "Keys stay inside IndexedDB. Use the testers to make sure everything works before heading back to the conversation view.",
    azureSpeechKey: "Azure Speech Key",
    azureEndpoint: "Azure Endpoint URL",
    azureRegion: "Azure Region (optional)",
    geminiKey: "Gemini API Key",
    cleanupInterval: "Cleanup Interval (minutes)",
    defaultVoice: "Default Voice",
    encryption: "Enable passphrase encryption (coming soon)",
    save: "Save changes",
    testAzure: "Test Azure Voice",
    testingAzure: "Testing...",
    testGemini: "Test Gemini Ping",
    testingGemini: "Testing...",
  },
  voice: {
    voiceLibrary: "Voice Library",
    voiceLibraryDesc:
      "Manage the voices available to the conversation view. Import/export support is coming soon.",
    addEdit: "Add / Edit Voice",
    cachedAudio: "Cached Audio",
    cachedAudioEmpty: "No cached audio blobs yet—send a Gemini prompt to generate one.",
    workerLog: "Worker Log",
    noVoices: "No voices yet. Use the form below to add your first entry.",
    noLogs: "No messages yet.",
  },
  toasts: {
    settingsSaved: "Settings saved.",
    settingsFailed: "Failed to save settings.",
    azureTestFailed: "Azure test failed. See console for details.",
    azureTestSuccess: "Azure voice test played.",
    geminiTestFailed: "Gemini test failed.",
    geminiTestSuccess: "Gemini responded!",
    achievementsFailed: "Failed to generate achievements.",
    achievementsCleared: "Achievements cleared.",
    achievementsUpdated: "Achievements updated.",
    chatContextSaved: "Updated chat goal & constraints.",
    chatContextFailed: "Failed to save chat details.",
  },
};

const zhHans = {
  app: {
    title: "Indexed 语音工作室",
    subtitle: "基于 Gemini + Azure 的纯前端实验",
    nav: {
      conversation: "对话",
      voice: "语音与数据",
      settings: "设置",
    },
    cleanup: {
      last: "上次清理 {{time}}",
      pending: "等待清理",
    },
    language: "语言",
  },
  common: {
    cancel: "取消",
    save: "保存",
    delete: "删除",
    reset: "重置",
    close: "关闭",
    clear: "清除",
    loading: "加载中…",
    default: "默认",
  },
  sidebar: {
    newChat: "+ 新建对话",
    rename: "重命名",
    delete: "删除",
    empty: "正在创建你的第一个对话…",
    save: "保存",
    cancel: "取消",
    deleteTitle: "删除对话？",
    deleteBody: "删除“{{title}}”及其缓存音频，操作不可恢复。",
    deleteAction: "删除对话",
  },
  conversation: {
    contextHeading: "对话上下文",
    contextDescription: "说明本次对话的目标与规则。",
    empty: "暂时还没有消息，先向 Gemini 打个招呼吧！",
    goalLabel: "目标 / 角色",
    goalPlaceholder: "描述你希望在此对话中实现的目标。",
    constraintsLabel: "约束与偏好",
    constraintsPlaceholder: "列出语气、边界或其他要求。",
    achievementsHeading: "成果记录",
    achievementsDescription: "基于该对话生成的成果快照。",
    achievementsUpdating: "成果更新中…",
    generateAchievements: "生成成果",
    generateAchievementsBusy: "生成中…",
    audioAutoplayHint: "助理语音会在每次回复后自动播放。",
    deleteMessage: "删除",
    reset: "重置",
    save: "保存",
    systemMetadataHint:
      "Gemini 回复会被合成为音频并缓存到 IndexedDB。如需手动播放可关闭自动播放。",
  },
  composer: {
    placeholder: "问问 Gemini…",
    send: "发送",
    sending: "发送中…",
    speed: "语速",
  },
  audio: {
    play: "播放助理语音",
    pause: "暂停助理语音",
    playLabel: "播放音频",
  },
  log: {
    audioUnavailable: "音频不可用。",
    regenerate: "重新生成音频",
    tokens: "{{count}} 个标记 | {{model}}",
    deleteMessage: "删除",
  },
};

const zhHant = {
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
  sidebar: {
    newChat: "+ 建立新對話",
    rename: "重新命名",
    delete: "刪除",
    empty: "正在建立你的第一個對話…",
    save: "儲存",
    cancel: "取消",
    deleteTitle: "刪除此對話？",
    deleteBody: "將刪除「{{title}}」及其快取音訊，此動作無法復原。",
    deleteAction: "刪除對話",
  },
  conversation: {
    contextHeading: "對話脈絡",
    contextDescription: "說明本次對話的目標與規則。",
    empty: "目前沒有訊息，先向 Gemini 打聲招呼吧！",
    goalLabel: "目標 / 角色",
    goalPlaceholder: "說明你希望在此對話中完成的任務。",
    constraintsLabel: "限制與偏好",
    constraintsPlaceholder: "列出語氣、界線或其他需求。",
    achievementsHeading: "成果紀錄",
    achievementsDescription: "根據對話內容整理的成果摘要。",
    achievementsUpdating: "正在更新成果…",
    generateAchievements: "產生成果",
    generateAchievementsBusy: "產生中…",
    audioAutoplayHint: "助理語音會自動播放。",
    deleteMessage: "刪除",
    reset: "重設",
    save: "儲存",
    systemMetadataHint:
      "Gemini 回覆會轉成音訊並快取於 IndexedDB。如想手動播放，可關閉自動播放。",
  },
  composer: {
    placeholder: "向 Gemini 詢問任何問題…",
    send: "送出",
    sending: "送出中…",
    speed: "播放速度",
  },
  audio: {
    play: "播放助理語音",
    pause: "暫停助理語音",
    playLabel: "播放音訊",
  },
  log: {
    audioUnavailable: "音訊無法使用。",
    regenerate: "重新產生音訊",
    tokens: "{{count}} 個標記 | {{model}}",
    deleteMessage: "刪除",
  },
};

const ja = {
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
  sidebar: {
    newChat: "+ 新しいチャット",
    rename: "名前を変更",
    delete: "削除",
    empty: "最初のチャットを作成しています…",
    save: "保存",
    cancel: "キャンセル",
    deleteTitle: "チャットを削除しますか？",
    deleteBody: "「{{title}}」とキャッシュされた音声を削除します。この操作は元に戻せません。",
    deleteAction: "チャットを削除",
  },
  conversation: {
    contextHeading: "チャットのコンテキスト",
    contextDescription: "目的とルールを明確にしましょう。",
    empty: "まだメッセージがありません。Gemini に挨拶してみましょう！",
    goalLabel: "目標 / ペルソナ",
    goalPlaceholder: "このチャットで達成したい内容を入力してください。",
    constraintsLabel: "制約とガイドライン",
    constraintsPlaceholder: "トーンや境界条件などを記入してください。",
    achievementsHeading: "成果ログ",
    achievementsDescription: "この会話に基づく進捗スナップショットです。",
    achievementsUpdating: "成果を更新しています…",
    generateAchievements: "成果を生成",
    generateAchievementsBusy: "生成中…",
    audioAutoplayHint: "アシスタントの音声は自動的に再生されます。",
    deleteMessage: "削除",
    reset: "リセット",
    save: "保存",
    systemMetadataHint:
      "Gemini の応答は音声に変換され、IndexedDB にキャッシュされます。手動再生を希望する場合は自動再生をオフにしてください。",
  },
  composer: {
    placeholder: "Gemini に質問してみましょう…",
    send: "送信",
    sending: "送信中…",
    speed: "再生速度",
  },
  audio: {
    play: "音声を再生",
    pause: "音声を一時停止",
    playLabel: "音声を再生",
  },
  log: {
    audioUnavailable: "音声を利用できません。",
    regenerate: "音声を再生成",
    tokens: "{{count}} トークン | {{model}}",
    deleteMessage: "削除",
  },
};

const ko = {
  app: {
    title: "Indexed 음성 스튜디오",
    subtitle: "Gemini + Azure 기반 클라이언트 사이드 실험",
    nav: {
      conversation: "대화",
      voice: "음성 & 데이터",
      settings: "설정",
    },
    cleanup: {
      last: "마지막 정리 {{time}}",
      pending: "정리 대기 중",
    },
    language: "언어",
  },
  common: {
    cancel: "취소",
    save: "저장",
    delete: "삭제",
    reset: "초기화",
    close: "닫기",
    clear: "지우기",
    loading: "로딩 중…",
    default: "기본값",
  },
  sidebar: {
    newChat: "+ 새 대화",
    rename: "이름 변경",
    delete: "삭제",
    empty: "첫 번째 대화를 만드는 중입니다…",
    save: "저장",
    cancel: "취소",
    deleteTitle: "대화를 삭제할까요?",
    deleteBody: "\"{{title}}\"와 캐시된 음성을 삭제합니다. 이 작업은 되돌릴 수 없습니다.",
    deleteAction: "대화 삭제",
  },
  conversation: {
    contextHeading: "대화 컨텍스트",
    contextDescription: "이번 대화의 목표와 규칙을 정의하세요.",
    empty: "아직 메시지가 없습니다. Gemini에게 인사해 보세요!",
    goalLabel: "목표 / 페르소나",
    goalPlaceholder: "이 대화에서 이루고 싶은 목표를 입력하세요.",
    constraintsLabel: "제약 및 가이드라인",
    constraintsPlaceholder: "톤, 경계, 기타 요구 사항을 작성하세요.",
    achievementsHeading: "성과 로그",
    achievementsDescription: "대화를 기반으로 한 진행 상황 요약입니다.",
    achievementsUpdating: "성과를 업데이트하는 중…",
    generateAchievements: "성과 생성",
    generateAchievementsBusy: "생성 중…",
    audioAutoplayHint: "어시스턴트 음성은 자동으로 재생됩니다.",
    deleteMessage: "삭제",
    reset: "초기화",
    save: "저장",
    systemMetadataHint:
      "Gemini 응답은 음성으로 변환되어 IndexedDB에 저장됩니다. 수동 재생을 원하면 자동 재생을 끄세요.",
  },
  composer: {
    placeholder: "Gemini에게 무엇이든 물어보세요…",
    send: "전송",
    sending: "전송 중…",
    speed: "재생 속도",
  },
  audio: {
    play: "어시스턴트 음성 재생",
    pause: "어시스턴트 음성 일시 정지",
    playLabel: "오디오 재생",
  },
  log: {
    audioUnavailable: "오디오를 사용할 수 없습니다.",
    regenerate: "오디오 다시 생성",
    tokens: "{{count}} 토큰 | {{model}}",
    deleteMessage: "삭제",
  },
};

const resources = {
  en: { translation: en },
  "zh-Hans": { translation: zhHans },
  "zh-Hant": { translation: zhHant },
  ja: { translation: ja },
  ko: { translation: ko },
};

const storedLang = localStorage.getItem("app-language") ?? "en";

i18n.use(initReactI18next).init({
  resources,
  lng: storedLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("app-language", lng);
});

export default i18n;

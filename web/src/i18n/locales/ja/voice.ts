const voice = {
  voice: {
    voiceLibrary: "ボイスライブラリ",
    voiceLibraryDesc:
      "会話ビューで利用できる音声を管理します。インポート/エクスポート機能は近日対応予定です。",
    table: {
      name: "名前",
      locale: "ロケール",
      style: "スタイル",
      voiceId: "ボイス ID",
      actions: "操作",
      defaultBadge: "デフォルト",
    },
    actions: {
      setDefault: "デフォルトに設定",
      delete: "削除",
    },
    form: {
      title: "音声の追加 / 編集",
      namePlaceholder: "音声名",
      localePlaceholder: "ロケール（例: en-US）",
      azureIdPlaceholder: "Azure 音声 ID（任意）",
      stylePlaceholder: "スタイル（casual、news、general など）",
      tagsPlaceholder: "タグ（カンマ区切り）",
      save: "音声を保存",
      saving: "保存中…",
    },
    cachedAudio: "キャッシュ済み音声",
    cachedAudioEmpty: "まだ音声はキャッシュされていません。Gemini へのプロンプトを送信して生成してください。",
    workerLog: "ワーカーログ",
    noVoices: "まだ音声がありません。下のフォームから追加してください。",
    noLogs: "まだメッセージはありません。",
    messages: {
      nameRequired: "音声名は必須です。",
      voiceSaved: "音声を保存しました。",
      voiceSaveFailed: "音声の保存に失敗しました。",
      defaultSet: '「{{name}}」をデフォルト音声に設定しました。',
      setDefaultFirst: "先に別の音声をデフォルトに設定してください。",
      voiceDeleted: '音声「{{name}}」を削除しました。',
      audioDeleted: "音声クリップを削除しました。",
      cachedSummary: "{{count}} クリップ | {{size}}",
      expiresLabel: "{{time}} に有効期限",
      sizeLabel: "{{size}}",
      runCleanup: "今すぐクリーンアップを実行",
      cleaning: "クリーンアップ中…",
      defaultStyle: "general",
      notAvailable: "該当なし",
    },
  },
};

export default voice;

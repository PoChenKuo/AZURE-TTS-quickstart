const voice = {
  voice: {
    voiceLibrary: "声音库",
    voiceLibraryDesc:
      "管理可用于对话视图的语音，导入/导出功能即将推出。",
    table: {
      name: "名称",
      locale: "区域",
      style: "风格",
      voiceId: "语音 ID",
      actions: "操作",
      defaultBadge: "默认",
    },
    actions: {
      setDefault: "设为默认",
      delete: "删除",
    },
    form: {
      title: "新增 / 编辑语音",
      namePlaceholder: "语音名称",
      localePlaceholder: "区域（例如 en-US）",
      azureIdPlaceholder: "Azure 语音 ID（可选）",
      stylePlaceholder: "风格（casual、news、general 等）",
      tagsPlaceholder: "标签（用逗号分隔）",
      save: "保存语音",
      saving: "正在保存…",
    },
    cachedAudio: "已缓存音频",
    cachedAudioEmpty: "尚无缓存音频，发送 Gemini 提示即可生成。",
    workerLog: "工作日志",
    noVoices: "暂时沒有语音，请使用下方表单添加第一条记录。",
    noLogs: "暂无消息。",
    messages: {
      nameRequired: "语音名称为必填项。",
      voiceSaved: "语音已保存。",
      voiceSaveFailed: "保存语音失败。",
      defaultSet: '"{{name}}" 现已设为默认语音。',
      setDefaultFirst: "请先设置其他默认语音。",
      voiceDeleted: '语音 "{{name}}" 已删除。',
      audioDeleted: "已删除音频片段。",
      cachedSummary: "{{count}} 个片段 | {{size}}",
      expiresLabel: "过期时间 {{time}}",
      sizeLabel: "{{size}}",
      runCleanup: "立即执行清理",
      cleaning: "正在清理…",
      defaultStyle: "通用",
      notAvailable: "无",
    },
  },
};

export default voice;

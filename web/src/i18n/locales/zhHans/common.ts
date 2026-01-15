const common = {
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
  toasts: {
    settingsSaved: "设置已保存。",
    settingsFailed: "设置保存失败。",
    azureTestFailed: "Azure 测试失败，请查看控制台了解详情。",
    azureTestSuccess: "已播放 Azure 语音测试。",
    geminiTestFailed: "Gemini 测试失败。",
    geminiTestSuccess: "Gemini 已响应！",
    achievementsFailed: "生成成果失败。",
    achievementsCleared: "成果已清除。",
    achievementsUpdated: "成果已更新。",
    chatContextSaved: "已更新对话目标和约束。",
    chatContextFailed: "对话详情保存失败。",
  },
};

export default common;

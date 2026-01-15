const common = {
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

export default common;

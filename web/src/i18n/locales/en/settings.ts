const settings = {
  settings: {
    title: "Settings",
    description:
      "Keys stay inside IndexedDB. Use the testers to make sure everything works before heading back to the conversation view.",
    azureSpeechKey: "Azure Speech Key",
    azureSpeechKeyPlaceholder: "Paste your Azure Speech key",
    azureEndpoint: "Azure Endpoint URL",
    azureEndpointPlaceholder:
      "https://<region>.tts.speech.microsoft.com/cognitiveservices/v1",
    azureRegion: "Azure Region (optional)",
    azureRegionPlaceholder: "eastus",
    geminiKey: "Gemini API Key",
    geminiKeyPlaceholder: "Paste your Gemini key",
    geminiModel: "Gemini Model",
    cleanupInterval: "Cleanup Interval (minutes)",
    defaultVoice: "Default Voice",
    voiceHelper: "Add a voice in the Voice & Data manager to unlock this selector.",
    encryption: "Enable passphrase encryption (coming soon)",
    conversationFont: "Conversation font size",
    conversationFontDescription: "Controls how large the conversation log text appears.",
    fontScaleOptions: {
      compact: "Compact (90%)",
      comfortable: "Comfortable (100%)",
      relaxed: "Relaxed (115%)",
      large: "Large (130%)",
      extraLarge: "Extra large (150%)",
      huge: "Huge (170%)",
      superHuge: "Super Huge (190%)",
      extraHuge: "Extra Huge (220%)",
    },
    save: "Save changes",
    saving: "Saving...",
    testAzure: "Test Azure Voice",
    testingAzure: "Testing...",
    testGemini: "Test Gemini Ping",
    testingGemini: "Testing...",
    backup: {
      title: "Data Backup",
      description:
        "Export a JSON snapshot of all IndexedDB tables or restore from a previous backup.",
      export: "Export backup",
      exporting: "Exporting…",
      import: "Import backup",
      importing: "Importing…",
      warning:
        "Importing will overwrite your existing chats, voices, and cached audio. Make sure you trust the backup file.",
    },
  },
};

export default settings;

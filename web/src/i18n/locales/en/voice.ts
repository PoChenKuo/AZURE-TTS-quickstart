const voice = {
  voice: {
    voiceLibrary: "Voice Library",
    voiceLibraryDesc:
      "Manage the voices available to the conversation view. Import/export support is coming soon.",
    table: {
      name: "Name",
      locale: "Locale",
      style: "Style",
      voiceId: "Voice ID",
      actions: "Actions",
      defaultBadge: "Default",
    },
    actions: {
      setDefault: "Set default",
      delete: "Delete",
    },
    form: {
      title: "Add / Edit Voice",
      namePlaceholder: "Voice name",
      localePlaceholder: "Locale (e.g., en-US)",
      azureIdPlaceholder: "Azure voice ID (optional)",
      stylePlaceholder: "Style (casual, news, general...)",
      tagsPlaceholder: "Tags (comma separated)",
      save: "Save Voice",
      saving: "Saving...",
    },
    cachedAudio: "Cached Audio",
    cachedAudioEmpty: "No cached audio blobs yet—send a Gemini prompt to generate one.",
    workerLog: "Worker Log",
    noVoices: "No voices yet. Use the form below to add your first entry.",
    noLogs: "No messages yet.",
    messages: {
      nameRequired: "Voice name is required.",
      voiceSaved: "Voice saved.",
      voiceSaveFailed: "Failed to save voice.",
      defaultSet: '"{{name}}" is now the default voice.',
      setDefaultFirst: "Set another default voice first.",
      voiceDeleted: 'Voice "{{name}}" deleted.',
      audioDeleted: "Deleted audio clip.",
      cachedSummary: "{{count}} clips | {{size}}",
      expiresLabel: "Expires {{time}}",
      sizeLabel: "{{size}}",
      runCleanup: "Run cleanup now",
      cleaning: "Cleaning...",
      defaultStyle: "general",
      notAvailable: "n/a",
    },
  },
};

export default voice;

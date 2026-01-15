const voice = {
  voice: {
    voiceLibrary: "음성 라이브러리",
    voiceLibraryDesc:
      "대화 화면에서 사용할 수 있는 음성을 관리합니다. 가져오기/내보내기 기능은 곧 제공될 예정입니다.",
    table: {
      name: "이름",
      locale: "로케일",
      style: "스타일",
      voiceId: "음성 ID",
      actions: "작업",
      defaultBadge: "기본값",
    },
    actions: {
      setDefault: "기본값으로 설정",
      delete: "삭제",
    },
    form: {
      title: "음성 추가 / 편집",
      namePlaceholder: "음성 이름",
      localePlaceholder: "로케일(예: en-US)",
      azureIdPlaceholder: "Azure 음성 ID(선택)",
      stylePlaceholder: "스타일(casual, news, general 등)",
      tagsPlaceholder: "태그(쉼표로 구분)",
      save: "음성 저장",
      saving: "저장 중…",
    },
    cachedAudio: "캐시된 오디오",
    cachedAudioEmpty: "아직 캐시된 오디오가 없습니다. Gemini 프롬프트를 보내 생성해 보세요.",
    workerLog: "작업 로그",
    noVoices: "등록된 음성이 없습니다. 아래 폼에서 첫 음성을 추가하세요.",
    noLogs: "아직 메시지가 없습니다.",
    messages: {
      nameRequired: "음성 이름을 입력하세요.",
      voiceSaved: "음성을 저장했습니다.",
      voiceSaveFailed: "음성 저장에 실패했습니다.",
      defaultSet: '"{{name}}"가 기본 음성이 되었습니다.',
      setDefaultFirst: "먼저 다른 기본 음성을 지정하세요.",
      voiceDeleted: '음성 "{{name}}"를 삭제했습니다.',
      audioDeleted: "오디오 클립을 삭제했습니다.",
      cachedSummary: "{{count}}개 클립 | {{size}}",
      expiresLabel: "{{time}} 만료",
      sizeLabel: "{{size}}",
      runCleanup: "지금 즉시 정리 실행",
      cleaning: "정리 중…",
      defaultStyle: "일반",
      notAvailable: "없음",
    },
  },
};

export default voice;

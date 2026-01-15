const common = {
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
  toasts: {
    settingsSaved: "설정을 저장했습니다.",
    settingsFailed: "설정 저장에 실패했습니다.",
    azureTestFailed: "Azure 테스트에 실패했습니다. 콘솔을 확인하세요.",
    azureTestSuccess: "Azure 음성 테스트를 재생했습니다.",
    geminiTestFailed: "Gemini 테스트에 실패했습니다.",
    geminiTestSuccess: "Gemini가 응답했습니다!",
    achievementsFailed: "성과 생성에 실패했습니다.",
    achievementsCleared: "성과를 지웠습니다.",
    achievementsUpdated: "성과를 업데이트했습니다.",
    chatContextSaved: "대화 목표 및 제약을 업데이트했습니다.",
    chatContextFailed: "대화 세부 정보 저장에 실패했습니다.",
  },
};

export default common;

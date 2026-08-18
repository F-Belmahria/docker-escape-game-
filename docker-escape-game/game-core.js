export function normalizeAnswer(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function createInitialState(teamName, startedAt = Date.now()) {
  return {
    teamName: teamName.trim(),
    startedAt,
    currentMission: 1,
    hintsRemaining: 3,
    hintsUsed: 0,
    wrongAttempts: 0,
    words: [],
    completedMissionIds: [],
    completed: false,
  };
}

export function useHint(state) {
  if (state.hintsRemaining <= 0) return state;
  return {
    ...state,
    hintsRemaining: state.hintsRemaining - 1,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function registerWrongAttempt(state) {
  return {...state, wrongAttempts: (state.wrongAttempts || 0) + 1};
}

export function completeMission(state, missionId, word) {
  if (state.completedMissionIds.includes(missionId) || missionId !== state.currentMission) {
    return state;
  }
  const completedMissionIds = [...state.completedMissionIds, missionId];
  const words = [...state.words, normalizeAnswer(word)];
  return {
    ...state,
    completedMissionIds,
    words,
    currentMission: Math.min(6, missionId + 1),
  };
}

export function markCompleted(state) {
  return {...state, completed: true, completedAt: Date.now()};
}

export function calculateScore(state) {
  const ids = state.completedMissionIds || [];
  const missionScore = ids.reduce((sum, id) => sum + (id === 5 ? 20 : (id >= 1 && id <= 4 ? 15 : 0)), 0);
  const finalScore = state.completed ? 20 : 0;
  const hintPenalty = (state.hintsUsed || 0) * 5;
  const wrongPenalty = (state.wrongAttempts || 0) * 2;
  return Math.max(0, Math.min(100, missionScore + finalScore - hintPenalty - wrongPenalty));
}

export function getScoreLevel(score) {
  if (score >= 95) return 'Docker Master';
  if (score >= 80) return 'Docker Operator';
  if (score >= 65) return 'Container Explorer';
  if (score >= 50) return 'Docker Apprentice';
  return 'Mission accomplie';
}

export function scoreDistanceToPerfect(score) {
  return Math.max(0, 100 - Number(score || 0));
}

export function remainingMs(state, now = Date.now(), durationMs = 30 * 60 * 1000) {
  return Math.max(0, durationMs - (now - state.startedAt));
}

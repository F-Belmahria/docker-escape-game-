import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialState,
  useHint,
  completeMission,
  calculateScore,
  normalizeAnswer,
} from '../game-core.js';
import {
  validateMission1,
  validateMission2,
  validateMission3,
  validateMission4,
  validateMission5Command,
  validateMission5Diagnosis,
  validateMission1Code,
  validateMission2Reason,
  validateMission3Reason,
  validateMission4Safety,
  validateFinalAnswer,
} from '../missions.js';

test('initial state starts mission 1 with three hint tokens', () => {
  const state = createInitialState('Equipe Baleine', 1000);
  assert.equal(state.teamName, 'Equipe Baleine');
  assert.equal(state.currentMission, 1);
  assert.equal(state.hintsRemaining, 3);
  assert.deepEqual(state.words, []);
  assert.equal(state.startedAt, 1000);
});

test('using a hint consumes one token and increments hintsUsed', () => {
  const state = createInitialState('A', 1000);
  const next = useHint(state);
  assert.equal(next.hintsRemaining, 2);
  assert.equal(next.hintsUsed, 1);
  assert.equal(state.hintsRemaining, 3);
});

test('using hint with no tokens keeps state unchanged', () => {
  const state = {...createInitialState('A', 1000), hintsRemaining: 0, hintsUsed: 3};
  assert.deepEqual(useHint(state), state);
});

test('completing a mission records its word and advances once', () => {
  const state = createInitialState('A', 1000);
  const next = completeMission(state, 1, 'IMAGE');
  assert.equal(next.currentMission, 2);
  assert.deepEqual(next.words, ['IMAGE']);
  const duplicate = completeMission(next, 1, 'IMAGE');
  assert.deepEqual(duplicate, next);
});

test('score is based on mission completion and penalties, not elapsed time', () => {
  const state = {...createInitialState('A', 0), completedMissionIds:[1], hintsUsed:0, wrongAttempts:0};
  assert.equal(calculateScore(state, 60_000), 15);
  assert.equal(calculateScore(state, 600_000), 15);
});

test('normalization ignores accents, spaces and case', () => {
  assert.equal(normalizeAnswer('  RéSeAu  '), 'RESEAU');
});

test('mission 1 requires exact Docker chain and rejects volume decoy', () => {
  assert.equal(validateMission1(['Dockerfile','docker build','Image','docker run','Conteneur']), true);
  assert.equal(validateMission1(['Dockerfile','Image','docker build','docker run','Conteneur']), false);
  assert.equal(validateMission1(['Dockerfile','docker build','Image','Volume','Conteneur']), false);
});

test('mission 2 requires external 8080 mapped to internal 80', () => {
  assert.equal(validateMission2('8080','80'), true);
  assert.equal(validateMission2('80','8080'), false);
});

test('mission 3 accepts db and rejects localhost', () => {
  assert.equal(validateMission3('db'), true);
  assert.equal(validateMission3('localhost'), false);
});

test('mission 4 requires mysql_data mounted at /var/lib/mysql', () => {
  assert.equal(validateMission4('mysql_data','/var/lib/mysql'), true);
  assert.equal(validateMission4('mysql_data','/var/www/html'), false);
});

test('mission 5 terminal recognizes diagnostic commands', () => {
  assert.equal(validateMission5Command('docker compose ps').kind, 'status');
  assert.equal(validateMission5Command('docker compose logs db').kind, 'logs');
  assert.equal(validateMission5Command('docker volume ls').kind, 'unknown');
});

test('mission 5 rejects free-text style answers in favor of diagnosis cards', () => {
  assert.equal(validateMission5Diagnosis('Le service db est unhealthy'), false);
  assert.equal(validateMission5Diagnosis('auth-healthcheck'), true);
});

test('final answer is CONTENEUR', () => {
  assert.equal(validateFinalAnswer('conteneur'), true);
  assert.equal(validateFinalAnswer('container'), false);
});


test('mission 1 code reading requires correct meanings for FROM RUN and COPY', () => {
  assert.equal(validateMission1Code({ from: 'base-image', run: 'build-command', copy: 'copy-project' }), true);
  assert.equal(validateMission1Code({ from: 'start-container', run: 'build-command', copy: 'copy-project' }), false);
});

test('mission 2 requires understanding which side of 8080:80 belongs to host and container', () => {
  assert.equal(validateMission2Reason('host-left-container-right'), true);
  assert.equal(validateMission2Reason('container-left-host-right'), false);
});

test('mission 3 requires Docker Compose DNS reasoning, not only the db value', () => {
  assert.equal(validateMission3Reason('service-name-dns'), true);
  assert.equal(validateMission3Reason('fixed-container-ip'), false);
});

test('mission 4 checks that down -v removes named volumes and can destroy database data', () => {
  assert.equal(validateMission4Safety('remove-volumes'), true);
  assert.equal(validateMission4Safety('keep-volumes'), false);
});

test('mission 5 diagnosis is chosen from close diagnostic cards', () => {
  assert.equal(validateMission5Diagnosis('auth-healthcheck'), true);
  assert.equal(validateMission5Diagnosis('network-hostname'), false);
  assert.equal(validateMission5Diagnosis('data-mount'), false);
});

test('score is out of 100 using mission points and penalties', () => {
  const state = {
    ...createInitialState('A', 0),
    completedMissionIds: [1,2,3,4,5],
    completed: true,
    hintsUsed: 2,
    wrongAttempts: 3,
  };
  assert.equal(calculateScore(state, 1_000_000), 84);
});

test('wrong attempt increments counter without mutating original state', async () => {
  const { registerWrongAttempt } = await import('../game-core.js');
  const state = createInitialState('A', 0);
  const next = registerWrongAttempt(state);
  assert.equal(next.wrongAttempts, 1);
  assert.equal(state.wrongAttempts, 0);
});

test('score never goes below zero and reaches 100 with perfect run', () => {
  const perfect = {
    ...createInitialState('A', 0),
    completedMissionIds: [1,2,3,4,5],
    completed: true,
    hintsUsed: 0,
    wrongAttempts: 0,
  };
  assert.equal(calculateScore(perfect, 99_999_999), 100);
  assert.equal(calculateScore({...perfect, hintsUsed: 20, wrongAttempts: 20}, 0), 0);
});

test('score level and distance to perfect are derived from final score', async () => {
  const { getScoreLevel, scoreDistanceToPerfect } = await import('../game-core.js');
  assert.equal(getScoreLevel(97), 'Docker Master');
  assert.equal(getScoreLevel(84), 'Docker Operator');
  assert.equal(getScoreLevel(70), 'Container Explorer');
  assert.equal(getScoreLevel(55), 'Docker Apprentice');
  assert.equal(getScoreLevel(40), 'Mission accomplie');
  assert.equal(scoreDistanceToPerfect(84), 16);
});

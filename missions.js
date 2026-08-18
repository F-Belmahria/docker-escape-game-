import { normalizeAnswer } from './game-core.js';

export const missionWords = ['IMAGE', 'PORT', 'RESEAU', 'VOLUME', 'LOGS'];

export function validateMission1(order) {
  const expected = ['DOCKERFILE', 'DOCKER BUILD', 'IMAGE', 'DOCKER RUN', 'CONTENEUR'];
  return Array.isArray(order) && order.length === expected.length && order.every((item, i) => normalizeAnswer(item) === expected[i]);
}

export function validateMission1Code(answers = {}) {
  return answers.from === 'base-image' && answers.run === 'build-command' && answers.copy === 'copy-project';
}

export function validateMission2(hostPort, containerPort) {
  return String(hostPort).trim() === '8080' && String(containerPort).trim() === '80';
}

export function validateMission2Reason(value) {
  return value === 'host-left-container-right';
}

export function validateMission3(host) {
  return normalizeAnswer(host) === 'DB';
}

export function validateMission3Reason(value) {
  return value === 'service-name-dns';
}

export function validateMission4(volume, path) {
  return normalizeAnswer(volume) === 'MYSQL_DATA' && String(path).trim() === '/var/lib/mysql';
}

export function validateMission4Safety(value) {
  return value === 'remove-volumes';
}

export function validateMission5Command(command) {
  const c = String(command).trim().toLowerCase().replace(/\s+/g, ' ');
  if (c === 'docker compose ps') {
    return {
      kind: 'status',
      output: 'NAME                 SERVICE   STATUS\ndocker-escape-web-1  web       Up\ndocker-escape-db-1   db        Up (unhealthy)',
    };
  }
  if (c === 'docker compose logs db') {
    return {
      kind: 'logs',
      output: 'db-1 | [ERROR] Access denied for user root\ndb-1 | healthcheck: mysqladmin ping failed\ndb-1 | service marked unhealthy',
    };
  }
  if (c === 'docker compose logs web') {
    return {
      kind: 'webLogs',
      output: 'web-1 | PHP Warning: SQLSTATE[HY000] [2002] Connection refused',
    };
  }
  return { kind: 'unknown', output: `commande inconnue: ${command}` };
}

export function validateMission5Diagnosis(value) {
  return value === 'auth-healthcheck';
}

export function validateFinalAnswer(value) {
  return normalizeAnswer(value) === 'CONTENEUR';
}

export const hints = {
  1: "Lis le Dockerfile comme une recette : FROM choisit une base, RUN exécute pendant la construction, COPY place les fichiers dans l'image. La chaîne générale vient ensuite.",
  2: "Dans un mapping HOST:CONTENEUR, la valeur de gauche est la porte utilisée depuis ton PC. Apache écoute sur 80 dans le conteneur.",
  3: "Compose fournit un DNS interne : un service peut joindre un autre service par son nom. Une IP trouvée aujourd'hui peut changer demain.",
  4: "La persistance ne dépend pas de restart: always. Vérifie le chemin de données de MySQL et souviens-toi de ce que fait down -v.",
  5: "Commence par compose ps, puis lis les logs du service unhealthy. Compare ensuite chaque diagnostic avec le message exact 'Access denied'.",
};

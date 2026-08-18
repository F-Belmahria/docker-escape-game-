import {
  createInitialState,
  useHint,
  completeMission,
  calculateScore,
  remainingMs,
  markCompleted,
  registerWrongAttempt,
  getScoreLevel,
  scoreDistanceToPerfect,
} from './game-core.js';
import {
  missionWords,
  hints,
  validateMission1,
  validateMission1Code,
  validateMission2,
  validateMission2Reason,
  validateMission3,
  validateMission3Reason,
  validateMission4,
  validateMission4Safety,
  validateMission5Command,
  validateMission5Diagnosis,
  validateFinalAnswer,
} from './missions.js';

const STORAGE_KEY = 'dockerEscapeStateV3';
const DURATION_MS = 30 * 60 * 1000;
let state = loadState();
let timerId = null;
let trainingMode = false;
let mission5Progress = { statusSeen: false, logsSeen: false };

const $ = (selector) => document.querySelector(selector);
const els = {
  start: $('#screen-start'), game: $('#screen-game'), final: $('#screen-final'), timeout: $('#screen-timeout'),
  hud: $('#hud'), hudTeam: $('#hud-team'), hudTime: $('#hud-time'), hudHints: $('#hud-hints'), hudScore: $('#hud-score'),
  form: $('#start-form'), teamName: $('#team-name'), resume: $('#resume-btn'), restart: $('#restart-btn'), timeoutRestart: $('#timeout-restart-btn'), continueBtn: $('#continue-btn'),
  missionLabel: $('#mission-label'), progressPercent: $('#progress-percent'), progressBar: $('#progress-bar'),
  missionIcon: $('#mission-icon'), missionTitle: $('#mission-title'), missionStory: $('#mission-story'), missionObjective: $('#mission-objective'),
  missionContent: $('#mission-content'), feedback: $('#feedback'), wordsList: $('#words-list'), hintBtn: $('#hint-btn'),
  hintDialog: $('#hint-dialog'), hintText: $('#hint-text'), closeHint: $('#close-hint'),
  wordDialog: $('#word-dialog'), revealedWord: $('#revealed-word'), nextMission: $('#next-mission-btn'),
  answerDialog: $('#answer-dialog'), answerIcon: $('#answer-dialog-icon'), answerTitle: $('#answer-dialog-title'), answerText: $('#answer-dialog-text'), answerScore: $('#answer-dialog-score'), answerClose: $('#answer-dialog-close'),
  finalTeam: $('#final-team'), finalTime: $('#final-time'), finalHints: $('#final-hints'), finalErrors: $('#final-errors'), finalScore: $('#final-score'), finalLevel: $('#final-level'), finalDistance: $('#final-distance'),
};

const missionMeta = {
  1: { icon:'🧩', title:'La chaîne Docker', story:"Le pipeline a été mélangé. Avant de remettre les cartes dans l’ordre, vous devez interpréter le Dockerfile.", objective:'Comprendre FROM, RUN et COPY, puis reconstruire Dockerfile → build → Image → run → Conteneur.' },
  2: { icon:'🔌', title:'Le port interdit', story:"Le mapping Docker a disparu. Le client utilise localhost:8080, tandis qu’Apache écoute dans le conteneur.", objective:'Reconstituer le mapping et expliquer quel côté appartient à l’hôte et au conteneur.' },
  3: { icon:'🌐', title:'PHP a perdu MySQL', story:"Le code PDO ne trouve plus MySQL. Les preuves montrent pourtant que les deux services existent dans le même projet Compose.", objective:'Trouver le bon host et expliquer le mécanisme réseau qui permet cette connexion.' },
  4: { icon:'💾', title:'Sauvez les données', story:"Après recréation de db, les données doivent survivre. Une mauvaise commande peut aussi les détruire.", objective:'Construire le montage persistant et identifier la commande dangereuse.' },
  5: { icon:'🚨', title:'Incident production', story:"Le terminal ne donne pas la solution : il donne des faits. À vous de les lire et de choisir le diagnostic le plus cohérent.", objective:'Utiliser compose ps, consulter les logs de db, puis sélectionner le diagnostic qui explique précisément les faits.' },
  6: { icon:'🔐', title:'Le mot secret', story:"Vous avez récupéré cinq mots. Ils décrivent tous un même élément central de Docker.", objective:'Trouver le mot secret final qui relie IMAGE, PORT, RESEAU, VOLUME et LOGS.' },
};

function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function saveState() { if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function clearState() { localStorage.removeItem(STORAGE_KEY); state = null; }

function showScreen(name) {
  [els.start, els.game, els.final, els.timeout].forEach(el => el.classList.add('hidden'));
  els[name].classList.remove('hidden');
  els.hud.classList.toggle('hidden', name === 'start');
}
function formatMs(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
}
function elapsedText() {
  const end = state.completedAt || Date.now();
  const elapsed = Math.max(0, end - state.startedAt);
  return `${Math.floor(elapsed / 60000)} min ${String(Math.floor((elapsed % 60000) / 1000)).padStart(2,'0')} s`;
}
function updateHud() {
  if (!state) return;
  els.hudTeam.textContent = state.teamName;
  const remain = remainingMs(state, Date.now(), DURATION_MS);
  els.hudTime.textContent = trainingMode ? 'ENTRAÎNEMENT' : formatMs(remain);
  els.hudTime.style.color = !trainingMode && remain < 5 * 60 * 1000 ? 'var(--danger)' : '';
  els.hudHints.textContent = state.hintsRemaining ? '🔦'.repeat(state.hintsRemaining) : '0';
  els.hudScore.textContent = `${calculateScore(state)}/100`;
}
function startTimer() {
  clearInterval(timerId); updateHud();
  timerId = setInterval(() => {
    updateHud();
    if (!trainingMode && state && !state.completed && remainingMs(state, Date.now(), DURATION_MS) <= 0) {
      clearInterval(timerId); showScreen('timeout');
    }
  }, 500);
}
function renderWords() {
  els.wordsList.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const el = document.createElement(state.words[i] ? 'b' : 'i');
    el.textContent = state.words[i] || '?'; els.wordsList.appendChild(el);
  }
}
function feedback(message, type='error') {
  els.feedback.textContent = message; els.feedback.className = `feedback show ${type}`;
}
function clearFeedback() { els.feedback.textContent=''; els.feedback.className='feedback'; }

function showAnswerDialog({ correct, text, onClose }) {
  if (!correct) {
    state = registerWrongAttempt(state);
    saveState(); updateHud();
  }
  els.answerDialog.classList.toggle('answer-correct', correct);
  els.answerDialog.classList.toggle('answer-wrong', !correct);
  els.answerIcon.textContent = correct ? '✓' : '×';
  els.answerTitle.textContent = correct ? 'Bonne réponse' : 'Réponse incorrecte';
  els.answerText.innerHTML = correct ? `<strong>Pourquoi c’est correct :</strong> ${text}` : text;
  els.answerScore.textContent = correct ? 'Analyse validée' : '-2 points';
  els.answerClose.textContent = correct ? 'Continuer' : 'Réessayer';
  els.answerClose.onclick = () => {
    els.answerDialog.close();
    if (correct && onClose) onClose();
  };
  els.answerDialog.showModal();
}
function checkAnswer(isCorrect, correctExplanation, wrongGuidance, onCorrect) {
  showAnswerDialog({ correct:isCorrect, text:isCorrect ? correctExplanation : wrongGuidance, onClose:onCorrect });
}

function renderMission() {
  if (!state) return;
  if (state.completed) return renderFinal();
  showScreen('game'); clearFeedback();
  const id = state.currentMission; const meta = missionMeta[id];
  els.missionIcon.textContent = meta.icon; els.missionTitle.textContent = meta.title;
  els.missionStory.textContent = meta.story; els.missionObjective.textContent = meta.objective;
  const progress = id <= 5 ? id * 20 : 100;
  els.missionLabel.textContent = id <= 5 ? `Mission ${id} / 5` : 'Énigme finale';
  els.progressPercent.textContent = `${progress}%`; els.progressBar.style.width = `${progress}%`;
  els.hintBtn.disabled = id === 6 || state.hintsRemaining <= 0;
  renderWords(); mission5Progress = { statusSeen:false, logsSeen:false };
  ({1:renderMission1,2:renderMission2,3:renderMission3,4:renderMission4,5:renderMission5,6:renderFinalRiddle})[id]();
  updateHud();
}
function complete(id) {
  state = completeMission(state, id, missionWords[id-1]); saveState(); renderWords();
  els.revealedWord.textContent = missionWords[id-1];
  els.nextMission.textContent = id === 5 ? 'Énigme finale →' : 'Mission suivante →';
  els.wordDialog.showModal();
}
function missionHeader(kicker, title, text) {
  return `<div class="mission-head"><div><div class="box-title">${kicker}</div><h3>${title}</h3><p>${text}</p></div><div class="security-tag">SESSION ACTIVE</div></div>`;
}
function choiceCards(name, options) {
  return `<div class="choice-grid">${options.map((o,i)=>`<label class="choice-card"><input type="radio" name="${name}" value="${o.value}"><span><b>${o.title || `Option ${String.fromCharCode(65+i)}`}</b>${o.text}</span></label>`).join('')}</div>`;
}
function chosen(name) { return document.querySelector(`input[name="${name}"]:checked`)?.value || ''; }

function renderMission1() {
  els.missionContent.innerHTML = missionHeader('M01 // PIPELINE','Analysez puis reconstituez','Le Dockerfile est votre première preuve. Une interprétation incorrecte peut produire une image qui ne correspond pas au projet.') + `
    <div class="evidence-box"><div class="box-title">PREUVE A — Dockerfile</div><pre>FROM php:8.3-apache\nRUN docker-php-ext-install pdo pdo_mysql\nCOPY . /var/www/html/</pre></div>
    <div class="code-meaning-grid">
      <label>FROM signifie…<select id="m1-from"><option value="">Choisir…</option><option value="start-container">Démarrer immédiatement le conteneur PHP</option><option value="base-image">Utiliser php:8.3-apache comme image de base</option><option value="copy-apache">Copier Apache depuis Windows</option></select></label>
      <label>RUN signifie ici…<select id="m1-run"><option value="">Choisir…</option><option value="runtime-command">Exécuter la commande à chaque ouverture du site</option><option value="build-command">Exécuter une commande pendant la construction de l’image</option><option value="compose-command">Lancer Docker Compose</option></select></label>
      <label>COPY signifie…<select id="m1-copy"><option value="">Choisir…</option><option value="copy-project">Copier le projet vers /var/www/html dans l’image</option><option value="copy-db">Copier MySQL dans Apache</option><option value="mount-volume">Créer automatiquement un volume</option></select></label>
    </div>
    <div class="chain-layout"><div><div class="box-title">CARTES RÉCUPÉRÉES</div><div id="card-pool" class="card-pool"></div></div><div><div class="box-title">SÉQUENCE À RECONSTRUIRE</div><div id="chain-slots" class="chain-slots"></div></div></div>
    <div class="action-row"><button id="check-m1" class="primary-btn" type="button">Valider l’analyse</button><button id="reset-m1" class="ghost-btn" type="button">Réinitialiser</button></div>`;
  const cards=['Volume','docker run','Dockerfile','Conteneur','Image','docker build'];
  const pool=$('#card-pool'), slots=$('#chain-slots'), order=[];
  function draw(){
    pool.innerHTML=''; cards.filter(c=>!order.includes(c)).forEach(card=>{ const b=document.createElement('button'); b.type='button'; b.className='card-chip'; b.textContent=card; b.onclick=()=>{if(order.length<5){order.push(card);draw();}}; pool.appendChild(b); });
    slots.innerHTML=''; for(let i=0;i<5;i++){ const s=document.createElement('div'); s.className=`chain-slot ${order[i]?'filled':''}`; s.innerHTML=`<span class="slot-number">${i+1}</span><span>${order[i]||'Déposez une carte ici'}</span>`; if(order[i])s.onclick=()=>{order.splice(i,1);draw();}; slots.appendChild(s); }
  }
  draw(); $('#reset-m1').onclick=()=>{order.splice(0);draw();};
  $('#check-m1').onclick=()=>{
    const codeOk=validateMission1Code({from:$('#m1-from').value,run:$('#m1-run').value,copy:$('#m1-copy').value});
    const chainOk=validateMission1(order); const good=codeOk&&chainOk;
    checkAnswer(good,
      'FROM choisit l’image de base, RUN exécute une commande pendant le build et COPY place les fichiers dans l’image. Ensuite Dockerfile → docker build → Image → docker run → Conteneur.',
      'Une partie de l’analyse est fausse. Relisez le rôle de FROM/RUN/COPY et vérifiez aussi l’ordre de la chaîne. La carte « Volume » n’appartient pas à cette séquence.',
      ()=>complete(1));
  };
}

function renderMission2() {
  els.missionContent.innerHTML = missionHeader('M02 // NETWORK EDGE','Réparez le passage','Preuve : le navigateur demande localhost:8080. Dans l’image php:8.3-apache, Apache écoute sur le port 80.') + `
    <div class="evidence-box"><div class="box-title">PREUVE B — objectif réseau</div><pre>NAVIGATEUR  →  localhost:8080\nDOCKER      →  ????:????\nAPACHE      →  écoute sur 80 dans le conteneur</pre></div>
    <div class="port-stage">
      <div class="device"><div class="emoji">💻</div><h4>Hôte Windows</h4><p>Port publié</p><input id="host-port" class="port-input" inputmode="numeric" maxlength="5" placeholder="????" aria-label="Port de l'ordinateur"></div>
      <div class="link-arrow">⇢</div>
      <div class="device"><div class="emoji">🐳</div><h4>Conteneur web</h4><p>Port Apache</p><input id="container-port" class="port-input" inputmode="numeric" maxlength="5" placeholder="????" aria-label="Port du conteneur"></div>
    </div>
    <div class="mapping-code">ports: [ "<strong id="mapping-preview">????:????</strong>" ]</div>
    <div class="box-title spaced">QUE SIGNIFIE L’ORDRE HOST:CONTENEUR ?</div>
    ${choiceCards('m2-reason',[
      {value:'host-left-container-right',title:'Interprétation A',text:'La valeur de gauche est le port utilisé sur le PC ; celle de droite est le port du service dans le conteneur.'},
      {value:'container-left-host-right',title:'Interprétation B',text:'La valeur de gauche correspond toujours à Apache dans le conteneur ; la droite est le port du navigateur.'},
      {value:'both-container',title:'Interprétation C',text:'Les deux valeurs appartiennent au conteneur ; Docker choisit automatiquement un port Windows.'}
    ])}
    <div class="action-row"><button id="check-m2" class="primary-btn" type="button">Tester le mapping</button></div>`;
  const a=$('#host-port'),b=$('#container-port'),preview=$('#mapping-preview');
  const update=()=>preview.textContent=`${a.value||'????'}:${b.value||'????'}`; a.oninput=update;b.oninput=update;
  $('#check-m2').onclick=()=>{
    const good=validateMission2(a.value,b.value)&&validateMission2Reason(chosen('m2-reason'));
    checkAnswer(good,
      '8080 est le port publié sur votre PC et 80 est le port où Apache écoute dans le conteneur. Docker transmet donc localhost:8080 vers le port 80 du conteneur.',
      'Le test échoue. Reprenez les deux faits : le navigateur utilise 8080 et Apache écoute sur 80. Vérifiez aussi quel côté du « : » appartient à l’hôte.',
      ()=>complete(2));
  };
}

function renderMission3() {
  els.missionContent.innerHTML = missionHeader('M03 // INTERNAL DNS','Retrouvez MySQL','Le conteneur web doit joindre MySQL sans dépendre d’une adresse IP qui peut changer.') + `
    <div class="evidence-box"><div class="box-title">PREUVE C — compose.yaml</div><pre>services:\n  web:\n    build: .\n  db:\n    image: mysql:8.0</pre></div>
    <div class="network-diagram"><div class="node"><div class="emoji">🌐</div><b>web</b><small>PHP + Apache</small></div><div class="network-line"></div><div class="node"><div class="emoji">🗄️</div><b>db</b><small>MySQL 8.0</small></div></div>
    <div class="code-form"><label>Complétez la connexion PDO</label><div class="inline-code">mysql:host=<input id="db-host" autocomplete="off" placeholder="????">;dbname=testdb</div></div>
    <div class="box-title spaced">POURQUOI CE HOST PEUT-IL FONCTIONNER ?</div>
    ${choiceCards('m3-reason',[
      {value:'fixed-container-ip',title:'Hypothèse A',text:'Docker attribue à db une adresse IP fixe définitive ; le nom db est seulement un alias décoratif.'},
      {value:'service-name-dns',title:'Hypothèse B',text:'Compose fournit un réseau et une résolution de noms : les services peuvent se joindre par leur nom de service.'},
      {value:'localhost-forward',title:'Hypothèse C',text:'db est automatiquement transformé en localhost dans chaque conteneur du projet.'}
    ])}
    <div class="action-row"><button id="check-m3" class="primary-btn" type="button">Tester la connexion</button></div>`;
  $('#check-m3').onclick=()=>{
    const good=validateMission3($('#db-host').value)&&validateMission3Reason(chosen('m3-reason'));
    checkAnswer(good,
      'Le host est db, car Docker Compose fournit un réseau interne et une résolution DNS basée sur les noms de services. Une IP de conteneur peut changer ; le nom du service reste la bonne référence.',
      'La connexion échoue. « localhost » désignerait le conteneur web lui-même. Cherchez dans compose.yaml le nom du service MySQL et réfléchissez à la manière dont Compose résout les services entre eux.',
      ()=>complete(3));
  };
}

function renderMission4() {
  els.missionContent.innerHTML = missionHeader('M04 // PERSISTENCE','Protégez la base','Vous devez résoudre deux problèmes : où stocker les fichiers MySQL, puis quelle commande risque de supprimer ce stockage.') + `
    <div class="volume-stage">
      <div class="storage-card"><div class="emoji">🗄️</div><h4>Chemin dans db</h4><p>Choisissez le dossier réellement utilisé par MySQL pour ses fichiers de données.</p><select id="mysql-path"><option value="">Choisir…</option><option>/var/www/html</option><option>/var/lib/mysql</option><option>/var/log/mysql</option></select></div>
      <div class="volume-arrow">⇄</div>
      <div class="storage-card"><div class="emoji">💾</div><h4>Volume nommé</h4><p>Choisissez le stockage qui doit survivre à la recréation du conteneur.</p><select id="volume-name"><option value="">Choisir…</option><option>web_cache</option><option>mysql_data</option><option>db_port</option></select></div>
    </div>
    <div class="mapping-code">volume: <strong id="volume-preview">? : ?</strong></div>
    <div class="box-title spaced">QUELLE COMMANDE MET LES DONNÉES EN DANGER ?</div>
    ${choiceCards('m4-safety',[
      {value:'keep-volumes',title:'Commande A',text:'docker compose down — arrête et supprime les conteneurs du projet.'},
      {value:'remove-volumes',title:'Commande B',text:'docker compose down -v — supprime aussi les volumes associés au projet.'},
      {value:'restart',title:'Commande C',text:'docker compose restart — redémarre les services sans reconstruire les images.'}
    ])}
    <div class="action-row"><button id="check-m4" class="primary-btn" type="button">Tester la persistance</button></div>`;
  const volume=$('#volume-name'),path=$('#mysql-path'),preview=$('#volume-preview');
  const update=()=>preview.textContent=`${volume.value||'?'}:${path.value||'?'}`; volume.onchange=update;path.onchange=update;
  $('#check-m4').onclick=()=>{
    const good=validateMission4(volume.value,path.value)&&validateMission4Safety(chosen('m4-safety'));
    checkAnswer(good,
      'mysql_data:/var/lib/mysql garde les fichiers MySQL dans un volume nommé. docker compose down conserve ce volume, tandis que down -v demande aussi la suppression des volumes et met donc les données en danger.',
      'Une partie de la stratégie est incorrecte : vérifiez le chemin de données MySQL, le nom du volume et la différence entre « down » et « down -v ».',
      ()=>complete(4));
  };
}

function renderMission5() {
  els.missionContent.innerHTML = missionHeader('M05 // INCIDENT RESPONSE','Diagnostiquez avant de réparer','Le terminal ne vous donnera pas la solution : il vous donne des faits. À vous de choisir le diagnostic qui explique le mieux ces faits.') + `
    <div class="terminal-wrap"><div class="terminal-bar"><i></i><i></i><i></i></div><div id="terminal-screen" class="terminal-screen">Docker Escape Terminal v2.0\nIncident #DCK-005\nAstuce : commencez par vérifier l'état des services.\n</div><form id="terminal-form" class="terminal-command"><span>$</span><input id="terminal-input" autocomplete="off" spellcheck="false" placeholder="docker compose ..."></form></div>
    <div class="box-title spaced">CHOISISSEZ LE DIAGNOSTIC LE PLUS COHÉRENT</div>
    ${choiceCards('m5-diagnosis',[
      {value:'auth-healthcheck',title:'Diagnostic A',text:'Les identifiants utilisés pour vérifier MySQL ne correspondent pas à la configuration active ; le contrôle de santé échoue.'},
      {value:'network-hostname',title:'Diagnostic B',text:'MySQL répond, mais le conteneur web tente probablement de joindre un nom d’hôte qui n’existe pas sur le réseau Compose.'},
      {value:'data-mount',title:'Diagnostic C',text:'Le service démarre, mais le répertoire de données MySQL n’est probablement pas monté au bon emplacement.'}
    ])}
    <div class="action-row"><button id="check-m5" class="primary-btn" type="button">Valider le diagnostic</button></div>`;
  const screen=$('#terminal-screen'),input=$('#terminal-input');
  $('#terminal-form').onsubmit=(e)=>{ e.preventDefault(); const cmd=input.value.trim(); if(!cmd)return; const result=validateMission5Command(cmd); screen.textContent+=`\n$ ${cmd}\n${result.output}\n`; screen.scrollTop=screen.scrollHeight; if(result.kind==='status')mission5Progress.statusSeen=true; if(result.kind==='logs')mission5Progress.logsSeen=true; input.value=''; };
  $('#check-m5').onclick=()=>{
    const good=mission5Progress.statusSeen&&mission5Progress.logsSeen&&validateMission5Diagnosis(chosen('m5-diagnosis'));
    checkAnswer(good,
      'compose ps montre db en unhealthy, puis les logs indiquent « Access denied for user root » et un échec de mysqladmin ping. Le diagnostic doit donc expliquer un problème d’identifiants utilisé par le contrôle de santé.',
      'Le diagnostic n’explique pas encore toutes les preuves. Vérifiez d’abord l’état des services avec « docker compose ps », puis lisez « docker compose logs db ». La bonne carte doit expliquer exactement les messages obtenus.',
      ()=>complete(5));
  };
}

function renderFinalRiddle() {
  els.hintBtn.disabled=true;
  els.missionContent.innerHTML=missionHeader('FINAL // DECRYPT','Identifiez l’élément central','Vos cinq mots ne forment pas une phrase : ils décrivent tous quelque chose.')+`
    <div class="final-riddle"><div class="word-orbit">${state.words.map(w=>`<b>${w}</b>`).join('')}</div><p class="riddle-question">Je suis créé à partir d’une <strong>IMAGE</strong>. Je peux exposer un <strong>PORT</strong>, rejoindre un <strong>RESEAU</strong>, monter un <strong>VOLUME</strong>, et mes <strong>LOGS</strong> racontent ce qui m’arrive.<br><br><strong>Qui suis-je ?</strong></p><input id="final-answer" class="final-answer" maxlength="20" placeholder="MOT SECRET" autocomplete="off"><div class="action-row" style="justify-content:center"><button id="check-final" class="primary-btn" type="button">Déverrouiller le serveur</button></div></div>`;
  $('#check-final').onclick=()=>{
    const good=validateFinalAnswer($('#final-answer').value);
    checkAnswer(good,
      'Un conteneur est créé à partir d’une image, peut publier des ports, rejoindre des réseaux, monter des volumes et produire des logs.',
      'Ce mot doit désigner l’objet Docker qui utilise simultanément les cinq notions récupérées. Relisez la phrase et cherchez l’élément qui est réellement exécuté.',
      ()=>{state=markCompleted(state);saveState();renderFinal();});
  };
}

function renderFinal() {
  clearInterval(timerId); showScreen('final');
  const score=calculateScore(state);
  els.finalTeam.textContent=`${state.teamName}, vous avez restauré l’environnement Docker.`;
  els.finalTime.textContent=elapsedText(); els.finalHints.textContent=String(state.hintsUsed||0); els.finalErrors.textContent=String(state.wrongAttempts||0);
  els.finalScore.textContent=`${score} / 100`; els.finalLevel.textContent=getScoreLevel(score);
  els.finalDistance.textContent=score===100?'Score parfait !':`Vous êtes à ${scoreDistanceToPerfect(score)} point${scoreDistanceToPerfect(score)>1?'s':''} du score parfait.`;
  updateHud();
}

els.form.addEventListener('submit',(e)=>{e.preventDefault();const name=els.teamName.value.trim();if(!name)return;state=createInitialState(name);trainingMode=false;saveState();renderMission();startTimer();});
els.resume.addEventListener('click',()=>{state=loadState();if(!state)return;trainingMode=false;state.completed?renderFinal():renderMission();startTimer();});
els.restart.addEventListener('click',resetGame); els.timeoutRestart.addEventListener('click',resetGame);
els.continueBtn.addEventListener('click',()=>{trainingMode=true;renderMission();startTimer();});
els.nextMission.addEventListener('click',()=>{els.wordDialog.close();renderMission();});
els.closeHint.addEventListener('click',()=>els.hintDialog.close());
els.hintBtn.addEventListener('click',()=>{if(!state||state.hintsRemaining<=0||state.currentMission>5)return;state=useHint(state);saveState();els.hintText.textContent=hints[state.currentMission];els.hintDialog.showModal();updateHud();if(state.hintsRemaining<=0)els.hintBtn.disabled=true;});
function resetGame(){clearInterval(timerId);clearState();trainingMode=false;els.teamName.value='';els.resume.classList.add('hidden');showScreen('start');}
if(state){els.resume.classList.remove('hidden');els.resume.textContent=state.completed?`Voir le résultat de ${state.teamName}`:`Reprendre : ${state.teamName}`;}
showScreen('start');

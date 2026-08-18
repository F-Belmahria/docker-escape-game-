# Docker Escape — Design

## Goal
Créer un escape game web pédagogique sur Docker, jouable par plusieurs équipes sur leurs propres ordinateurs via la même URL.

## Audience
Débutants qui viennent d'apprendre les bases Docker : Dockerfile, image, conteneur, ports, réseau Compose, volumes et diagnostic par logs.

## Experience
- Page d'accueil : nom d'équipe + lancement.
- Chronomètre de 30 minutes.
- 5 missions progressives, chacune avec une interaction différente.
- 3 jetons d'aide par équipe ; utiliser l'indice UV consomme un jeton.
- Chaque mission donne un mot : IMAGE, PORT, RESEAU, VOLUME, LOGS.
- Énigme finale : trouver le mot CONTENEUR à partir des cinq mots.
- Score final basé sur le temps et les indices.
- Progression sauvegardée localement dans le navigateur.
- Fonctionne sans backend ni dépendance externe.

## Missions
1. Chaîne Docker : remettre Dockerfile, docker build, Image, docker run, Conteneur dans le bon ordre, avec une fausse carte Volume. Mot gagné : IMAGE.
2. Port cassé : réparer le mapping pour que localhost:8080 atteigne Apache:80. Mot gagné : PORT.
3. PHP a perdu MySQL : déterminer que PHP doit utiliser host=db sur le réseau Compose. Mot gagné : RESEAU.
4. Sauver les données : associer mysql_data à /var/lib/mysql et comprendre la persistance. Mot gagné : VOLUME.
5. Incident production : utiliser un terminal simulé pour exécuter compose ps, logs db et identifier que MySQL est unhealthy/non prêt. Mot gagné : LOGS.

## Visual design
Style sombre moderne de centre de contrôle : fond bleu nuit, panneaux translucides, accents cyan/vert, typographie système, cartes et terminal. Les visuels seront créés en CSS/emoji afin de rester totalement autonome.

## Technical architecture
- `index.html` : structure de l'application.
- `styles.css` : interface responsive et animations.
- `missions.js` : données et validateurs des missions.
- `game-core.js` : état, score, sauvegarde locale et logique de progression.
- `app.js` : rendu DOM et interactions.
- `tests/game-core.test.mjs` : tests Node des règles métier.

## Constraints
- Aucun framework ni CDN.
- Compatible hébergement statique classique.
- Responsive ordinateur/tablette.
- Aucun mot de passe réel ou donnée sensible.
- Les missions doivent enseigner avant tout, pas piéger arbitrairement.

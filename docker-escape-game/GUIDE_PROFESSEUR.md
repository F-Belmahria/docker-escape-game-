# Docker Escape — Guide professeur (version 2)

## Objectif
Faire apprendre Docker par enquête et lecture de code, pas par simple QCM. Durée cible : 20 à 30 minutes.

## Score
- Mission 1 : 15 points
- Mission 2 : 15 points
- Mission 3 : 15 points
- Mission 4 : 15 points
- Mission 5 : 20 points
- Énigme finale : 20 points
- Indice UV utilisé : -5 points
- Mauvaise validation : -2 points
- Maximum : 100/100

Le temps sert surtout à départager deux équipes ayant le même score.

## Niveaux
- 95–100 : Docker Master
- 80–94 : Docker Operator
- 65–79 : Container Explorer
- 50–64 : Docker Apprentice
- < 50 : Mission accomplie

## Mission 1 — Dockerfile + chaîne
Interprétation :
- FROM = choisir l'image de base
- RUN = exécuter une commande pendant le build
- COPY = copier le projet dans l'image

Ordre :
Dockerfile → docker build → Image → docker run → Conteneur

Carte intruse : Volume
Mot gagné : IMAGE

## Mission 2 — Ports
Mapping : 8080:80
- 8080 = port du PC / host
- 80 = port du conteneur où Apache écoute
Mot gagné : PORT

## Mission 3 — Réseau Compose
Host PDO : db
Raison : Docker Compose fournit un DNS interne et le nom du service est résolu sur le réseau du projet.
Mot gagné : RESEAU

## Mission 4 — Persistance
Montage : mysql_data:/var/lib/mysql
Commande dangereuse : docker compose down -v
Mot gagné : VOLUME

## Mission 5 — Diagnostic
Commandes attendues :
1. docker compose ps
2. docker compose logs db

Faits observés : db unhealthy, Access denied for user root, healthcheck échoué.
Bonne carte : les identifiants utilisés pour vérifier MySQL ne correspondent pas à la configuration active ; le contrôle de santé échoue.
Mot gagné : LOGS

## Énigme finale
IMAGE + PORT + RESEAU + VOLUME + LOGS décrivent un CONTENEUR.
Réponse : CONTENEUR

## Mise en ligne
Téléverser tous les fichiers à la racine d'un dossier web : index.html, styles.css, app.js, game-core.js, missions.js.
Aucun backend ni base de données n'est nécessaire. Chaque équipe joue avec sa propre progression stockée dans son navigateur.

## Version V3 — feedback pédagogique et mode clair

- Interface claire optimisée pour une salle de cours en journée ; seul le terminal simulé reste sombre.
- Mission 2 masque les deux côtés du mapping avec `????:????` avant saisie.
- Chaque validation ouvre une fenêtre pédagogique :
  - mauvaise réponse : `-2 points` et une piste sans révéler directement la solution ;
  - bonne réponse : explication de la raison avant de passer au mot-indice.
- Les pénalités de score restent : indice UV `-5 points`, erreur `-2 points`.
- Les missions 1 à 4 demandent maintenant de lire/interpréter du code ou de la configuration, pas seulement de deviner un mot.
- Mission 5 utilise trois cartes de diagnostic proches et exige d'avoir exécuté `docker compose ps` puis `docker compose logs db`.

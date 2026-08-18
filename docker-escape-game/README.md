# Docker Escape — Sauvez l'application

Escape game pédagogique Docker en HTML/CSS/JavaScript, sans backend ni dépendance externe.

## Contenu

- 5 missions : chaîne Docker, ports, réseau Compose, volumes, diagnostic/logs.
- 30 minutes par équipe.
- 3 indices « lampe UV ».
- Mots récupérés : `IMAGE`, `PORT`, `RESEAU`, `VOLUME`, `LOGS`.
- Mot secret final : `CONTENEUR`.
- Progression sauvegardée dans le navigateur via `localStorage`.
- Responsive et utilisable sur plusieurs ordinateurs en même temps.

## Tester localement

Comme le projet utilise des modules JavaScript, ouvrez-le de préférence via un petit serveur HTTP :

```bash
python -m http.server 8000
```

Puis ouvrez :

```text
http://localhost:8000
```

## Héberger en ligne

Envoyez simplement ces fichiers dans un dossier de votre hébergement :

```text
docker-escape-game/
├── index.html
├── styles.css
├── app.js
├── game-core.js
└── missions.js
```

Le dossier `tests/` et `docs/` n'est pas nécessaire sur l'hébergement.

Exemple d'URL :

```text
https://votre-domaine.fr/docker-escape-game/
```

## Tests

Avec Node.js :

```bash
npm test
```

## Règles professeur

Chaque équipe joue sur son propre navigateur. Les indices UV coûtent un jeton. Le score commence à 1000, perd 0,5 point par seconde et 100 points par indice. Si le chrono atteint zéro, le jeu propose de continuer en mode entraînement.

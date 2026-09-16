# Kore Music — Central

Tableau de bord en ligne pour piloter la musique d'accueil des studios Kore.
Chaque studio fait tourner un agent (exe Windows, dossier `../Spotify Scheduler/v2`)
qui joue les playlists en autonomie et remonte son état ici.

- **Voir** tous les studios en direct : qui joue quoi, en ligne / hors ligne, nom + adresse.
- **Régler** playlists et horaires de chaque studio à distance ; l'agent applique dans la minute.
- **Robuste** : l'agent continue à jouer même si le central ou internet tombe (config en cache).

Pile : Next.js 15 (App Router) + Postgres (Neon via Vercel). Mise en ligne : voir `DEPLOIEMENT.md`.

## Développement local

```bash
npm install
# .env.local :  ADMIN_PASSWORD=...  et POSTGRES_URL=...  (base Neon/Vercel)
npm run dev
```

## API de l'agent

`POST /api/agent/sync` — un seul appel : l'agent envoie son état et reçoit sa config.
Auth par `studioId` + `agentKey` (clé propre à chaque studio, régénérable dans le dashboard).

## Structure

- `app/` pages et routes API (dashboard, login, `/studios/[id]`, `/api/agent/sync`, `/api/status`).
- `lib/` base de données, auth (cookie signé), validation du planning, accès studios.

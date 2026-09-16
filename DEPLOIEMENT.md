# Kore Music — Central : mise en ligne

Ce dossier est le tableau de bord en ligne (Next.js) qui pilote tous les studios.
Il se déploie sur Vercel avec une base Postgres, comme tes autres projets.

## 1. Mettre le code sur GitHub

Crée un dépôt `kore-music-central` sous l'organisation **KANSEB** (comme lajava,
danslazone…), puis pousse ce dossier dedans. En ligne de commande depuis ce dossier :

```bash
git init
git add .
git commit -m "Kore Music Central"
git branch -M main
git remote add origin https://github.com/KANSEB/kore-music-central.git
git push -u origin main
```

(Le dépôt peut être privé.)

## 2. Importer dans Vercel

- Sur vercel.com → **Add New… → Project** → importe `KANSEB/kore-music-central`.
- Framework détecté : Next.js. Laisse les réglages par défaut. **Ne déploie pas encore**,
  ou déploie : la première fois l'app affichera « base à connecter », c'est normal.

## 3. Brancher la base Postgres

- Dans le projet Vercel → onglet **Storage** → **Create Database** → **Postgres** (Neon).
- Relie-la au projet. Vercel ajoute tout seul les variables `POSTGRES_URL` / `DATABASE_URL`.
- Les tables se créent automatiquement au premier accès, rien à faire.

## 4. Définir le mot de passe admin

- Projet Vercel → **Settings → Environment Variables** → ajoute :
  - `ADMIN_PASSWORD` = le mot de passe pour ouvrir le tableau de bord (choisis-le).
- **Redeploy** le projet (onglet Deployments → … → Redeploy) pour que les variables
  soient prises en compte.

## 5. C'est en ligne

Ouvre l'URL du projet (ex. `https://kore-music-central.vercel.app`), entre le mot de passe,
et ajoute tes studios. Pour chaque studio créé :

1. Règle playlists et horaires.
2. Clique **Télécharger central.json**.
3. Sur le PC du studio, mets l'exe et ce `central.json` dans le même dossier, double-clique l'exe,
   connecte le compte Spotify Premium du studio une fois. Le studio apparaît dans le dashboard.

## Variables d'environnement (récap)

| Variable | Rôle | Source |
| --- | --- | --- |
| `POSTGRES_URL` (et connexes) | base de données | ajoutée par le store Vercel Postgres |
| `ADMIN_PASSWORD` | mot de passe du tableau de bord | à définir toi-même |

## Prérequis Spotify (une fois)

- Un compte Spotify **Premium par studio**.
- Sur developer.spotify.com/dashboard, dans l'app Kore, Redirect URI
  `http://127.0.0.1:8888/callback`. Le flux PKCE ne nécessite pas de secret.
- En mode développement, ajoute chaque compte Spotify dans « User Management » (max 25),
  ou demande le « Extended quota mode ».

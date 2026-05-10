# Cineappmovies

Application web Next.js pour afficher des films en salle et en streaming a partir de l'API TMDB.

## Apercu

- Affichage des films "Cinema" (liste basee sur TMDB)
- Filtres par plateforme (Cinema, Netflix, Prime Video, Disney+)
- Tri des films streaming (date, popularite, note)
- Fiches detaillees (synopsis, duree, casting, bande-annonce)
- Recommandations de films similaires

## Prerequis

- Node.js 18+ (Node.js 20 recommande)
- npm (installe avec Node.js)
- Un compte TMDB

## 1) Recuperer la cle API TMDB

1. Cree un compte sur [TMDB](https://www.themoviedb.org/).
2. Va dans **Settings > API**.
3. Recupere le token **API Read Access Token (v4 auth)**.
4. Copie cette valeur: c'est celle a utiliser pour `TMDB_API_KEY`.

## 2) Installer le projet

```bash
npm install
```

## 3) Configurer l'environnement

Le projet fournit un fichier d'exemple `.env.example`.

1. Duplique le fichier:

```bash
cp .env.example .env.local
```

Sur Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

2. Ouvre `.env.local` et remplace la valeur:

```env
TMDB_API_KEY=TON_TOKEN_TMDB_ICI
```

## 4) Lancer l'application en local

```bash
npm run dev
```

Puis ouvre:

- [http://localhost:3000](http://localhost:3000)
- Si le port 3000 est occupe, Next.js utilise automatiquement un autre port (ex: 3001).

## 5) Build de production

```bash
npm run build
npm run start
```

## Structure du projet

```text
app/
  api/
    movies/
      route.ts
      [id]/recommendations/route.ts
  layout.tsx
  page.tsx
components/
  MovieCard.tsx
```

## Scripts npm

- `npm run dev` : lance le serveur de dev
- `npm run build` : build de production
- `npm run start` : demarre la build
- `npm run lint` : lance le lint

## Depannage

### "TMDB_API_KEY est manquante"

- Verifie que `.env.local` existe a la racine.
- Verifie que la variable s'appelle exactement `TMDB_API_KEY`.
- Redemarre le serveur apres modification du `.env.local`.

### Aucun film ne s'affiche

- Verifie ta connexion internet.
- Verifie que la cle TMDB est valide.
- Ouvre directement l'endpoint:
  - `http://localhost:3000/api/movies?platform=pathe&type=now_playing&cinema=P0057`

### Le port 3000 est deja utilise

- Next.js bascule souvent sur 3001 automatiquement.
- Regarde l'URL affichee dans le terminal.

## Securite

- Ne commit jamais `.env.local`.
- N'expose jamais ta cle API TMDB publiquement.
- Si une cle fuite, regenere-la depuis ton compte TMDB.

## Stack technique

- Next.js
- React
- TypeScript
- Tailwind CSS
- TMDB API

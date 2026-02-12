# C dans l'air — Analyse de données YouTube

Application web d'analyse des vidéos de l'émission **C dans l'air** (France 5), diffusée sur YouTube. Le projet permet d'explorer 2 964 épisodes de 2016 à 2025, avec des visualisations interactives, une carte du monde, et un moteur de recherche de mots-clés.

> **Démo en ligne** : déployé sur Vercel

---

## Aperçu des fonctionnalités

### Tableau de bord
- Statistiques globales (épisodes, vues, likes, engagement, heures de contenu)
- Évolution annuelle des vues moyennes et de l'engagement
- Répartition de la durée des épisodes (pie chart)
- Tags les plus fréquents (bar chart)
- Engagement par année (graphique + tableau)
- Carte du monde interactive — pays colorés selon le nombre de mentions
- Top 20 des épisodes les plus populaires

### Recherche par mot-clé
- Comparaison de jusqu'à 5 mots-clés simultanément
- Timeline mensuelle et annuelle avec courbes interactives
- Comparaison des vues générées par mot-clé
- Filtrage par année avec des pills de sélection
- Liste paginée de toutes les vidéos correspondantes
- Suggestions de recherche populaires

### Sujets par année
- Sujets en hausse / en baisse (trending)
- Évolution des sujets dans le temps (area chart interactif)
- Carte de chaleur (heatmap) des sujets par année
- Classement des tags (par épisodes, vues totales, vues moyennes)
- Tableau détaillé de tous les tags

### Explorateur vidéo
- Recherche par titre ou tags (accent-agnostic : « election » trouve « élection »)
- Tri par date, vues, likes, commentaires
- Pagination complète
- Lien direct depuis la carte du monde (filtre par pays)

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Langage | TypeScript |
| Style | Tailwind CSS 4 |
| Graphiques | [Recharts](https://recharts.org/) |
| Carte du monde | [react-simple-maps](https://www.react-simple-maps.io/) + [world-atlas](https://github.com/topojson/world-atlas) (50m) |
| Données | CSV parsé côté serveur avec [csv-parse](https://csv.js.org/) |
| Déploiement | Vercel |

---

## Structure du projet

```
cestdanslair/
├── cdanslair_videos.csv            # Données brutes (2 964 vidéos)
├── README.md
└── webapp/                         # Application Next.js
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── postcss.config.mjs
    └── src/
        ├── data/
        │   └── cdanslair_videos.csv    # Copie des données pour le build
        ├── lib/
        │   └── data.ts                 # Chargement CSV, utilitaires, SKIP_TAGS
        ├── components/
        │   ├── Sidebar.tsx             # Navigation latérale
        │   ├── Cards.tsx               # StatCard, ChartContainer
        │   └── WorldMap.tsx            # Carte interactive (react-simple-maps)
        └── app/
            ├── layout.tsx              # Layout global (sidebar + main)
            ├── globals.css             # Variables CSS, thème sombre
            ├── page.tsx                # Tableau de bord
            ├── keywords/page.tsx       # Recherche par mot-clé
            ├── topics/page.tsx         # Analyse des sujets
            ├── videos/page.tsx         # Explorateur vidéo
            └── api/
                ├── dashboard/route.ts  # API tableau de bord
                ├── keywords/route.ts   # API mots-clés
                ├── topics/route.ts     # API sujets
                └── videos/route.ts     # API vidéos
```

---

## Données

Le fichier CSV contient 2 964 épisodes avec les colonnes suivantes :

| Colonne | Description |
|---------|-------------|
| `video_id` | Identifiant YouTube unique |
| `title` | Titre de l'épisode |
| `published_at` | Date de publication (ISO 8601) |
| `duration` | Durée au format `HH:MM:SS` |
| `view_count` | Nombre de vues |
| `like_count` | Nombre de likes |
| `comment_count` | Nombre de commentaires |
| `tags` | Tags séparés par `\|` |
| `category_id` | Catégorie YouTube |
| `description` | Description de la vidéo |
| `url` | Lien YouTube |
| `thumbnail_url` | Miniature |

### Nettoyage appliqué
- Vidéos de moins de 30 minutes supprimées (shorts, extraits)
- Vidéos avec « Archives » dans le titre supprimées
- Doublons supprimés (titre normalisé)
- Années incomplètes (2015, 2026) retirées
- Tags inutiles filtrés via `SKIP_TAGS` (noms d'émissions, présentateurs, mots génériques)

---

## Installation et développement

### Prérequis
- Node.js 18+
- npm

### Lancement local

```bash
# Cloner le projet
git clone https://github.com/mathisdreher/cestdanslair.git
cd cestdanslair/webapp

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Build de production

```bash
npm run build
npm start
```

---

## API Endpoints

Toutes les routes API sont en `GET` et retournent du JSON.

| Route | Description |
|-------|-------------|
| `/api/dashboard` | Statistiques globales, évolution annuelle, distribution des durées, top vidéos, tags, données géographiques |
| `/api/keywords?q=trump,macron` | Comparaison de mots-clés avec timeline mensuelle/annuelle et vidéos correspondantes |
| `/api/topics` | Analyse des tags : évolution, heatmap, tendances (hausse/baisse) |
| `/api/topics?years=2023,2024` | Filtrage par années |
| `/api/videos?q=ukraine&page=1&sort=views&order=desc` | Recherche paginée de vidéos |

### Paramètres communs

| Paramètre | Description |
|-----------|-------------|
| `q` | Terme de recherche (accent-agnostic) |
| `page` | Numéro de page (défaut : 1) |
| `pageSize` | Taille de page (défaut : 20) |
| `sort` | Tri : `date`, `views`, `likes`, `comments` |
| `order` | Ordre : `asc`, `desc` |
| `years` | Années séparées par virgule |

---

## Carte interactive

La carte utilise un TopoJSON 50m de [world-atlas](https://github.com/topojson/world-atlas) et couvre ~40 pays. Chaque pays est coloré selon le nombre de vidéos le mentionnant (échelle logarithmique, gradient indigo).

**Interaction** : survoler un pays affiche un tooltip, cliquer redirige vers l'explorateur vidéo avec le filtre pays pré-rempli.

### Pays couverts
France, États-Unis, Chine, Russie, Ukraine, Allemagne, Royaume-Uni, Italie, Espagne, Iran, Israël, Palestine, Syrie, Turquie, Japon, Corée, Inde, Brésil, Mexique, Canada, Australie, Algérie, Maroc, Tunisie, Liban, Irak, Afghanistan, Groenland, Pologne, Grèce, Belgique, Libye, Mali, Niger, Soudan, Venezuela, Arabie Saoudite, Qatar, Égypte, Pakistan.

---

## Déploiement Vercel

1. Connecter le dépôt GitHub à Vercel
2. Configurer le **Root Directory** sur `webapp`
3. Framework Preset : **Next.js** (détecté automatiquement)
4. Déployer

---

## Licence

Projet personnel — données collectées depuis la chaîne YouTube publique de C dans l'air.
---

## Licence

Distribué sous la licence MIT. Voir le fichier `LICENSE` pour plus d'informations.

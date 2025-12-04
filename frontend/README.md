# PM2 Dashboard - Frontend

Interface web React pour gérer vos bots PM2.

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` :

```env
VITE_API_URL=http://localhost:3000/api
```

## Développement

```bash
npm run dev
```

L'application démarre sur `http://localhost:5173`

## Build Production

```bash
npm run build
```

Les fichiers sont générés dans `dist/`

## Features

- Login JWT
- Table des processus PM2 temps réel
- Restart/Stop/Start des processus
- Logs en temps réel (SSE)
- Thème dark/light
- Responsive design

## Stack

- React 19
- Vite
- TailwindCSS
- React Router
- React Query
- Zustand
- Lucide Icons
- Axios

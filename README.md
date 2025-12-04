# PM2 Dashboard - Bot Management System

Un dashboard web moderne pour gérer et monitorer vos bots PM2 en temps réel.

## Features

### Core
- Table des processus PM2 (ID, nom, status, uptime, CPU, RAM, restarts)
- Boutons de gestion par processus (restart, stop, start)
- Visualisation des logs en temps réel
- Authentification JWT sécurisée
- Thème dark/light avec toggle

### Avancées
- Graphiques temps réel CPU/Memory
- Historique des restarts (timeline)
- Notifications de crash (browser notifications)
- Filtrage et recherche dans les logs
- Export de logs

## Stack Technologique

### Backend
- Node.js + Express
- PM2 Programmatic API
- SQLite (users, historique, crashes)
- JWT + bcrypt pour l'authentification
- Server-Sent Events (SSE) pour le temps réel

### Frontend
- React + Vite
- TailwindCSS (dark/light mode)
- Recharts (graphiques)
- React Query (gestion état serveur)
- Zustand (gestion état client)

## Installation

### Prérequis
- Node.js v18+
- PM2 installé globalement
- Git

### Étapes

1. **Cloner le repository**
```bash
git clone <your-repo-url>
cd Dashboard-Bots
```

2. **Installer les dépendances backend**
```bash
cd backend
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Editer .env et changer JWT_SECRET
```

4. **Initialiser la base de données**
```bash
npm run init-db
# Crée l'admin user avec username: admin, password: admin123
```

5. **Installer les dépendances frontend**
```bash
cd ../frontend
npm install
```

## Développement

### Backend
```bash
cd backend
npm run dev
# Serveur démarre sur http://localhost:3000
```

### Frontend
```bash
cd frontend
npm run dev
# App démarre sur http://localhost:5173
```

## Déploiement sur VPS

### 1. Préparer le code

```bash
# Build le frontend
cd frontend
npm run build
# Les fichiers sont dans frontend/dist/
```

### 2. Transférer sur VPS

```bash
# Depuis votre PC, transférer vers le VPS
scp -r Dashboard-Bots user@your-vps:/path/to/destination
```

### 3. Installation sur VPS

```bash
# Sur le VPS
cd /path/to/Dashboard-Bots/backend
npm install --production

# Créer .env
cp .env.example .env
nano .env  # Editer avec vos valeurs

# Initialiser la base de données
npm run init-db

# Changer le mot de passe admin
npm run create-user admin NewSecurePassword123
```

### 4. Démarrer avec PM2

```bash
# Depuis la racine du projet
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Suivre les instructions pour auto-start au boot
```

### 5. (Optionnel) Configurer Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # SSE support
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### 6. HTTPS avec Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Scripts Disponibles

### Backend
- `npm start` - Démarre le serveur en production
- `npm run dev` - Démarre avec nodemon (hot reload)
- `npm run init-db` - Initialise la base de données
- `npm run create-user <username> <password>` - Crée un utilisateur

### Frontend
- `npm run dev` - Serveur de développement Vite
- `npm run build` - Build pour production
- `npm run preview` - Preview du build

## API Endpoints

### Authentification
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Vérifier token
- `GET /api/auth/me` - Info utilisateur actuel

### Processus
- `GET /api/processes` - Liste tous les processus
- `GET /api/processes/:id` - Détails d'un processus
- `POST /api/processes/:id/restart` - Redémarrer
- `POST /api/processes/:id/stop` - Arrêter
- `POST /api/processes/:id/start` - Démarrer

### Logs
- `GET /api/logs/:id/stream` - Stream SSE en temps réel
- `GET /api/logs/:id/history` - Logs historiques
- `GET /api/logs/:id/errors` - Logs d'erreurs
- `POST /api/logs/:id/search` - Rechercher dans les logs
- `GET /api/logs/:id/export` - Télécharger les logs

### Métriques
- `GET /api/metrics/stream` - Stream SSE des métriques
- `GET /api/metrics/:id` - Métriques historiques d'un processus
- `GET /api/metrics/latest` - Dernières métriques de tous

### Historique
- `GET /api/history/restarts` - Historique des restarts
- `GET /api/history/crashes` - Historique des crashes
- `GET /api/history/timeline` - Timeline combinée
- `GET /api/history/statistics` - Statistiques

## Configuration

### Variables d'environnement (.env)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRATION=24h
DB_PATH=./database.sqlite
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=5
```

### PM2 Ecosystem (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'pm2-dashboard',
    script: './backend/src/server.js',
    instances: 1,
    autorestart: true,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## Sécurité

- JWT avec expiration 24h
- Bcrypt pour les mots de passe (salt rounds 10)
- Rate limiting sur le login (5 tentatives / 15min)
- CORS restreint à l'origin du frontend
- Helmet.js pour les headers de sécurité
- HTTPS recommandé en production

## Troubleshooting

### Le dashboard ne se connecte pas à PM2
```bash
# Vérifier que PM2 tourne
pm2 list

# Vérifier les permissions
# Le dashboard doit tourner sous le même utilisateur que PM2
```

### Erreur de base de données
```bash
# Réinitialiser la base de données
cd backend
rm database.sqlite
npm run init-db
```

### Les logs ne s'affichent pas
```bash
# Vérifier les chemins des logs PM2
pm2 list
# Les logs doivent être dans ~/.pm2/logs/
```

## Maintenance

### Nettoyer l'historique ancien
```bash
# Via API
curl -X DELETE "http://localhost:3000/api/history/clean?days=30" \
  -H "Authorization: Bearer <your-token>"
```

### Backup de la base de données
```bash
cd backend
cp database.sqlite database.sqlite.backup
```

## Licence

MIT

## Support

Pour toute question ou problème, ouvrir une issue sur GitHub.

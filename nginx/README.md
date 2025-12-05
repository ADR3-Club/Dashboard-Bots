# Configuration Nginx + HTTPS

Configuration Nginx avec Let's Encrypt pour le PM2 Dashboard.

## Fichiers

| Fichier | Description |
|---------|-------------|
| `dashboard-initial.conf` | Config HTTP (pour obtenir le certificat) |
| `dashboard.conf` | Config finale avec SSL |
| `setup-ssl.sh` | Script d'installation automatique |

## Installation rapide

### 1. Configurer le script

Éditer `setup-ssl.sh` et modifier les variables :
```bash
DOMAIN="dashboard.example.com"  # Ton domaine
EMAIL="admin@example.com"       # Ton email
```

### 2. Exécuter le script

```bash
# Sur ton VPS, dans le dossier nginx/
sudo bash setup-ssl.sh
```

## Installation manuelle

### 1. Installer Nginx
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
```

### 2. Copier la config initiale
```bash
# Remplacer YOUR_DOMAIN par ton domaine dans le fichier
sudo cp dashboard-initial.conf /etc/nginx/sites-available/dashboard
sudo sed -i 's/YOUR_DOMAIN/dashboard.example.com/g' /etc/nginx/sites-available/dashboard
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Ouvrir les ports
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### 4. Obtenir le certificat SSL
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d dashboard.example.com
```

### 5. Appliquer la config finale
```bash
# Remplacer YOUR_DOMAIN par ton domaine
sudo cp dashboard.conf /etc/nginx/sites-available/dashboard
sudo sed -i 's/YOUR_DOMAIN/dashboard.example.com/g' /etc/nginx/sites-available/dashboard
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Mettre à jour le backend
```bash
# Dans backend/.env
CORS_ORIGIN=https://dashboard.example.com

# Redémarrer
pm2 restart pm2-dashboard-api
```

## Résultat

- `http://your-domain.com` → Redirige vers HTTPS
- `https://your-domain.com` → Dashboard (port 443 → 3000)
- Certificat renouvelé automatiquement tous les 90 jours

## Vérifications

```bash
# Tester la config Nginx
sudo nginx -t

# Voir les logs Nginx
sudo tail -f /var/log/nginx/error.log

# Tester le renouvellement
sudo certbot renew --dry-run
```

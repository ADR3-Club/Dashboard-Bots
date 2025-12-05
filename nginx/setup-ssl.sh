#!/bin/bash

# ===========================================
# Script d'installation Nginx + Let's Encrypt
# ===========================================

set -e

# ============================================
# CONFIGURATION - Modifier ces valeurs
# ============================================
DOMAIN="YOUR_DOMAIN"           # Ex: dashboard.example.com
EMAIL="YOUR_EMAIL"             # Ex: admin@example.com
# ============================================

# Vérifier que les variables ont été configurées
if [ "$DOMAIN" = "YOUR_DOMAIN" ] || [ "$EMAIL" = "YOUR_EMAIL" ]; then
  echo "Erreur: Modifie les variables DOMAIN et EMAIL dans ce script"
  echo "  DOMAIN=$DOMAIN"
  echo "  EMAIL=$EMAIL"
  exit 1
fi

echo "=========================================="
echo "Installation Nginx + SSL pour $DOMAIN"
echo "=========================================="

# 1. Vérifier les droits root
if [ "$EUID" -ne 0 ]; then
  echo "Erreur: Ce script doit être exécuté en root (sudo)"
  exit 1
fi

# 2. Vérifier la propagation DNS
echo ""
echo "[1/7] Vérification DNS..."
IP=$(dig +short $DOMAIN)
if [ -z "$IP" ]; then
  echo "Erreur: Le domaine $DOMAIN ne résout pas encore."
  echo "Attends la propagation DNS et réessaie."
  exit 1
fi
echo "✓ DNS OK: $DOMAIN -> $IP"

# 3. Mettre à jour et installer Nginx
echo ""
echo "[2/7] Installation de Nginx..."
apt update
apt install -y nginx
systemctl enable nginx
echo "✓ Nginx installé"

# 4. Créer la config initiale (HTTP uniquement) avec le bon domaine
echo ""
echo "[3/7] Configuration Nginx (HTTP)..."
sed "s/YOUR_DOMAIN/$DOMAIN/g" ./dashboard-initial.conf > /etc/nginx/sites-available/dashboard
ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "✓ Nginx configuré"

# 5. Configurer le firewall
echo ""
echo "[4/7] Configuration du firewall..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
echo "✓ Firewall configuré"

# 6. Installer Certbot et obtenir le certificat
echo ""
echo "[5/7] Installation de Certbot..."
apt install -y certbot python3-certbot-nginx
echo "✓ Certbot installé"

echo ""
echo "[6/7] Obtention du certificat SSL..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect
echo "✓ Certificat SSL obtenu"

# 7. Copier la config finale avec SSL
echo ""
echo "[7/7] Application de la config SSL finale..."
sed "s/YOUR_DOMAIN/$DOMAIN/g" ./dashboard.conf > /etc/nginx/sites-available/dashboard
nginx -t
systemctl reload nginx
echo "✓ Configuration SSL appliquée"

# 8. Vérifier le renouvellement automatique
echo ""
echo "Vérification du renouvellement automatique..."
certbot renew --dry-run
echo "✓ Renouvellement automatique OK"

echo ""
echo "=========================================="
echo "Installation terminée!"
echo "=========================================="
echo ""
echo "Ton dashboard est maintenant accessible sur:"
echo "  https://$DOMAIN"
echo ""
echo "N'oublie pas de mettre à jour ton .env:"
echo "  CORS_ORIGIN=https://$DOMAIN"
echo ""
echo "Puis redémarre le backend:"
echo "  pm2 restart pm2-dashboard-api"
echo ""

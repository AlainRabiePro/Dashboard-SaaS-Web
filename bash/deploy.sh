
#!/bin/bash

# ─── Fix : se placer dans / pour éviter getcwd errors ─
cd / 2>/dev/null || true

# ─── Couleurs ─────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
DIM='\033[2m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║        🚀 AUTO DEPLOY SCRIPT          ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# ─── Questions de base ────────────────────────────────
read -p "📦 Lien du repo Git : " GIT_REPO
read -p "🌐 Nom de domaine (ex: monsite.com) : " DOMAIN

SITE_NAME=$(echo $DOMAIN | sed 's/\./-/g')
SITE_DIR="/var/www/$SITE_NAME"

echo ""
echo -e "${YELLOW}📋 Récapitulatif :${NC}"
echo "   Repo     : $GIT_REPO"
echo "   Domaine  : $DOMAIN"
echo "   Dossier  : $SITE_DIR"
echo ""
read -p "▶️  Confirmer le déploiement ? (o/n) : " CONFIRM

if [[ "$CONFIRM" != "o" ]]; then
  echo -e "${RED}❌ Déploiement annulé.${NC}"
  exit 1
fi

# ─── Google AdSense ───────────────────────────────────
echo ""
echo -e "${YELLOW}💰 Veux-tu inclure Google AdSense ?${NC}"
echo -e "   ${DIM}(Réponds uniquement o ou n)${NC}"
read -p "   o/n : " ADSENSE
ADSENSE_ID=""

if [[ "$ADSENSE" == "o" ]]; then
  echo ""
  echo -e "   ${DIM}Trouve ton ID sur : adsense.google.com → Compte → Informations du compte${NC}"
  echo -e "   ${DIM}Format attendu    : ca-pub-XXXXXXXXXXXXXXXX${NC}"
  read -p "   → Ton ID AdSense : " ADSENSE_RAW
  # Extraire proprement le numéro même si l'utilisateur colle toute la ligne ads.txt
  PUB_NUM=$(echo "$ADSENSE_RAW" | grep -oP '(?<=pub-)[0-9]+' | head -1)
  if [[ -z "$PUB_NUM" ]]; then
    echo -e "${YELLOW}   ⚠️  ID non reconnu, AdSense ignoré.${NC}"
    ADSENSE="n"
  else
    ADSENSE_ID="ca-pub-${PUB_NUM}"
    echo -e "${GREEN}   ✅ AdSense activé → ID : $ADSENSE_ID${NC}"
  fi
else
  echo -e "   ⏭  AdSense ignoré"
fi

# ─── Installation des dépendances système ─────────────
echo ""
echo -e "${BLUE}📥 Vérification et installation des outils système...${NC}"

apt-get update -qq

if ! command -v git &>/dev/null; then
  echo "  → Installation de Git..."
  apt-get install -y -qq git
fi

if ! command -v nginx &>/dev/null; then
  echo "  → Installation de Nginx..."
  apt-get install -y -qq nginx
  systemctl enable nginx
  systemctl start nginx
fi

if ! command -v certbot &>/dev/null; then
  echo "  → Installation de Certbot..."
  apt-get install -y -qq certbot python3-certbot-nginx
fi

mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
  sed -i '/http {/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
fi

echo -e "${GREEN}✅ Outils système prêts${NC}"

# ─── Clonage du repo ──────────────────────────────────
echo ""
echo -e "${BLUE}⬇️  Clonage du repo...${NC}"

mkdir -p /var/www

if [ -d "$SITE_DIR/.git" ]; then
  echo "📁 Dossier existant, mise à jour avec git pull..."
  cd "$SITE_DIR" && git pull
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du git pull.${NC}"
    exit 1
  fi
else
  [ -d "$SITE_DIR" ] && rm -rf "$SITE_DIR"
  git clone "$GIT_REPO" "$SITE_DIR"
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du clonage. Vérifie le lien Git.${NC}"
    exit 1
  fi
fi

cd "$SITE_DIR"
echo -e "${GREEN}✅ Repo cloné avec succès${NC}"

# ─── Détection de la techno ───────────────────────────
echo ""
echo -e "${BLUE}🔍 Détection de la technologie...${NC}"

if [ -f "Dockerfile" ]; then
  TECH="docker"
  echo -e "${GREEN}🐳 Docker détecté${NC}"
elif [ -f "package.json" ]; then
  if grep -q '"next"' package.json; then
    TECH="nextjs"
    echo -e "${GREEN}▲ Next.js détecté${NC}"
  elif grep -q '"nuxt"' package.json; then
    TECH="nuxt"
    echo -e "${GREEN}💚 Nuxt détecté${NC}"
  elif grep -q '"vite"' package.json; then
    TECH="vite"
    echo -e "${GREEN}⚡ Vite détecté${NC}"
  else
    TECH="node"
    echo -e "${GREEN}📦 Node.js générique détecté${NC}"
  fi
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  if grep -q -i "django" requirements.txt 2>/dev/null; then
    TECH="django"
    echo -e "${GREEN}🎸 Django détecté${NC}"
  else
    TECH="python"
    echo -e "${GREEN}🐍 Python (Flask/FastAPI) détecté${NC}"
  fi
elif [ -f "composer.json" ]; then
  TECH="php"
  echo -e "${GREEN}🐘 PHP/Laravel détecté${NC}"
elif [ -f "go.mod" ]; then
  TECH="go"
  echo -e "${GREEN}🐹 Go détecté${NC}"
elif [ -f "index.html" ] || [ -f "index.htm" ]; then
  TECH="static"
  echo -e "${GREEN}📄 Site statique détecté${NC}"
else
  echo -e "${RED}❌ Technologie non reconnue. Abandon.${NC}"
  exit 1
fi

# ─── Installation des dépendances selon la techno ─────
echo ""
echo -e "${BLUE}📦 Installation des dépendances pour $TECH...${NC}"

install_node() {
  if ! command -v node &>/dev/null; then
    echo "  → Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
    apt-get install -y -qq nodejs
  fi
  if ! command -v pm2 &>/dev/null; then
    echo "  → Installation de PM2..."
    npm install -g pm2 -q
  fi
  echo -e "${GREEN}  ✅ Node.js $(node -v) / PM2 prêts${NC}"
}

install_python() {
  if ! command -v python3 &>/dev/null; then
    echo "  → Installation de Python3..."
    apt-get install -y -qq python3 python3-pip python3-venv
  fi
  if ! command -v gunicorn &>/dev/null; then
    pip3 install gunicorn -q
  fi
  echo -e "${GREEN}  ✅ Python $(python3 --version) prêt${NC}"
}

install_php() {
  if ! command -v php &>/dev/null; then
    echo "  → Installation de PHP..."
    apt-get install -y -qq php php-fpm php-cli php-mbstring php-xml php-curl php-zip
  fi
  if ! command -v composer &>/dev/null; then
    echo "  → Installation de Composer..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer 2>/dev/null
  fi
  echo -e "${GREEN}  ✅ PHP $(php -v | head -1) / Composer prêts${NC}"
}

install_docker() {
  if ! command -v docker &>/dev/null; then
    echo "  → Installation de Docker..."
    curl -fsSL https://get.docker.com | sh 2>/dev/null
  fi
  echo -e "${GREEN}  ✅ Docker $(docker -v) prêt${NC}"
}

install_go() {
  if ! command -v go &>/dev/null; then
    echo "  → Installation de Go..."
    apt-get install -y -qq golang-go
  fi
  echo -e "${GREEN}  ✅ Go $(go version) prêt${NC}"
}

case $TECH in
  "nextjs"|"nuxt"|"vite"|"node") install_node ;;
  "django"|"python") install_python ;;
  "php") install_php ;;
  "docker") install_docker ;;
  "go") install_go ;;
  "static") echo -e "${GREEN}  ✅ Rien à installer pour un site statique${NC}" ;;
esac

# ─── Trouver un port libre ────────────────────────────
find_free_port() {
  PORT=3000
  while ss -tlnp | grep -q ":$PORT "; do
    PORT=$((PORT + 1))
  done
  echo $PORT
}

PORT=$(find_free_port)

# ─── Déploiement selon la techno ──────────────────────
echo ""
echo -e "${BLUE}⚙️  Déploiement en cours...${NC}"

case $TECH in

  "docker")
    docker build -t $SITE_NAME .
    docker stop $SITE_NAME 2>/dev/null
    docker rm $SITE_NAME 2>/dev/null
    docker run -d --name $SITE_NAME -p $PORT:80 --restart unless-stopped $SITE_NAME
    ;;

  "nextjs"|"nuxt")
    npm install
    npm run build
    pm2 delete $SITE_NAME 2>/dev/null
    pm2 start "npm run start -- --port $PORT" --name $SITE_NAME
    pm2 save
    pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null
    ;;

  "vite")
    npm install
    npm run build
    SITE_DIR="$SITE_DIR/dist"
    TECH="static"
    ;;

  "node")
    npm install
    ENTRY="index.js"
    [ -f "server.js" ] && ENTRY="server.js"
    [ -f "app.js" ] && ENTRY="app.js"
    pm2 delete $SITE_NAME 2>/dev/null
    PORT=$PORT pm2 start $ENTRY --name $SITE_NAME
    pm2 save
    pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null
    ;;

  "django")
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt -q
    python manage.py migrate
    WSGI_MODULE=$(find . -name "wsgi.py" | head -1 | xargs dirname | xargs basename)
    gunicorn --bind 0.0.0.0:$PORT --daemon --workers 3 $WSGI_MODULE.wsgi
    ;;

  "python")
    python3 -m venv venv
    source venv/bin/activate
    [ -f "requirements.txt" ] && pip install -r requirements.txt -q
    gunicorn --bind 0.0.0.0:$PORT --daemon app:app
    ;;

  "php")
    composer install --no-dev -q
    chown -R www-data:www-data $SITE_DIR
    PHP_FPM_SOCK=$(find /var/run/php/ -name "*.sock" 2>/dev/null | head -1)
    [ -z "$PHP_FPM_SOCK" ] && PHP_FPM_SOCK="/var/run/php/php8.2-fpm.sock"
    ;;

  "go")
    go build -o app .
    nohup ./app &
    ;;

esac

# ─── Google AdSense + ads.txt ─────────────────────────
inject_adsense() {
  if [[ "$ADSENSE" != "o" || -z "$ADSENSE_ID" ]]; then
    return
  fi

  echo ""
  echo -e "${BLUE}💰 Configuration Google AdSense...${NC}"

  # Déterminer le dossier public selon la techno
  PUBLIC_DIR="$SITE_DIR"
  [ -d "$SITE_DIR/public" ]  && PUBLIC_DIR="$SITE_DIR/public"
  [ -d "$SITE_DIR/dist" ]    && PUBLIC_DIR="$SITE_DIR/dist"
  [ -d "$SITE_DIR/out" ]     && PUBLIC_DIR="$SITE_DIR/out"
  # Pour Next.js le dossier public/ est le bon même après build
  [[ "$TECH" == "nextjs" || "$TECH" == "nuxt" ]] && PUBLIC_DIR="$SITE_DIR/public"

  mkdir -p "$PUBLIC_DIR"

  # ── 1. Créer ads.txt ──────────────────────────────
  echo "google.com, $ADSENSE_ID, DIRECT, f08c47fec0942fa0" > "$PUBLIC_DIR/ads.txt"
  echo -e "  ${GREEN}✓ ads.txt créé dans $PUBLIC_DIR/${NC}"
  echo -e "  ${DIM}  → google.com, $ADSENSE_ID, DIRECT, f08c47fec0942fa0${NC}"

  # ── 2. Injecter le script dans les HTML ───────────
  ADSENSE_TAG="<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}\" crossorigin=\"anonymous\"></script>"

  HTML_FILES=$(find "$SITE_DIR" -name "*.html" ! -path "*/node_modules/*" 2>/dev/null)
  COUNT=0

  for FILE in $HTML_FILES; do
    if grep -q "adsbygoogle" "$FILE"; then
      echo -e "  ${DIM}⏭  Déjà présent dans $(basename $FILE)${NC}"
      continue
    fi
    if grep -q "</head>" "$FILE"; then
      sed -i "s|</head>|  ${ADSENSE_TAG}\n</head>|" "$FILE"
      COUNT=$((COUNT + 1))
      echo -e "  ${GREEN}✓ Script injecté dans $(basename $FILE)${NC}"
    fi
  done

  # Pour Next.js/Nuxt : rappel d'ajout manuel
  if [[ "$TECH" == "nextjs" || "$TECH" == "nuxt" ]]; then
    echo ""
    echo -e "  ${YELLOW}⚠️  Next.js/Nuxt détecté : ajoute le script AdSense manuellement dans :${NC}"
    echo -e "  ${DIM}  • Next.js  → app/layout.tsx ou pages/_document.tsx${NC}"
    echo -e "  ${DIM}  • Nuxt     → nuxt.config.ts (head.script)${NC}"
    echo -e "  ${DIM}  Script : $ADSENSE_TAG${NC}"
  fi

  echo -e "  ${GREEN}✅ AdSense configuré${NC}"
}

inject_adsense

# ─── Config Nginx ─────────────────────────────────────
echo ""
echo -e "${BLUE}🔧 Configuration Nginx...${NC}"

if [[ "$TECH" == "static" ]]; then
  cat > /etc/nginx/sites-available/$SITE_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $SITE_DIR;
    index index.html index.htm;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

elif [[ "$TECH" == "php" ]]; then
  cat > /etc/nginx/sites-available/$SITE_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $SITE_DIR/public;
    index index.php index.html;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:$PHP_FPM_SOCK;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
    }
}
EOF
  systemctl restart php*-fpm 2>/dev/null || true

else
  cat > /etc/nginx/sites-available/$SITE_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
fi

ln -sf /etc/nginx/sites-available/$SITE_NAME /etc/nginx/sites-enabled/$SITE_NAME
rm -f /etc/nginx/sites-enabled/default

nginx -t
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur de configuration Nginx.${NC}"
  exit 1
fi

nginx -s reload || systemctl reload nginx
echo -e "${GREEN}✅ Nginx configuré${NC}"

# ─── SSL Certbot ──────────────────────────────────────
echo ""
echo -e "${BLUE}🔒 Génération du certificat SSL...${NC}"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  SSL non généré (DNS pas encore propagé ?). Site accessible en HTTP pour l'instant.${NC}"
  echo -e "${YELLOW}   Relance manuellement : certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
fi

# ─── Résumé final ─────────────────────────────────────
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════╗"
echo "║          ✅ DÉPLOIEMENT TERMINÉ !              ║"
echo "╠═══════════════════════════════════════════════╣"
printf "║  🌐 URL      : https://%-24s║\n" "$DOMAIN"
printf "║  📁 Dossier  : %-30s║\n" "$SITE_DIR"
printf "║  🔧 Tech     : %-30s║\n" "$TECH"
[[ "$TECH" != "static" && "$TECH" != "php" ]] && printf "║  🔌 Port app : %-30s║\n" "$PORT"
if [[ "$ADSENSE" == "o" && -n "$ADSENSE_ID" ]]; then
  printf "║  💰 AdSense  : %-30s║\n" "$ADSENSE_ID"
  printf "║  📄 ads.txt  : %-30s║\n" "✓ créé dans public/"
fi
echo "╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

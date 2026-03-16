#!/bin/bash

# 🚀 QUICK START - DomainHub Refonte 2026
# Lancez cette script pour démarrer immédiatement

echo "🎉 DomainHub - Refonte Complète"
echo "================================"
echo ""

# 1. Afficher les changements
echo "📋 Fichiers modifiés/créés:"
echo "  ✅ src/presentations/landing-page.tsx (refonte complète)"
echo "  ✅ src/app/layout.tsx (SEO metadata)"
echo "  ✅ src/app/globals.css (animations)"
echo "  ✅ src/app/blog/page.tsx (NOUVEAU)"
echo "  ✅ src/app/resources/page.tsx (NOUVEAU)"
echo "  ✅ Documentation x4"
echo ""

# 2. Vérifier Node.js
echo "🔍 Vérification Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "   Installer depuis: https://nodejs.org"
    exit 1
fi
echo "✅ Node.js $(node --version) détecté"
echo ""

# 3. Option de démarrage
echo "🚀 Options de démarrage:"
echo ""
echo "Option 1: Mode développement (avec hot reload)"
echo "  $ npm run dev"
echo "  → http://localhost:9002"
echo ""
echo "Option 2: Mode production"
echo "  $ npm run build"
echo "  $ npm run start"
echo "  → http://localhost:3000"
echo ""
echo "Option 3: Déployer sur Vercel"
echo "  $ git add ."
echo "  $ git commit -m 'refonte: modernisation complète'"
echo "  $ git push origin main"
echo ""

# 4. Demander de démarrer
read -p "📌 Quelle option? (1/2/3/none): " choice

case $choice in
  1)
    echo ""
    echo "🎯 Démarrage mode développement..."
    echo "(Ctrl+C pour arrêter)"
    echo ""
    npm run dev
    ;;
  2)
    echo ""
    echo "🎯 Building production..."
    npm run build
    if [ $? -eq 0 ]; then
      echo ""
      echo "✅ Build réussi!"
      echo "🚀 Démarrage production..."
      echo "(Ctrl+C pour arrêter)"
      npm run start
    else
      echo "❌ Build échoué"
      exit 1
    fi
    ;;
  3)
    echo ""
    echo "📤 Déploiement sur Vercel..."
    echo "(Assurez-vous que git est configuré)"
    git add .
    git commit -m "refonte: modernisation complète landing page"
    echo ""
    echo "Prêt à push? (y/n)"
    read -p "Confirmer: " confirm
    if [ "$confirm" = "y" ]; then
      git push origin main
      echo "✅ Pushé! Vercel va redéployer..."
    else
      echo "❌ Annulé"
    fi
    ;;
  *)
    echo ""
    echo "👋 Pour démarrer manuellement:"
    echo "  $ npm run dev"
    echo ""
    echo "📚 Docs utiles:"
    echo "  - GUIDE_LANCEMENT_REFONTE.md"
    echo "  - LANDING_PAGE_IMPROVEMENTS.md"
    echo "  - REFONTE_STRATEGIE_COMPLETE.md"
    ;;
esac

echo ""
echo "✨ Bonne chance! 🚀"

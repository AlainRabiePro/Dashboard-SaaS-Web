#!/bin/bash

cd /Users/alainrabie/Dashboard-SaaS-Web/docs/reference

# getting-started
mv QUICK_START.md ../getting-started/
mv GUIDE_LANCEMENT_REFONTE.md ../getting-started/ 2>/dev/null || true

# guides  
mv LANDING_PAGE_GUIDE.md ../guides/
mv LANDING_PAGE_IMPROVEMENTS.md ../guides/
mv DOMAIN_RESELLING_SETUP.md ../guides/
mv IONOS_SETUP.md ../guides/
mv MARKETING_STRATEGY.md ../guides/

# deployment
mv VERCEL_DEPLOYMENT_GUIDE.md ../deployment/
mv DEPLOYMENT_GUIDE.md ../deployment/
mv PRODUCTION_CHECKLIST.md ../deployment/
mv PRODUCTION_LAUNCH_SUMMARY.md ../deployment/
mv PRODUCTION_READY_CHECKLIST.md ../deployment/

# features
mv FEATURES.md ../features/
mv FONCTIONNALITES.md ../features/
mv MARKETING_PAGES_COMPLETE.md ../features/

# logging (déjà là)
# Rien à faire

# strategy
mv REFONTE_STRATEGIE_COMPLETE.md ../strategy/
mv REFONTE_TERMINEE_RESUME.txt ../strategy/
mv RESUME_EXECUTIF.md ../strategy/
mv AVANT_APRES_VISUEL.md ../strategy/
mv TODO_IMPLEMENTATION.md ../strategy/
mv DONE.md ../strategy/

echo "✅ Réorganisation complète"

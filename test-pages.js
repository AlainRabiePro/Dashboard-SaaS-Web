const http = require('http');

const pages = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/sites', name: 'Projets' },
  { path: '/domains', name: 'Domaines' },
  { path: '/tools', name: 'Outils' },
  { path: '/storage', name: 'Infrastructure' },
  { path: '/billing', name: 'Facturation' },
  { path: '/settings', name: 'Paramètres' },
  // Pages Développement
  { path: '/console', name: 'Console de debug' },
  { path: '/api', name: 'API & Webhooks' },
  { path: '/database', name: 'Firestore Explorer' },
  { path: '/deployments', name: 'Déploiements' },
  { path: '/tests', name: 'Tests' },
  { path: '/monitoring', name: 'Monitoring' },
  // Pages Équipe
  { path: '/collaborators', name: 'Collaborateurs' },
  { path: '/api-keys', name: 'Clés API' },
  { path: '/audit', name: 'Audit Log' },
  { path: '/notifications', name: 'Notifications' },
  // Pages Ressources
  { path: '/docs', name: 'Documentation' },
  { path: '/changelog', name: 'Changelog' },
  { path: '/support', name: 'Support' },
];

let passed = 0;
let failed = 0;
let errors = [];

async function testPage(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 302) {
        passed++;
        console.log(`✅ ${path} → ${res.statusCode}`);
        resolve(true);
      } else {
        failed++;
        console.log(`❌ ${path} → ${res.statusCode}`);
        errors.push(`${path}: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      failed++;
      console.log(`❌ ${path} → ERROR: ${err.message}`);
      errors.push(`${path}: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000);
  });
}

async function runTests() {
  console.log('🧪 Démarrage des tests de toutes les pages...\n');
  
  for (const page of pages) {
    await testPage(page.path);
  }

  console.log(`\n📊 RÉSULTATS:`);
  console.log(`✅ Passées: ${passed}/${pages.length}`);
  console.log(`❌ Échouées: ${failed}/${pages.length}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Erreurs détectées:`);
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log(`\n🎉 TOUS LES TESTS RÉUSSIS!`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

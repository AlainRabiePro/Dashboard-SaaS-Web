'use client';

import {
  Search,
  Zap,
  Lock,
  BarChart3,
  Users,
  Shield,
  Code2,
  Mail,
  Network,
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  AlertCircle,
  TrendingUp,
  Globe,
  Cpu,
  RefreshCw,
  Settings,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  const features = [
    {
      id: 1,
      icon: Search,
      title: 'Recherche Instantanée',
      description: 'Vérifiez la disponibilité de millions de domaines en temps réel avec nos serveurs ultra-rapides.',
      category: 'Core',
      benefits: ['Recherche <1 seconde', 'Millions de TLDs', 'Suggestions intelligentes']
    },
    {
      id: 2,
      icon: Zap,
      title: 'Enregistrement Ultra-Rapide',
      description: 'Enregistrez votre domaine en quelques clics. Activation en 5 minutes maximum.',
      category: 'Core',
      benefits: ['Processus simplifié', 'Validation instantanée', 'Activation rapide']
    },
    {
      id: 3,
      icon: Lock,
      title: 'Paiement Sécurisé',
      description: 'Transactions protégées par Stripe avec encryption SSL/TLS. Vos données sont 100% sûres.',
      category: 'Security',
      benefits: ['Stripe intégré', 'Encryption SSL', 'PCI DSS compliant']
    },
    {
      id: 4,
      icon: Globe,
      title: 'Gestion Complète des Domaines',
      description: 'Dashboard intuitif pour gérer tous vos domaines depuis un seul endroit.',
      category: 'Management',
      benefits: ['Vue d\'ensemble totale', 'Renouvellement automatique', 'Alertes d\'expiration']
    },
    {
      id: 5,
      icon: Users,
      title: 'Collaboration en Équipe',
      description: 'Invitez des collaborateurs et attribuez des rôles spécifiques avec permissions granulaires.',
      category: 'Team',
      benefits: ['Rôles personnalisés', 'Permissions avancées', 'Audit trail complet']
    },
    {
      id: 6,
      icon: Shield,
      title: 'Système d\'Audit Complet',
      description: 'Tracez chaque action dans votre compte avec logs détaillés et historique complet.',
      category: 'Security',
      benefits: ['Logs détaillés', 'Historique utilisateur', 'Traçabilité 100%']
    },
    {
      id: 7,
      icon: BarChart3,
      title: 'Analytics Avancées',
      description: 'Visualisez vos metrics en temps réel : searches, conversions, revenue, active users.',
      category: 'Analytics',
      benefits: ['Dashboard temps réel', 'Rapports personnalisés', 'Export données']
    },
    {
      id: 8,
      icon: Cpu,
      title: 'Monitoring Système',
      description: 'Suivi en temps réel de la santé de vos domaines et services. Alertes proactives.',
      category: 'Monitoring',
      benefits: ['Uptime 99.9%', 'Alertes SMS/Email', 'Diagnostics rapides']
    },
    {
      id: 9,
      icon: Code2,
      title: 'API Complète',
      description: 'API REST robuste pour automatiser la gestion de vos domaines en intégration avec vos systèmes.',
      category: 'Integration',
      benefits: ['Documentation complète', 'SDKs disponibles', 'Webhooks support']
    },
    {
      id: 10,
      icon: Mail,
      title: 'Email Forwarding',
      description: 'Redirigez les emails reçus sur votre domaine vers n\'importe quelle adresse email.',
      category: 'Email',
      benefits: ['Illimité', 'Règles custom', 'Alias multiples']
    },
    {
      id: 11,
      icon: Network,
      title: 'Gestion DNS Avancée',
      description: 'Éditeur DNS complet avec support de tous les types de records (A, CNAME, MX, TXT...).',
      category: 'Management',
      benefits: ['Tous les types de records', 'Temps de propagation rapide', 'Interface visuelle']
    },
    {
      id: 12,
      icon: CloudUpload,
      title: 'SSL Certificate Gratuit',
      description: 'Certificats SSL Let\'s Encrypt inclus pour sécuriser votre site automatiquement.',
      category: 'Security',
      benefits: ['Gratuit inclus', 'Renouvellement automatique', 'Support wildcard']
    },
    {
      id: 13,
      icon: RefreshCw,
      title: 'Domain Transfer',
      description: 'Transférez vos domaines vers DomainHub en toute sécurité avec support de notre équipe.',
      category: 'Management',
      benefits: ['Transfert gratuit', 'Assistance personnalisée', 'Zéro temps d\'arrêt']
    },
    {
      id: 14,
      icon: AlertCircle,
      title: 'Notifications Intelligentes',
      description: 'Recevez des alertes pour les événements importants : renouvellement, expiration, menaces.',
      category: 'Monitoring',
      benefits: ['Multi-canal (Email, SMS)', 'Règles customisables', 'Timing configurable']
    },
    {
      id: 15,
      icon: Eye,
      title: 'Monitoring DNS Proactif',
      description: 'Surveillance continue de vos configurations DNS pour détecter les problèmes.',
      category: 'Monitoring',
      benefits: ['Vérification 24/7', 'Rapport de santé', 'Suggestions d\'optimisation']
    },
    {
      id: 16,
      icon: TrendingUp,
      title: 'Reports Détaillés',
      description: 'Générez des rapports personnalisés sur vos domaines, usage, et performances.',
      category: 'Analytics',
      benefits: ['Export PDF/Excel', 'Planification mensuelle', 'Insights métier']
    },
    {
      id: 17,
      icon: Settings,
      title: 'Configuration Flexible',
      description: 'Paramétrez chaque aspect de vos domaines et services selon vos besoins spécifiques.',
      category: 'Management',
      benefits: ['Options illimitées', 'Presets préconfigurés', 'Custom rules']
    },
    {
      id: 18,
      icon: ArrowRight,
      title: 'Support 24/7 Réactif',
      description: 'Notre équipe d\'experts est disponible jour et nuit pour vous aider en français.',
      category: 'Support',
      benefits: ['Temps réponse <2h', 'Chat en direct', 'Knowledge base complet']
    }
  ];

  const categories = [
    { name: 'Core', label: 'Fonctionnalités Principales', color: 'from-blue-600 to-cyan-600' },
    { name: 'Security', label: 'Sécurité', color: 'from-green-600 to-emerald-600' },
    { name: 'Management', label: 'Gestion', color: 'from-purple-600 to-pink-600' },
    { name: 'Team', label: 'Collaboration', color: 'from-orange-600 to-red-600' },
    { name: 'Analytics', label: 'Analytics & Reports', color: 'from-indigo-600 to-violet-600' },
    { name: 'Monitoring', label: 'Monitoring', color: 'from-cyan-600 to-blue-600' },
    { name: 'Integration', label: 'Intégration', color: 'from-rose-600 to-pink-600' },
    { name: 'Email', label: 'Email', color: 'from-amber-600 to-orange-600' },
    { name: 'Support', label: 'Support', color: 'from-lime-600 to-green-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center border-b border-slate-800">
        <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
          Tout ce que vous avez besoin
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
          DomainHub offre un ensemble complet de fonctionnalités pour gérer vos domaines comme un professionnel.
          De la recherche à l'hébergement, nous avons tout ce qu'il vous faut.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-lg font-semibold transition"
        >
          Essayer Gratuitement
        </Link>
      </div>

      {/* Categories Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Catégories de Fonctionnalités</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${cat.color} rounded-lg p-4 text-white text-center font-semibold hover:scale-105 transition`}
            >
              {cat.label}
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <h2 className="text-3xl font-bold text-white text-center mb-16">Nos Fonctionnalités</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            const categoryColor = categories.find(c => c.name === feature.category)?.color || 'from-blue-600 to-cyan-600';
            
            return (
              <div
                key={feature.id}
                className="group bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition"
              >
                {/* Icon */}
                <div className={`bg-gradient-to-br ${categoryColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
                  {feature.title}
                </h3>
                
                <p className="text-slate-400 mb-4 text-sm">
                  {feature.description}
                </p>

                {/* Benefits */}
                <div className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Category Tag */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                    {feature.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison with competitors */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Pourquoi nous choisir?</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-4 text-white font-bold">Fonctionnalité</th>
                <th className="text-center px-6 py-4 text-white font-bold">DomainHub</th>
                <th className="text-center px-6 py-4 text-slate-400 font-bold">Concurrents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {[
                ['Recherche temps réel', true, true],
                ['Paiement sécurisé (Stripe)', true, true],
                ['Dashboard intuitif', true, true],
                ['Collaborateurs avec rôles', true, false],
                ['Audit logs complets', true, false],
                ['Monitoring 24/7', true, false],
                ['API REST complète', true, true],
                ['Email forwarding', true, true],
                ['DNS management avancé', true, true],
                ['SSL gratuit', true, true],
                ['Support 24/7 français', true, false],
                ['Analytics détaillées', true, true],
                ['Domain transfer gratuit', true, false],
                ['Notifications intelligentes', true, false],
                ['Reports personnalisés', true, false],
              ].map((row, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-white font-semibold">{row[0]}</td>
                  <td className="px-6 py-4 text-center">
                    {row[1] ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                    ) : (
                      <span className="text-slate-500">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row[2] ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                    ) : (
                      <span className="text-slate-500">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-center text-slate-300">
            <span className="font-semibold text-blue-400">+10 fonctionnalités exclusives</span> qui ne sont pas disponibles chez nos concurrents.
            Nous innovons constamment pour offrir la meilleure expérience.
          </p>
        </div>
      </div>

      {/* Integration Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Intégrations Supportées</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Stripe', desc: 'Paiements sécurisés' },
            { name: 'Firebase', desc: 'Authentification' },
            { name: 'IONOS', desc: 'Registraire domaines' },
            { name: 'Vercel', desc: 'Hébergement apps' },
            { name: 'Netlify', desc: 'Hosting statique' },
            { name: 'Slack', desc: 'Notifications' },
            { name: 'Google Analytics', desc: 'Analytics web' },
            { name: 'Webhooks', desc: 'Automatisation custom' },
          ].map((integration, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <h3 className="font-bold text-white mb-2">{integration.name}</h3>
              <p className="text-sm text-slate-400">{integration.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à transformer votre gestion de domaines?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Rejoignez des milliers d'entrepreneurs qui font confiance à DomainHub pour gérer leurs domaines.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-4 rounded-lg font-semibold transition transform hover:scale-105"
            >
              S'inscrire Gratuitement
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold transition"
            >
              Voir nos Tarifs
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Questions Fréquentes</h2>
        
        <div className="space-y-4">
          {[
            {
              q: 'Toutes les fonctionnalités sont-elles incluses dans ma souscription?',
              a: 'Oui! Toutes les fonctionnalités présentées ici sont incluses dans votre plan. Il n\'y a pas de fonctionnalités "premium" cachées.'
            },
            {
              q: 'Puis-je utiliser l\'API?',
              a: 'L\'API est disponible dans tous les plans Professional et Enterprise. Les plans Starter ont accès à l\'API avec des limites de quota.'
            },
            {
              q: 'Comment puis-je intégrer mes outils existants?',
              a: 'Nous supportons les webhooks et une API REST complète. Consultez notre documentation pour les détails d\'intégration.'
            },
            {
              q: 'Le support 24/7 est-il vraiment disponible?',
              a: 'Oui! Notre équipe support répond en moins de 2 heures, même le week-end et jours fériés.'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="font-bold text-white mb-3">{item.q}</h3>
              <p className="text-slate-300">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-2"
          >
            Voir toutes les questions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

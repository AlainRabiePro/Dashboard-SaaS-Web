'use client';

import { CheckCircle2, Globe, Zap, BarChart3, Code2 } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const domains = [
    { tld: '.com', price: 9.99, popular: true, description: 'Le classique', renewal: 9.99 },
    { tld: '.fr', price: 7.99, popular: false, description: 'France', renewal: 7.99 },
    { tld: '.app', price: 11.99, popular: true, description: 'Tech & Apps', renewal: 11.99 },
    { tld: '.io', price: 29.99, popular: false, description: 'Tech startup', renewal: 29.99 },
    { tld: '.dev', price: 13.99, popular: false, description: 'Pour développeurs', renewal: 13.99 },
    { tld: '.co', price: 24.99, popular: false, description: 'Alternative court', renewal: 24.99 },
    { tld: '.net', price: 8.99, popular: false, description: 'Infrastructure', renewal: 8.99 },
    { tld: '.org', price: 8.99, popular: false, description: 'Organisations', renewal: 8.99 },
    { tld: '.tech', price: 16.99, popular: false, description: 'Technologie', renewal: 16.99 },
    { tld: '.digital', price: 15.99, popular: false, description: 'Digital business', renewal: 15.99 },
    { tld: '.ai', price: 39.99, popular: false, description: 'Intelligence artificielle', renewal: 39.99 },
    { tld: '.cloud', price: 13.99, popular: false, description: 'Cloud computing', renewal: 13.99},
  ];

  const plans = [
    {
      name: 'Starter',
      price: '0€',
      period: 'Gratuit',
      description: 'Parfait pour commencer',
      features: [
        'Recherche illimitée de domaines',
        'Achat et enregistrement',
        'Tableau de bord complet',
        'Gestion DNS basique',
        'Support email',
        '99.9% uptime garanti'
      ],
      cta: 'Démarrer Gratuitement',
      highlighted: false
    },
    {
      name: 'Professional',
      price: '5€',
      period: '/mois (optionnel)',
      description: 'Pour les entreprises',
      features: [
        'Tout inclus dans Starter',
        'Gestion avancée des DNS',
        'Support prioritaire (chat)',
        'Intégrations (Vercel, Netlify...)',
        'Email forwarding illimité',
        'Sous-domaines illimités',
        'Certificat SSL gratuit',
        'Analytics détaillées'
      ],
      cta: 'Passer au Pro',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Sur devis',
      period: 'Personnalisé',
      description: 'Pour les besoins spécifiques',
      features: [
        'Tout inclus dans Professional',
        'API complète avec support',
        'Compte manager dédié',
        'Transfert illimité de domaines',
        'Whitelabel possible',
        'Intégrations personnalisées',
        'SLA 99.99% uptime',
        'Support 24/7 prioritaire'
      ],
      cta: 'Contacter Sales',
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
          Tarification Transparente & Simple
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Achetez vos domaines au meilleur prix, sans frais cachés. Les prix affichés sont les prix finaux.
        </p>
      </div>

      {/* Plans Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <h2 className="text-4xl font-bold text-white text-center mb-16">Plans d'Accès</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-2xl overflow-hidden transition transform hover:scale-105 ${
                plan.highlighted
                  ? 'ring-2 ring-blue-500 bg-gradient-to-b from-blue-600 to-blue-700 shadow-2xl shadow-blue-500/20'
                  : 'bg-slate-800/50 border border-slate-700'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-bold">
                  ⭐ PLUS POPULAIRE
                </div>
              )}
              <div className="p-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-slate-400'}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-blue-400'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ml-2 ${plan.highlighted ? 'text-blue-100' : 'text-slate-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition mb-8 ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-slate-100'
                      : 'border border-slate-600 text-white hover:border-blue-500'
                  }`}
                >
                  {plan.cta}
                </button>
                <div className="space-y-4">
                  {plan.features.map((feature, f_idx) => (
                    <div key={f_idx} className="flex gap-3">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-white' : 'text-blue-400'}`} />
                      <span className={plan.highlighted ? 'text-white' : 'text-slate-300'}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Domain Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <h2 className="text-4xl font-bold text-white text-center mb-4">Prix des Domaines</h2>
        <p className="text-slate-400 text-center mb-12">
          Plus de 400 extensions disponibles. Voici nos tarifs les plus populaires.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {domains.map((domain, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-6 text-center border transition hover:border-blue-500 ${
                domain.popular
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 ring-2 ring-blue-400'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <h3 className={`text-2xl font-bold mb-2 ${domain.popular ? 'text-white' : 'text-white'}`}>
                {domain.tld}
              </h3>
              <p className={`text-sm mb-4 ${domain.popular ? 'text-blue-100' : 'text-slate-400'}`}>
                {domain.description}
              </p>
              <div className="mb-4">
                <p className={`text-3xl font-bold mb-1 ${domain.popular ? 'text-white' : 'text-blue-400'}`}>
                  €{domain.price}
                </p>
                <p className={`text-xs ${domain.popular ? 'text-blue-100' : 'text-slate-500'}`}>
                  Renouvellement: €{domain.renewal}
                </p>
              </div>
              <Link
                href={`/signup?domain=${domain.tld.substring(1)}`}
                className={`inline-block w-full py-2 rounded font-semibold transition ${
                  domain.popular
                    ? 'bg-white text-blue-600 hover:bg-slate-100'
                    : 'border border-blue-500 text-blue-400 hover:bg-blue-500/10'
                }`}
              >
                Acheter
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
          <p className="text-slate-300">
            Vous cherchez une extension différente? Nous supportons plus de 400 TLDs!
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 font-semibold"
          >
            Rechercher tous les domaines →
          </Link>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <h2 className="text-4xl font-bold text-white text-center mb-16">Comparaison Détaillée</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-6 py-4 text-white font-bold">Fonctionnalité</th>
                <th className="px-6 py-4 text-white font-bold text-center">Starter</th>
                <th className="px-6 py-4 text-white font-bold text-center">Professional</th>
                <th className="px-6 py-4 text-white font-bold text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {[
                { feature: 'Domaines illimités', starter: '✅', pro: '✅', enterprise: '✅' },
                { feature: 'Dashboard complet', starter: '✅', pro: '✅', enterprise: '✅' },
                { feature: 'Gestion DNS', starter: '⚠️ Basique', pro: '✅ Avancée', enterprise: '✅ Complète' },
                { feature: 'Email forwarding', starter: '❌', pro: '✅ Illimité', enterprise: '✅ Illimité' },
                { feature: 'Support', starter: 'Email', pro: 'Chat + Email', enterprise: 'Dédié 24/7' },
                { feature: 'API', starter: '❌', pro: '✅', enterprise: '✅ Support inclus' },
                { feature: 'Uptime SLA', starter: '99.9%', pro: '99.9%', enterprise: '99.99%' },
                { feature: 'Analytics', starter: '❌', pro: '✅', enterprise: '✅ Avancées' }
              ].map((row, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-white font-semibold">{row.feature}</td>
                  <td className="px-6 py-4 text-center text-slate-300">{row.starter}</td>
                  <td className="px-6 py-4 text-center text-slate-300">{row.pro}</td>
                  <td className="px-6 py-4 text-center text-slate-300">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Questions sur la Tarification?</h2>
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Y a-t-il des frais supplémentaires?
            </h3>
            <p className="text-slate-300">
              Non! Nos prix sont totalement transparents. Pas de frais cachés, pas de frais de maintenance. Vous ne payez que le prix affiché.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Puis-je upgrader mon plan?
            </h3>
            <p className="text-slate-300">
              Bien sûr! Vous pouvez upgrader votre plan à tout moment depuis les paramètres de votre compte. Les changements sont appliqués immédiatement.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Avez-vous des réductions pour les volumes?
            </h3>
            <p className="text-slate-300">
              Oui! Pour les achats en volume ou les partenariats long terme, nous offrons des tarifs spéciaux. Contactez notre équipe.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-400" />
              Comment fonctionne l'API?
            </h3>
            <p className="text-slate-300">
              L'API est incluse gratuitement dans les plans Professional et Enterprise. Elle vous permet d'automatiser la gestion de domaines.
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <Link
            href="/faq"
            className="inline-block text-blue-400 hover:text-blue-300 font-semibold"
          >
            Voir toutes les questions →
          </Link>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Prêt à acheter votre domaine?</h2>
        <p className="text-slate-400 mb-8">
          Commencez gratuitement, aucune carte de crédit requise
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-lg font-semibold transition"
          >
            Créer un Compte
          </Link>
          <Link
            href="/"
            className="border-2 border-slate-600 text-white hover:border-blue-500 px-8 py-4 rounded-lg font-semibold transition"
          >
            Retour à l'Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

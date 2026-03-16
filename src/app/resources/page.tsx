'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Globe, Lock, TrendingUp, Zap, Shield, Code2 } from 'lucide-react';

export default function ResourcesPage() {
  const articles = [
    {
      id: 1,
      title: 'Pourquoi enregistrer votre domaine en 2026?',
      description: 'Votre domaine est votre adresse sur internet. Découvrez pourquoi c\'est crucial pour votre présence en ligne.',
      category: 'Guide',
      readTime: '5 min',
      icon: Globe,
      slug: 'pourquoi-enregistrer-domaine'
    },
    {
      id: 2,
      title: 'Choisir la bonne extension pour votre domaine',
      description: '.com, .fr, .app? Apprenez les différences et comment choisir l\'extension idéale pour votre projet.',
      category: 'Tutoriel',
      readTime: '8 min',
      icon: TrendingUp,
      slug: 'choisir-extension-domaine'
    },
    {
      id: 3,
      title: 'Sécurité: Protéger votre domaine des menaces',
      description: 'Découvrez les meilleures pratiques pour sécuriser votre domaine et vos données sensibles.',
      category: 'Sécurité',
      readTime: '10 min',
      icon: Lock,
      slug: 'securiser-domaine'
    },
    {
      id: 4,
      title: 'Transférer votre domaine: Guide complet',
      description: 'Comment transférer votre domaine d\'un registraire à un autre sans downtime ni tracas.',
      category: 'Guide',
      readTime: '12 min',
      icon: ArrowRight,
      slug: 'transferer-domaine'
    },
    {
      id: 5,
      title: 'SEO: Optimiser votre domaine pour Google',
      description: 'Comment choisir un domaine qui aide votre SEO et améliore votre classement Google.',
      category: 'SEO',
      readTime: '15 min',
      icon: Zap,
      slug: 'domaine-seo-google'
    },
    {
      id: 6,
      title: 'Devenir revendeur de domaines: Stratégies gagnantes',
      description: 'Les secrets pour réussir en tant que revendeur et générer des revenus stables.',
      category: 'Business',
      readTime: '18 min',
      icon: TrendingUp,
      slug: 'revendeur-domaines-strategie'
    },
  ];

  const faqs = [
    {
      q: 'Qu\'est-ce qu\'un domaine?',
      a: 'Un domaine est votre adresse unique sur internet (ex: monsite.com). C\'est ce que les gens tapent pour vous trouver.'
    },
    {
      q: 'Quel est le meilleur domaine pour mon business?',
      a: 'Le meilleur domaine est court, mémorable, facile à épeler et en rapport avec votre activité. Évitez les chiffres et tirets si possible.'
    },
    {
      q: 'Combien de temps faut-il pour enregistrer un domaine?',
      a: 'Chez DomainHub, la plupart des domaines sont activés en 5 minutes. C\'est parmi les plus rapides du marché!'
    },
    {
      q: 'Puis-je utiliser mon domaine avec plusieurs sites?',
      a: 'Oui! Vous pouvez créer plusieurs sous-domaines (blog.monsite.com) ou rediriger vers d\'autres sites.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            DomainHub
          </Link>
          <Link href="/" className="text-slate-300 hover:text-blue-400 transition text-sm font-medium">
            ← Retour
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <h1 className="text-5xl lg:text-6xl font-bold text-white">
              Ressources & Guides
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Apprenez tout ce qu\'il faut savoir sur les domaines et comment optimiser votre présence en ligne
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {articles.map((article) => {
            const Icon = article.icon;
            return (
              <article
                key={article.id}
                className="group bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition hover:bg-slate-800/60"
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon className="w-8 h-8 text-blue-400 group-hover:scale-110 transition" />
                  <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition">
                  {article.title}
                </h3>
                
                <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                  {article.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{article.readTime}</span>
                  <Link
                    href={`#`}
                    className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1 text-sm font-medium"
                  >
                    Lire <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Questions Fréquentes
        </h2>

        <div className="space-y-6">
          {faqs.map((item, idx) => (
            <div key={idx} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition">
              <h3 className="font-bold text-white mb-3">{item.q}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Recevez les meilleures ressources
          </h2>
          <p className="text-slate-300 mb-8">
            Guides exclusifs et conseils d\'experts directement dans votre boîte de réception
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="votre@email.com"
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-6 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
            />
            <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold transition shadow-lg shadow-blue-500/30 whitespace-nowrap">
              S\'abonner
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-slate-900 border border-blue-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à enregistrer votre domaine?
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Rejoignez 10,000+ clients et démarrez en 30 secondes
          </p>
          <Link
            href="/signup"
            className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-4 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            Commencer Gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/60 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>© 2026 DomainHub. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

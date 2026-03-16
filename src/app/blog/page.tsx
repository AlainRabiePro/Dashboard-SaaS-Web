'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, User, TrendingUp } from 'lucide-react';

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: '10 Erreurs à Éviter Quand Vous Enregistrez un Domaine',
      excerpt: 'Découvrez les pièges les plus courants et comment les éviter pour une expérience sans tracas.',
      author: 'Marie Dupont',
      date: '2026-03-05',
      category: 'Guide',
      image: '🚨',
      slug: 'erreurs-enregistrement-domaine'
    },
    {
      id: 2,
      title: 'Comment Votre Domaine Affecte Votre SEO',
      excerpt: 'Les mots-clés dans votre domaine sont importants. Voici comment optimiser votre domaine pour Google.',
      author: 'Thomas Moreau',
      date: '2026-03-04',
      category: 'SEO',
      image: '📈',
      slug: 'domaine-seo-impact'
    },
    {
      id: 3,
      title: 'Les Meilleures Extensions de Domaine en 2026',
      excerpt: 'Au-delà du .com classique: explorez les extensions modernes qui peuvent vous différencier.',
      author: 'Sophie Laurent',
      date: '2026-03-03',
      category: 'Tendances',
      image: '🌐',
      slug: 'meilleures-extensions-2026'
    },
    {
      id: 4,
      title: 'Histoires de Succès: Revendeurs qui Gagnent €5000+/mois',
      excerpt: 'Comment des entrepreneurs ordinaires sont devenus des revendeurs prospères de domaines.',
      author: 'Jean Collet',
      date: '2026-02-28',
      category: 'Business',
      image: '💼',
      slug: 'succes-revendeurs-domaines'
    },
    {
      id: 5,
      title: 'Sécurité des Domaines: Protégez Votre Investissement',
      excerpt: 'Vol de domaine, hacking, vol de données: comment protéger ce qui est important pour vous.',
      author: 'Luc Bernard',
      date: '2026-02-26',
      category: 'Sécurité',
      image: '🔒',
      slug: 'securite-domaine-protection'
    },
    {
      id: 6,
      title: 'Lancer un Startup: Rôle Crucial du Domaine',
      excerpt: 'Votre domaine est votre première impression. Découvrez comment choisir celui qui lancera votre startup.',
      author: 'Isabelle Fabre',
      date: '2026-02-24',
      category: 'Startup',
      image: '🚀',
      slug: 'startup-domaine-crucial'
    },
  ];

  const categories = ['Tous', 'Guide', 'SEO', 'Tendances', 'Business', 'Sécurité', 'Startup'];

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
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
            Bloguez et Apprenez
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Conseils, tutoriels et histoires d\'entrepreneurs autour des domaines et du business en ligne
          </p>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-6 py-2 rounded-full font-medium transition ${
                category === 'Tous'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : 'bg-slate-800/40 border border-slate-700/50 text-slate-300 hover:border-blue-500/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => {
            const date = new Date(article.date);
            const formattedDate = date.toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });

            return (
              <article
                key={article.id}
                className="group bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl overflow-hidden hover:border-blue-500/50 transition hover:bg-slate-800/60"
              >
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center text-6xl group-hover:scale-110 transition duration-300">
                  {article.image}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                      {article.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                    {article.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-6 pb-6 border-t border-slate-700/30">
                    <div className="flex items-center gap-4 mt-6">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{article.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`#`}
                    className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1 text-sm font-medium"
                  >
                    Lire plus <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ne Manquez Aucun Article
          </h2>
          <p className="text-slate-300 mb-8">
            Inscrivez-vous pour recevoir les nouveaux articles et conseils d\'experts
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
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Inspiré? Lancez Votre Aventure
            </h2>
            <p className="text-slate-300 mb-8 text-lg leading-relaxed">
              Rejoignez les entrepreneurs qui gagnent avec leurs domaines. Enregistrez votre premier domaine en 30 secondes.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-4 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              Commencer Gratuitement
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-3xl opacity-20"></div>
            <div className="relative bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8">
              <TrendingUp className="w-16 h-16 text-blue-400 mb-4" />
              <p className="text-white text-lg font-bold mb-2">+150K Domaines Gérés</p>
              <p className="text-slate-400">par nos 10,000+ clients heureux</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/60 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-400">© 2026 DomainHub. Tous droits réservés.</p>
            <div className="flex gap-6">
              <Link href="/resources" className="text-slate-400 hover:text-blue-400 transition text-sm">
                Ressources
              </Link>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition text-sm">
                Contact
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition text-sm">
                Légal
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const articles = [
    {
      id: 'domain-reselling-guide',
      title: 'Guide Complet du Business de Revente de Domaines',
      excerpt: 'Découvrez comment démarrer votre business de revente de domaines et générer des revenus passifs.',
      date: '15 Mars 2024',
      author: 'DomainHub Team',
      category: 'Guide',
      readTime: '8 min',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&h=300&fit=crop'
    },
    {
      id: 'domain-pricing-strategy',
      title: 'Stratégie de Pricing: Comment Fixer le Meilleur Prix pour vos Domaines',
      excerpt: 'Apprenez à analyser le marché et fixer des prix compétitifs pour maximiser vos profits.',
      date: '10 Mars 2024',
      author: 'Jean Martin',
      category: 'Stratégie',
      readTime: '6 min',
      image: 'https://images.unsplash.com/photo-1460925895917-aeb19be489c7?w=500&h=300&fit=crop'
    },
    {
      id: 'tlds-comparison',
      title: 'Comparaison des Extensions: .COM vs .APP vs .IO vs .FR',
      excerpt: 'Découvrez les différences entre les TLDs populaires et celui qui convient le mieux à votre projet.',
      date: '5 Mars 2024',
      author: 'Sophie Dupont',
      category: 'Technical',
      readTime: '7 min',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop'
    },
    {
      id: 'seo-domain-selection',
      title: 'Impact du Domaine sur le SEO: Ce que vous Devez Savoir',
      excerpt: 'Un bon domaine est crucial pour le SEO. Découvrez les meilleures pratiques pour choisir un domaine SEO-friendly.',
      date: '28 Février 2024',
      author: 'Marc Leblanc',
      category: 'SEO',
      readTime: '10 min',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
    },
    {
      id: 'brand-building-domain',
      title: 'Construire Votre Marque Avec le Bon Domaine',
      excerpt: 'Votre domaine est votre première impression. Apprenez à choisir un domaine qui représente votre brand.',
      date: '20 Février 2024',
      author: 'DomainHub Team',
      category: 'Brand',
      readTime: '5 min',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
    },
    {
      id: 'domain-transfer-guide',
      title: 'Guide Complet du Transfert de Domaine',
      excerpt: 'Comment transférer votre domaine en toute sécurité et sans temps d\'arrêt.',
      date: '15 Février 2024',
      author: 'Thomas Moreau',
      category: 'Guide',
      readTime: '6 min',
      image: 'https://images.unsplash.com/photo-1460925895917-aeb19be489c7?w=500&h=300&fit=crop'
    }
  ];

  const categories = [
    { name: 'Tous', count: articles.length },
    { name: 'Guide', count: articles.filter(a => a.category === 'Guide').length },
    { name: 'Stratégie', count: articles.filter(a => a.category === 'Stratégie').length },
    { name: 'SEO', count: articles.filter(a => a.category === 'SEO').length },
    { name: 'Technical', count: articles.filter(a => a.category === 'Technical').length }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center border-b border-slate-800">
        <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
          Notre Blog
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Les meilleures ressources pour comprendre le business des domaines et optimiser votre revente.
        </p>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-slate-800">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              className={`px-4 py-2 rounded-full transition ${
                idx === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.name} <span className="text-sm ml-2 opacity-75">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <article
              key={idx}
              className="group bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-slate-700">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Category */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-sm text-slate-500">{article.readTime}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-slate-400 mb-4 line-clamp-2">
                  {article.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4 pb-4 border-t border-slate-700">
                  <div className="flex items-center gap-1 pt-4">
                    <Calendar className="w-4 h-4" />
                    {article.date}
                  </div>
                  <div className="flex items-center gap-1 pt-4">
                    <User className="w-4 h-4" />
                    {article.author}
                  </div>
                </div>

                {/* Read More */}
                <Link
                  href={`/blog/${article.id}`}
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold group/link"
                >
                  Lire l'article
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Restez Informé
          </h2>
          <p className="text-blue-100 mb-6">
            Abonnez-vous à notre newsletter pour recevoir les meilleurs conseils sur la revente de domaines directement dans votre inbox.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none"
            />
            <button className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition">
              S'abonner
            </button>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="flex justify-center gap-2">
          <button className="px-4 py-2 border border-slate-700 text-slate-300 rounded hover:border-blue-500 transition">
            ← Précédent
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            1
          </button>
          <button className="px-4 py-2 border border-slate-700 text-slate-300 rounded hover:border-blue-500 transition">
            2
          </button>
          <button className="px-4 py-2 border border-slate-700 text-slate-300 rounded hover:border-blue-500 transition">
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}

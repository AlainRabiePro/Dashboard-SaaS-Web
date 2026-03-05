'use client';

import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Zap,
  Lock,
  TrendingUp,
  Search,
  BarChart3,
  Users,
  Shield,
  Code2,
  Mail,
  Network,
  CloudUpload,
  AlertCircle,
  RefreshCw,
  Settings,
  Eye,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Globe className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              DomainHub
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">
              Tarifs
            </Link>
            <Link href="/blog" className="text-slate-300 hover:text-white transition">
              Blog
            </Link>
            <Link href="/faq" className="text-slate-300 hover:text-white transition">
              FAQ
            </Link>
            <Link href="/login" className="text-slate-300 hover:text-white transition">
              Se Connecter
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Enregistrez des domaines en
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                quelques clics
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Trouvez, achetez et enregistrez les meilleurs domaines instantanément. 
              Le paiement sécurisé, l'enregistrement automatique, et le support 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup?plan=starter"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition transform hover:scale-105"
              >
                Choisir le Plan Starter <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="border border-slate-600 text-white px-8 py-4 rounded-lg font-semibold hover:border-slate-400 transition">
                Voir la démo
              </button>
            </div>
            <p className="text-slate-400 mt-8">À partir de €4.99/mois</p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-3xl opacity-20"></div>
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="h-12 bg-slate-700 rounded-lg"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-slate-700 rounded-lg"></div>
                  <div className="h-24 bg-slate-700 rounded-lg"></div>
                </div>
                <div className="h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Pourquoi choisir DomainHub?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: 'Recherche Ultra-Rapide',
              description: 'Vérifiez la disponibilité de milliers de domaines en temps réel'
            },
            {
              icon: Lock,
              title: 'Paiement Sécurisé',
              description: 'Stripe SSL, données chiffrées, protection maximale de vos informations'
            },
            {
              icon: Globe,
              title: 'Enregistrement Automatique',
              description: 'Achetez et enregistrez instantanément avec nos partenaires de confiance'
            },
            {
              icon: CheckCircle2,
              title: 'Gestion Simplifiée',
              description: 'Gérez tous vos domaines depuis un seul tableau de bord intuitif'
            },
            {
              icon: TrendingUp,
              title: 'Prix Compétitifs',
              description: 'Les meilleurs tarifs du marché pour chaque extension (.com, .app, .io...)'
            },
            {
              icon: ArrowRight,
              title: 'Support 24/7',
              description: 'Notre équipe est disponible pour répondre à toutes vos questions'
            }
          ].map((feature, idx) => (
            <div key={idx} className="group">
              <div className="bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-xl p-8 transition transform hover:scale-105">
                <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Comment ça marche?
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Rechercher', desc: 'Tapez votre nom de domaine' },
            { step: '2', title: 'Choisir', desc: 'Sélectionnez l\'extension' },
            { step: '3', title: 'Payer', desc: 'Paiement sécurisé Stripe' },
            { step: '4', title: 'Enregistrer', desc: 'Domaine activé en 5 minutes' }
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800">
        <h2 className="text-4xl font-bold text-white text-center mb-4">
          Tous les outils que vous avez besoin
        </h2>
        <p className="text-center text-slate-300 max-w-2xl mx-auto mb-16">
          18 fonctionnalités complètes pour gérer vos domaines comme un professionnel
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Search, title: 'Recherche Instantanée', desc: 'Vérifiez la disponibilité en temps réel' },
            { icon: Zap, title: 'Enregistrement Ultra-Rapide', desc: 'Activation en 5 minutes' },
            { icon: Lock, title: 'Paiement Sécurisé', desc: 'Stripe SSL 100% confidentiel' },
            { icon: Globe, title: 'Gestion Complète', desc: 'Dashboard intuitif et puissant' },
            { icon: Users, title: 'Collaboration', desc: 'Invitez des collaborateurs' },
            { icon: Shield, title: 'Audit Complet', desc: 'Logs détaillés et historique' },
            { icon: BarChart3, title: 'Analytics', desc: 'Visualisez vos métriques' },
            { icon: Cpu, title: 'Monitoring 24/7', desc: 'Surveillance de vos domaines' },
            { icon: Code2, title: 'API REST', desc: 'Intégration complète' },
            { icon: Mail, title: 'Email Forwarding', desc: 'Illimité et configurable' },
            { icon: Network, title: 'DNS Management', desc: 'Tous les types de records' },
            { icon: CloudUpload, title: 'SSL Gratuit', desc: 'Certificats automatiques' },
            { icon: RefreshCw, title: 'Domain Transfer', desc: 'Transfert gratuit et sécurisé' },
            { icon: AlertCircle, title: 'Notifications', desc: 'Alertes intelligentes' },
            { icon: Eye, title: 'Monitoring DNS', desc: 'Vérification continue 24/7' },
            { icon: TrendingUp, title: 'Reports', desc: 'Rapports personnalisés' },
            { icon: Settings, title: 'Configuration', desc: 'Options illimitées' },
            { icon: ArrowRight, title: 'Support 24/7', desc: 'Équipe en français réactive' }
          ].map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div key={idx} className="group bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
                <IconComponent className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold"
          >
            Voir tous les détails des fonctionnalités
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800">
        <h2 className="text-4xl font-bold text-white text-center mb-4">
          Tarifs Transparents & Simples
        </h2>
        <p className="text-center text-slate-300 max-w-2xl mx-auto mb-16">
          Choisissez le plan qui correspond à vos besoins. Changez de plan à tout moment.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: 'STARTER',
              price: 4.99,
              recommended: false,
              current: false,
              features: [
                { name: '5GB Stockage', included: true },
                { name: '1 Site Web', included: true },
                { name: 'Déploiement Automatique', included: true },
                { name: 'Intégration AdSense', included: false },
                { name: 'Provisioning Avancé', included: false }
              ]
            },
            {
              name: 'PROFESSIONAL',
              price: 9.99,
              recommended: true,
              current: false,
              features: [
                { name: '15GB Stockage', included: true },
                { name: 'Sites Illimités', included: true },
                { name: 'Déploiement Automatique', included: true },
                { name: 'Intégration AdSense', included: true },
                { name: 'Provisioning Avancé', included: false }
              ]
            },
            {
              name: 'ENTERPRISE',
              price: 16.99,
              recommended: false,
              current: false,
              features: [
                { name: '100GB Stockage', included: true },
                { name: 'Sites Illimités', included: true },
                { name: 'Déploiement Automatique', included: true },
                { name: 'Intégration AdSense', included: true },
                { name: 'Provisioning Avancé', included: true }
              ]
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-8 border-2 transition transform hover:scale-105 ${
                plan.recommended
                  ? 'bg-slate-900/60 border-slate-700 shadow-xl'
                  : plan.current
                  ? 'bg-slate-900/60 border-white/30 shadow-xl'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              {/* Badge RECOMMANDÉ */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-slate-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest">
                  RECOMMANDÉ
                </div>
              )}
              
              {/* Plan Name */}
              <h3 className="text-sm font-bold text-slate-400 tracking-wider mb-4">
                {plan.name}
              </h3>
              
              {/* Price */}
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">
                  ${plan.price}
                </span>
                <span className="text-slate-400 ml-2">
                  / mois
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8 border-t border-slate-700 pt-6">
                {plan.features.map((feature, f_idx) => (
                  <li key={f_idx} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <span className={feature.included ? 'text-white text-sm' : 'text-slate-500 text-sm line-through'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={`/signup?plan=${plan.name.toLowerCase()}`}
                className={`block w-full py-3 px-6 rounded-lg font-bold text-center transition uppercase tracking-wider text-sm ${
                  plan.current
                    ? 'bg-slate-700 text-slate-300 cursor-default'
                    : plan.recommended
                    ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                    : 'bg-white text-black hover:bg-slate-100'
                }`}
              >
                {plan.current ? 'PLAN ACTUEL' : 'CHOISIR CE PLAN'}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
          <p className="text-slate-300">
            <span className="font-semibold text-blue-400">Tous les plans incluent</span> les 18 fonctionnalités complètes, 
            support 24/7 en français, et accès à l'API.
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Restez informé des meilleures offres
          </h2>
          <p className="text-slate-400">
            Recevez les dernières tendances en matière de domaines directement dans votre boîte de réception
          </p>
        </div>
        <div className="flex gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-6 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
            S'abonner
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-white">DomainHub</span>
              </div>
              <p className="text-slate-400 text-sm">
                La plateforme la plus simple pour enregistrer votre domaine
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Recherche</a></li>
                <li><a href="#" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition">Fonctionnalités</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Aide</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Conditions</a></li>
                <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2026 DomainHub. Tous droits réservés.
            </p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-white transition">GitHub</a>
              <a href="#" className="text-slate-400 hover:text-white transition">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

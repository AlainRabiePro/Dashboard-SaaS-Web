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
  Cpu,
  DollarSign,
  ChevronDown,
  Sparkles,
  Star,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <a href="#" className="flex items-center gap-2 hover:opacity-80 transition group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg group-hover:shadow-lg group-hover:shadow-blue-500/50 transition">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              DomainHub
            </span>
          </a>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-slate-300 hover:text-blue-400 transition text-sm font-medium">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-blue-400 transition text-sm font-medium">
              Tarifs
            </a>
            <Link href="/blog" className="text-slate-300 hover:text-blue-400 transition text-sm font-medium">
              Blog
            </Link>
            <Link href="/reseller" className="text-slate-300 hover:text-blue-400 transition text-sm font-medium">
              Revente
            </Link>
            <a href="#faq" className="text-slate-300 hover:text-blue-400 transition text-sm font-medium">
              FAQ
            </a>
            <Link href="/login" className="text-slate-300 hover:text-blue-400 transition text-sm font-medium">
              Connexion
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-2 rounded-lg transition text-sm font-semibold shadow-lg shadow-blue-500/30"
            >
              S'inscrire Gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">Nouvelle ère de la gestion de domaines</span>
            </div>

            <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Trouvez et enregistrez votre domaine
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                en 30 secondes
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-xl">
              La plateforme n°1 pour enregistrer vos domaines. Recherche instantanée, paiement sécurisé Stripe, 
              et activé en quelques minutes. Rejoignez 10,000+ clients satisfaits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/signup?plan=starter"
                className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition transform hover:scale-105 shadow-xl shadow-blue-500/30"
              >
                Commencer Gratuitement <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <button className="border border-slate-600 hover:border-blue-400 text-white px-8 py-4 rounded-lg font-semibold transition group">
                Voir la démo <ArrowUpRight className="w-4 h-4 inline ml-2 group-hover:translate-y-0.5 transition" />
              </button>
            </div>
            
            {/* Social Proof */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-slate-950"></div>
                  ))}
                </div>
                <p className="text-sm text-slate-300"><span className="font-semibold text-white">10,234</span> clients heureux</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <p className="text-sm text-slate-300 ml-2"><span className="font-semibold text-white">4.9/5</span> sur nos 2,400 avis</p>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative animate-fade-in-up" style={{transform: `translateY(${scrollY * 0.05}px)`}}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm overflow-hidden">
              {/* Dashboard Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded w-32"></div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-20 bg-slate-700 rounded-lg animate-pulse" style={{animationDelay: `${i * 0.1}s`}}></div>
                    ))}
                  </div>
                  <div className="h-4 bg-slate-700 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Metrics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: '10K+', label: 'Clients actifs', icon: Users },
            { number: '150K+', label: 'Domaines gérés', icon: Globe },
            { number: '99.9%', label: 'Uptime garanti', icon: Shield },
            { number: '4.9★', label: 'Note moyenne', icon: Star }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="text-center p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-blue-500/50 transition">
                <div className="flex justify-center mb-3">
                  <Icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stat.number}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Une solution complète
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour gérer vos domaines comme un pro
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'Recherche Ultra-Rapide',
              description: 'Vérifiez la disponibilité de milliers de domaines en temps réel',
              highlight: true
            },
            {
              icon: Lock,
              title: 'Paiement 100% Sécurisé',
              description: 'Stripe SSL, données chiffrées, protection maximale'
            },
            {
              icon: Globe,
              title: 'Enregistrement Instantané',
              description: 'Activé en 5 minutes avec nos partenaires de confiance'
            },
            {
              icon: BarChart3,
              title: 'Analytics Complet',
              description: 'Visualisez vos métriques en temps réel'
            },
            {
              icon: Users,
              title: 'Collaboration',
              description: 'Invitez et gérez vos collaborateurs facilement'
            },
            {
              icon: Code2,
              title: 'API REST Puissante',
              description: 'Intégration complète avec votre infrastructure'
            }
          ].map((feature, idx) => (
            <div 
              key={idx} 
              className={`group rounded-xl p-8 border transition transform hover:scale-105 ${
                feature.highlight 
                  ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/50 shadow-xl shadow-blue-500/10'
                  : 'bg-slate-800/30 border-slate-700/50 hover:border-blue-500/50'
              }`}
            >
              <feature.icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Trois étapes simples
          </h2>
          <p className="text-xl text-slate-300">
            De la recherche à l'activation, tout en quelques minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              step: '01',
              title: 'Rechercher', 
              desc: 'Tapez votre domaine, voir tous les prix et disponibilités',
              icon: Search
            },
            { 
              step: '02',
              title: 'Payer', 
              desc: 'Paiement sécurisé Stripe en quelques secondes',
              icon: DollarSign
            },
            { 
              step: '03',
              title: 'Enregistrer', 
              desc: 'Votre domaine est actif en 5 minutes maximum',
              icon: CheckCircle2
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-20 right-0 transform translate-x-1/2 w-12 text-slate-700">
                    <ArrowRight className="w-full" />
                  </div>
                )}
                <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white mb-6 group-hover:scale-110 transition">
                    {item.step}
                  </div>
                  <Icon className="w-10 h-10 text-blue-400 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Nos clients adorent DomainHub
          </h2>
          <p className="text-xl text-slate-300">
            Découvrez pourquoi 10,000+ utilisateurs nous font confiance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              text: "L'interface est tellement intuitive! J'ai enregistré mon premier domaine en 2 minutes. Vraiment impressionné par la qualité.",
              author: 'Marc Dupont',
              role: 'Entrepreneur',
              image: '👨‍💼'
            },
            {
              text: "Le support est excellent. J'ai posé une question et j'ai eu une réponse en moins de 10 minutes. Très professionnel!",
              author: 'Sophie Laurent',
              role: 'Freelance',
              image: '👩‍💼'
            },
            {
              text: "Les prix sont compétitifs et la sécurité est au top. Mon domaine est protégé et j'ai l'esprit tranquille.",
              author: 'Jean Chen',
              role: 'Agence Web',
              image: '👨‍💻'
            },
            {
              text: "J'ai transféré tous mes domaines vers DomainHub. La gestion centralisée m'a fait gagner tellement de temps!",
              author: 'Marie Leclerc',
              role: 'Directrice Marketing',
              image: '👩‍💼'
            },
            {
              text: "La plateforme est fiable et les fonctionnalités avancées me permettent de gérer mes 50+ domaines sans stress.",
              author: 'Thomas Brown',
              role: 'Développeur',
              image: '👨‍💻'
            },
            {
              text: "Facile d'utilisation, transparent sur les prix, pas de frais cachés. Je recommande vivement!",
              author: 'Lisa Schmidt',
              role: 'Consultant',
              image: '👩‍💼'
            }
          ].map((testimonial, idx) => (
            <div
              key={idx}
              className="group bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition hover:bg-slate-800/60"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-slate-300 mb-6 italic leading-relaxed">
                "{testimonial.text}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className="text-3xl">{testimonial.image}</div>
                <div>
                  <p className="font-bold text-white text-sm">{testimonial.author}</p>
                  <p className="text-slate-400 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <h2 className="text-5xl font-bold text-white text-center mb-4">
          18 Fonctionnalités complètes incluses
        </h2>
        <p className="text-center text-slate-300 max-w-2xl mx-auto mb-16">
          Tous nos plans incluent les fonctionnalités avancées pour gérer vos domaines comme un expert
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
            { icon: Sparkles, title: 'Support Premium', desc: 'Équipe en français réactive' }
          ].map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div key={idx} className="group bg-slate-800/20 border border-slate-700/50 rounded-lg p-6 hover:bg-slate-800/40 hover:border-blue-500/30 transition">
                <IconComponent className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Tarification Simple & Transparent
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Aucun frais caché. Payez uniquement pour vos domaines. Annulez quand vous voulez.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {[
            {
              name: 'STARTER',
              price: '4.99',
              recommended: false,
              description: 'Parfait pour débuter',
              features: [
                { name: '5 GB Stockage', included: true },
                { name: '1 Site Web', included: true },
                { name: 'Déploiement Auto', included: true },
                { name: 'AdSense Intégration', included: false },
                { name: 'Provisioning Avancé', included: false }
              ]
            },
            {
              name: 'PROFESSIONAL',
              price: '9.99',
              recommended: true,
              description: 'Plus populaire',
              features: [
                { name: '15 GB Stockage', included: true },
                { name: 'Sites Illimités', included: true },
                { name: 'Déploiement Auto', included: true },
                { name: 'AdSense Intégration', included: true },
                { name: 'Provisioning Avancé', included: false }
              ]
            },
            {
              name: 'ENTERPRISE',
              price: '16.99',
              recommended: false,
              description: 'Pour les pros',
              features: [
                { name: '100 GB Stockage', included: true },
                { name: 'Sites Illimités', included: true },
                { name: 'Déploiement Auto', included: true },
                { name: 'AdSense Intégration', included: true },
                { name: 'Provisioning Avancé', included: true }
              ]
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl overflow-hidden transition transform hover:scale-105 ${
                plan.recommended
                  ? 'bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-slate-900 border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/30'
                  : 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-blue-500/30'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 text-xs font-bold">
                  ⭐ RECOMMANDÉ
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-sm font-bold text-slate-400 tracking-widest mb-3">
                  {plan.name}
                </h3>
                <p className="text-slate-300 text-sm mb-6">{plan.description}</p>
                
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">
                    €{plan.price}
                  </span>
                  <span className="text-slate-400 ml-2">/ mois</span>
                </div>

                <ul className="space-y-4 mb-8 border-t border-slate-700/50 pt-8">
                  {plan.features.map((feature, f_idx) => (
                    <li key={f_idx} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 bg-slate-700 rounded-full"></div>
                        </div>
                      )}
                      <span className={feature.included ? 'text-white text-sm' : 'text-slate-500 text-sm line-through'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/signup?plan=${plan.name.toLowerCase()}`}
                  className={`block w-full py-3 px-6 rounded-lg font-bold text-center transition uppercase tracking-widest text-sm ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Choisir ce plan
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl text-center">
          <p className="text-slate-300">
            <span className="font-semibold text-blue-400">✓ Tous les plans incluent</span> les 18 fonctionnalités, 
            support 24/7 en français, API d'accès complet et 30 jours d'essai gratuit.
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ne manquez rien
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Recevez les actualités, les conseils et les offres exclusives directement dans votre boîte de réception
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-6 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
            />
            <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold transition shadow-lg shadow-blue-500/30 whitespace-nowrap">
              S'abonner
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            ✓ Pas de spam. Vous pouvez vous désabonner à tout moment.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Questions Fréquemment Posées
          </h2>
          <p className="text-xl text-slate-300">
            Vous avez des questions? Nous avons les réponses
          </p>
        </div>

        <div className="space-y-4">
          {[
            { 
              q: 'Quels types de domaines puis-je enregistrer?', 
              a: 'Vous avez accès à plus de 400 extensions (.com, .fr, .app, .io, .dev, .co, etc.). Toutes les extensions populaires sont disponibles avec les meilleurs tarifs.' 
            },
            { 
              q: 'Comment fonctionne la sécurité des paiements?', 
              a: 'Nous utilisons Stripe pour tous les paiements. Vos données de carte bancaire ne sont jamais stockées sur nos serveurs. Tous les paiements sont chiffrés avec SSL 256-bit.' 
            },
            { 
              q: 'Puis-je transférer mon domaine d\'un autre registraire?', 
              a: 'Oui, absolument! Le transfert est gratuit et simple. Nous vous guidons à chaque étape. Votre domaine reste actif pendant toute la durée du transfert.' 
            },
            { 
              q: 'Y a-t-il un contrat à long terme?', 
              a: 'Non! Pas de contrat. Vous payez uniquement pour ce que vous utilisez. Vous pouvez annuler à tout moment sans frais de résiliation.' 
            },
            { 
              q: 'Quel est le délai d\'activation d\'un domaine?', 
              a: 'La plupart des domaines sont activés en 5 minutes. Certains TLDs spécialisés peuvent prendre jusqu\'à 24 heures. Nous vous tiendrons informé à chaque étape.' 
            },
            { 
              q: 'Pouvez-vous m\'aider si j\'ai un problème?', 
              a: 'Bien sûr! Notre support 24/7 est disponible par email, chat et téléphone. Réponses garanties en moins de 4 heures (généralement dans l\'heure).' 
            }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
              className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-left hover:border-blue-500/50 transition group"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-white text-lg">{item.q}</h3>
                <ChevronDown 
                  className={`w-6 h-6 text-blue-400 transition flex-shrink-0 ${expandedFaq === idx ? 'rotate-180' : ''}`} 
                />
              </div>
              {expandedFaq === idx && (
                <p className="text-slate-300 mt-4 text-base leading-relaxed animate-fade-in">
                  {item.a}
                </p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Reseller Program Section */}
      <section id="seller" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-800/50">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-white mb-4">
            Devenez Revendeur de Domaines
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Lancez un business lucratif. Commission jusqu'à 30%, aucun investissement initial, support complet.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h3 className="text-3xl font-bold text-white mb-8">Pourquoi devenir revendeur?</h3>
            <div className="space-y-6">
              {[
                { icon: '💰', title: 'Marges Bénéficiaires', desc: 'Commission jusqu\'à 30% par domaine vendu' },
                { icon: '⚡', title: 'Activation Rapide', desc: 'Configuration en 5 minutes, commencer à gagner immédiatement' },
                { icon: '📊', title: 'Dashboard Complet', desc: 'Analytics temps réel de vos ventes et commissions' },
                { icon: '🌍', title: '400+ Domaines', desc: 'Tous les TLDs populaires disponibles pour vos clients' },
                { icon: '🎯', title: 'Support Dédié', desc: 'Équipe à vos côtés pour développer votre activité' },
                { icon: '🔒', title: 'Infrastructure Sécurisée', desc: 'Paiements Stripe, données chiffrées, backups automatiques' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="text-3xl flex-shrink-0 group-hover:scale-110 transition">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900 border border-slate-700/50 rounded-2xl p-8">
            <h4 className="text-2xl font-bold text-white mb-8">Exemples de Revenus Mensuels</h4>
            <div className="space-y-6">
              {[
                { domaines: '10 domaines/mois', revenu: '€360', note: 'à 30% de commission moyenne' },
                { domaines: '50 domaines/mois', revenu: '€1,800', note: 'revenu passif intéressant' },
                { domaines: '200 domaines/mois', revenu: '€7,200', note: 'business à part entière' }
              ].map((example, idx) => (
                <div key={idx} className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/50 hover:border-green-500/50 transition">
                  <p className="text-slate-400 text-sm mb-2">{example.domaines}</p>
                  <p className="text-3xl font-bold text-green-400">{example.revenu}</p>
                  <p className="text-xs text-slate-500">{example.note}</p>
                </div>
              ))}
            </div>
            <Link
              href="/signup?plan=professional"
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              Devenir Revendeur <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Commission Table */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 overflow-x-auto mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">Tableau de Commission</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-white font-bold text-sm">Extension</th>
                <th className="px-4 py-3 text-white font-bold text-right text-sm">Prix Client</th>
                <th className="px-4 py-3 text-white font-bold text-right text-sm">Votre Commission</th>
                <th className="px-4 py-3 text-white font-bold text-right text-sm">Taux</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {[
                { tld: '.com', price: '9.99', commission: '2.50', rate: '25%' },
                { tld: '.fr', price: '7.99', commission: '2.40', rate: '30%' },
                { tld: '.app', price: '11.99', commission: '3.60', rate: '30%' },
                { tld: '.io', price: '29.99', commission: '9.00', rate: '30%' },
                { tld: '.dev', price: '13.99', commission: '4.20', rate: '30%' },
                { tld: '.co', price: '24.99', commission: '7.50', rate: '30%' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-4 text-white font-semibold text-sm">{row.tld}</td>
                  <td className="px-4 py-4 text-right text-slate-300 text-sm">€{row.price}</td>
                  <td className="px-4 py-4 text-right text-green-400 font-semibold text-sm">€{row.commission}</td>
                  <td className="px-4 py-4 text-right text-blue-400 text-sm">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Testimonials */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Ils Gagnent Déjà Avec Nous</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '👨‍💼', name: 'Marc D.', role: 'Entrepreneur', text: '€5,000 le premier mois! Interface intuitive et support excellente.' },
              { emoji: '👩‍💼', name: 'Sophie T.', role: 'Agence Digital', text: 'Parfait pour offrir à nos clients. Marges excellentes sans responsabilité.' },
              { emoji: '👨‍💻', name: 'Jean L.', role: 'Consultant IT', text: 'Revenue stream passif idéal. Clients heureux, moi content!' }
            ].map((testimonial, idx) => (
              <div key={idx} className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 hover:border-blue-500/50 transition">
                <div className="flex gap-3 mb-4">
                  <div className="text-3xl">{testimonial.emoji}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{testimonial.name}</p>
                    <p className="text-slate-400 text-xs">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA for Sellers */}
        <div className="bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-slate-900 border border-blue-500/30 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Commencez Dès Aujourd'hui</h3>
          <p className="text-blue-200 mb-8 text-lg">Gratuit. Aucun investissement. Support 24/7. Paiements garantis.</p>
          <Link
            href="/signup?type=reseller"
            className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-4 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            Créer Mon Compte Revendeur
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg">DomainHub</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                La plateforme la plus simple et la plus sûre pour enregistrer et gérer vos domaines.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produit</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-blue-400 transition">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition">Tarifs</a></li>
                <li><Link href="/blog" className="hover:text-blue-400 transition">Blog</Link></li>
                <li><Link href="/resources" className="hover:text-blue-400 transition">Ressources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#faq" className="hover:text-blue-400 transition">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Revendeurs</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#seller" className="hover:text-blue-400 transition">Programme</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Support Revendeur</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Commissions</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Ressources</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/50 pt-8">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-white text-sm mb-3">Légal</h4>
                <ul className="space-y-2 text-slate-400 text-xs">
                  <li><a href="#" className="hover:text-blue-400 transition">Conditions</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition">Confidentialité</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition">Cookies</a></li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-slate-400 text-xs">
                    © 2026 DomainHub. Tous droits réservés. Enregistré en France.
                  </p>
                  <div className="flex gap-4">
                    <a href="#" className="text-slate-400 hover:text-blue-400 transition text-sm">Twitter</a>
                    <a href="#" className="text-slate-400 hover:text-blue-400 transition text-sm">LinkedIn</a>
                    <a href="#" className="text-slate-400 hover:text-blue-400 transition text-sm">GitHub</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

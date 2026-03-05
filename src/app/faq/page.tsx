'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Combien de temps faut-il pour enregistrer un domaine?',
      answer:
        'En général, votre domaine est enregistré et actif en moins de 5 minutes après votre paiement. Vous pouvez commencer à l\'utiliser immédiatement.'
    },
    {
      question: 'Quels modes de paiement acceptez-vous?',
      answer:
        'Nous acceptons tous les modes de paiement via Stripe: cartes de crédit/débit (Visa, Mastercard, American Express), PayPal, et Apple Pay.'
    },
    {
      question: 'Puis-je transférer mon domaine vers un autre registraire?',
      answer:
        'Oui, absolument! Vos domaines vous appartiennent. Nous fournissons un code d\'autorisation (auth code) qui vous permet de transférer vers n\'importe quel registraire.'
    },
    {
      question: 'Y a-t-il des frais cachés?',
      answer:
        'Non, nos prix sont totalement transparents. Le prix affiché est le prix final. Pas de frais d\'administration, pas de frais cachés. Vous ne payez que pour le domaine et sa durée.'
    },
    {
      question: 'Que se passe-t-il si je renouvelle mon domaine?',
      answer:
        'Les renouvellements se font automatiquement. Vous recevrez une notification avant l\'expiration, et vous pouvez renouveler facilement depuis votre dashboard. Le prix du renouvellement est le même que le prix d\'enregistrement initial.'
    },
    {
      question: 'Avez-vous une politique de remboursement?',
      answer:
        'Oui, nous offrons une garantie de satisfaction de 48 heures. Si vous changez d\'avis dans les 48 heures, nous remboursons intégralement votre achat.'
    },
    {
      question: 'Comment gérer mes domaines une fois achetés?',
      answer:
        'Vous avez accès à un dashboard complet où vous pouvez gérer tous vos domaines: voir les détails, configurer les DNS, renouveler, transférer, etc.'
    },
    {
      question: 'Supportez-vous toutes les extensions de domaine?',
      answer:
        'Nous supportons plus de 400 extensions (TLDs), incluant les classiques (.com, .fr, .net) et les modernes (.app, .io, .dev, .tech, etc.). Vérifiez la disponibilité directement sur notre plateforme.'
    },
    {
      question: 'Avez-vous un support client?',
      answer:
        'Oui! Notre équipe est disponible 24/7 via email et chat. Nous répondons généralement en moins d\'une heure. Vous avez aussi accès à une section d\'aide complète avec des tutoriels vidéo.'
    },
    {
      question: 'Puis-je acheter un domaine sans être enregistré?',
      answer:
        'Non, vous devez avoir un compte pour acheter. Mais c\'est très rapide et gratuit de créer un compte. Aucune carte de crédit requise pour s\'inscrire - vous n\'en avez besoin que lors du paiement.'
    },
    {
      question: 'Comment changez-vous vos prix?',
      answer:
        'Nos prix sont déterminés par nos registraires partenaires (IONOS, Gandi, etc.). Les prix peuvent fluctuer légèrement selon la demande, mais nous vous notifions toujours des changements importants à l\'avance.'
    },
    {
      question: 'Peut-on acheter un domaine qui est déjà pris?',
      answer:
        'Non directement via notre plateforme. Cependant, nous avons une section "Backorder" où vous pouvez exprimer votre intérêt pour un domaine qui expire bientôt. Si le propriétaire ne renouvelle pas, vous avez la possibilité d\'acheter.'
    },
    {
      question: 'Comment configurer les DNS pour mon domaine?',
      answer:
        'C\'est très simple depuis le dashboard. Vous pouvez ajouter des enregistrements DNS (A, CNAME, MX, TXT, etc.). Nous avons aussi des configurations prédéfinies pour les services populaires (Vercel, Netlify, Gmail, etc.).'
    },
    {
      question: 'Avez-vous une API pour les développeurs?',
      answer:
        'Oui! Notre API est disponible gratuitement pour les comptes Pro. Vous pouvez automatiser la recherche, l\'achat et la gestion de domaines. Consultez la documentation dans votre dashboard.'
    },
    {
      question: 'Peut-on avoir une facture fiscale?',
      answer:
        'Bien sûr! Vous recevez une facture automatique après chaque achat. Elle est disponible dans votre dashboard sous "Facturation". Vous pouvez la télécharger en PDF ou l\'imprimer.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Questions Fréquentes</h1>
          <p className="text-xl text-slate-400">
            Vous avez une question? Consultez notre FAQ complète ou contactez notre support.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-700 rounded-lg overflow-hidden hover:border-blue-500 transition"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 bg-slate-800/50 hover:bg-slate-800 flex justify-between items-center transition text-left"
              >
                <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-blue-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-8 py-6 bg-slate-900/50 border-t border-slate-700 animate-in fade-in">
                  <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Vous ne trouvez pas la réponse?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Notre équipe est disponible 24/7 pour vous aider
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-3 rounded-lg font-semibold transition">
              Contacter le Support
            </button>
            <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition">
              Voir les Tutoriels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

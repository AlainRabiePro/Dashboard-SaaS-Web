'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';

export default function CollaboratorsAddonPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleSubscribe = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError('');

      // Créer une session de checkout Stripe
      const response = await fetch('/api/billing/create-addon-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          addOnId: 'collaborators',
          returnUrl: `${window.location.origin}/sites`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Une erreur est survenue');
        return;
      }

      const data = await response.json();
      
      // Rediriger vers Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.sessionId) {
        // Si vous utilisez Stripe.js
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      }
    } catch (err) {
      console.error('Error subscribing to addon:', err);
      setError('Erreur lors de la souscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Add-on Team Collaborators</h1>
        <p className="text-muted-foreground italic">
          Invitez vos collègues à collaborer sur vos projets
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Détails du plan */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Team Collaborators</CardTitle>
            <CardDescription>Gérez votre équipe et invitez des collaborateurs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fonctionnalités */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-300">Ce qui est inclus:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm">3 collaborateurs par projet</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm">Liens d'invitation partageable</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm">Gestion des permissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm">Invitations par email</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm">Suivi des accès</span>
                </li>
              </ul>
            </div>

            {/* Prix */}
            <div className="border-t border-white/5 pt-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">2€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Facturé mensuellement. Annulation possible à tout moment.
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement...
                </span>
              ) : (
                'S\'abonner maintenant'
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Vous serez redirigé vers Stripe pour passer la commande de façon sécurisée.
            </p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Questions fréquentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-300 mb-1">Puis-je avoir plus de 3 collaborateurs?</h4>
              <p className="text-gray-400">
                Actuellement, l'add-on Team Collaborators permet d'inviter jusqu'à 3 personnes par projet. 
                Contactez le support pour des besoins spécifiques.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-1">Puis-je annuler à tout moment?</h4>
              <p className="text-gray-400">
                Oui, vous pouvez annuler votre abonnement à tout moment. Aucun engagement à long terme.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-1">Combien coûte vraiment?</h4>
              <p className="text-gray-400">
                2€ par mois, sans frais cachés. Vous recevrez une facture mensuelle.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

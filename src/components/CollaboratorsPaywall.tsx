'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle, Check } from 'lucide-react';

interface CollaboratorsPaywallProps {
  onSubscribe?: () => void;
  addonPrice?: number;
}

export function CollaboratorsPaywall({ onSubscribe, addonPrice = 2 }: CollaboratorsPaywallProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user?.uid || !onSubscribe) return;

    try {
      setIsLoading(true);
      // Appeler la fonction de callback pour rediriger vers Stripe
      onSubscribe();
    } catch (error) {
      console.error('Error subscribing to addon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-950/20 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-amber-400">Débloquez les Collaborateurs</CardTitle>
            <CardDescription className="text-amber-200/70">
              Invitez jusqu'à 3 personnes par projet
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Détails du plan */}
        <div className="grid gap-3 py-4 border-y border-amber-500/20">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">3 collaborateurs par projet</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">Liens d'invitation partageable</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">Gestion des permissions</span>
          </div>
        </div>

        {/* Prix et CTA */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-400">Prix mensuel:</span>
            <div className="text-right">
              <span className="text-3xl font-bold text-amber-400">{addonPrice}€</span>
              <span className="text-sm text-gray-400">/mois</span>
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition duration-200"
          >
            {isLoading ? 'Traitement...' : `Activer pour ${addonPrice}€/mois`}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Annulation possible à tout moment. Pas d'engagement à long terme.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

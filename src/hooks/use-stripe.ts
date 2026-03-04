import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './use-toast';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceId: string; // Stripe Price ID
  features: string[];
  interval: 'month' | 'year';
  isPopular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  priceId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}

export function useStripeCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = useCallback(
    async (priceId: string, successUrl?: string, cancelUrl?: string) => {
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté pour accéder à la facturation',
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
            successUrl: successUrl || `${window.location.origin}/billing?success=true`,
            cancelUrl: cancelUrl || `${window.location.origin}/billing?canceled=true`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initiate checkout');
        }

        // Rediriger vers Stripe Checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else if (data.sessionId) {
          // Alternative: rediriger avec Stripe.js
          // Nécessite d'avoir Stripe.js chargé
          window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({
          title: 'Erreur de paiement',
          description: message,
        });
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  return { initiateCheckout, loading, error };
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/subscribe?userId=${user.uid}`);
      const data = await response.json();

      if (response.ok && data.subscription) {
        setSubscription({
          ...data.subscription,
          currentPeriodStart: new Date(data.subscription.currentPeriodStart),
          currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
          createdAt: new Date(data.subscription.createdAt),
        });
      } else {
        setSubscription(null);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { subscription, loading, error, fetchSubscription };
}

export function useBillingPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Erreur',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return { openPortal, loading };
}

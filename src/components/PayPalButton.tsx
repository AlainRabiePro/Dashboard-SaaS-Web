'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalButtonProps {
  planId: string;
  planName: string;
  amount: number; // en centimes (ex: 499 = €4.99)
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export function PayPalButton({
  planId,
  planName,
  amount,
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!window.paypal || !user?.uid) return;

    setLoading(true);
    setError('');

    try {
      window.paypal
        .Buttons({
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
          createOrder: async () => {
            // Créer une commande PayPal
            const response = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.uid,
              },
              body: JSON.stringify({
                planId,
                planName,
                amount,
                description: `${planName} Plan - Monthly Subscription`,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              setError(error.error || 'Failed to create order');
              throw new Error(error.error);
            }

            const data = await response.json();
            return data.orderId;
          },

          onApprove: async (data: any) => {
            // L'utilisateur a approuvé - capturer la commande
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.uid,
              },
              body: JSON.stringify({
                orderId: data.orderID,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              setError(error.error || 'Failed to capture payment');
              onError?.(error.error);
              throw new Error(error.error);
            }

            const result = await response.json();
            onSuccess?.(result.orderId);
            window.location.href = result.redirectUrl;
          },

          onError: (err: any) => {
            console.error('PayPal error:', err);
            const errorMsg = err.message || 'Payment failed';
            setError(errorMsg);
            onError?.(errorMsg);
          },

          onCancel: () => {
            setError('Payment cancelled');
          },
        })
        .render(containerRef.current)
        .catch((err: any) => {
          console.error('Failed to render PayPal buttons:', err);
          setError('Failed to load PayPal. Please refresh the page.');
        });
    } catch (err) {
      console.error('PayPal setup error:', err);
      setError('Failed to initialize PayPal');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, planId, planName, amount, onSuccess, onError]);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading PayPal...</span>
      </div>
    );
  }

  return <div ref={containerRef} className="paypal-button-container" />;
}

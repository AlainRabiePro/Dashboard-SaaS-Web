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
  const [containerMounted, setContainerMounted] = useState(false);

  // Marquer quand le container est monté
  useEffect(() => {
    if (containerRef.current) {
      console.log('PayPalButton: Container mounted in DOM');
      setContainerMounted(true);
    }
  }, []);

  // Attendre PayPal SDK et container
  useEffect(() => {
    if (!user?.uid) {
      console.error('PayPalButton: User not authenticated');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
      console.error('NEXT_PUBLIC_PAYPAL_CLIENT_ID not configured');
      setError('PayPal Client ID not configured');
      setLoading(false);
      return;
    }

    console.log('PayPalButton: Starting SDK check...');

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 100; // 10 secondes

    const checkAndInitialize = () => {
      attempts++;
      
      console.log(`PayPalButton: Attempt ${attempts}/${maxAttempts} - SDK:`, !!window.paypal, 'Container:', !!containerRef.current);

      if (window.paypal && containerRef.current && isMounted) {
        console.log('PayPalButton: SDK ready and container mounted - initializing buttons');
        clearInterval(interval);
        initPayPalButtons();
      } else if (attempts >= maxAttempts) {
        console.error('PayPalButton: Timeout waiting for SDK or container');
        console.error('  - SDK available:', !!window.paypal);
        console.error('  - Container available:', !!containerRef.current);
        if (isMounted) {
          setError('Failed to load PayPal. Please refresh the page.');
          setLoading(false);
        }
        clearInterval(interval);
      }
    };

    const interval = setInterval(checkAndInitialize, 100);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.uid]);

  const initPayPalButtons = () => {
    if (!containerRef.current || !window.paypal) {
      console.error('PayPalButton: Missing container or SDK');
      setError('Container or SDK not available');
      setLoading(false);
      return;
    }

    console.log('PayPalButton: Initializing buttons...');
    setLoading(true);
    setError('');

    try {
      window.paypal
        .Buttons({
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
          createOrder: async () => {
            console.log('PayPalButton: Creating order for', planName);
            const response = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user?.uid || '',
              },
              body: JSON.stringify({
                planId,
                planName,
                amount,
                description: `${planName} Plan - Monthly Subscription`,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('PayPalButton: Create order failed - Status:', response.status);
              console.error('PayPalButton: Error response:', errorText);
              try {
                const error = JSON.parse(errorText);
                setError(error.error || `Error: ${response.status}`);
              } catch {
                setError(`Error: ${response.status} - ${errorText}`);
              }
              throw new Error('Create order failed');
            }

            const data = await response.json();
            console.log('PayPalButton: Order created:', data.orderId);
            return data.orderId;
          },

          onApprove: async (data: any) => {
            console.log('PayPalButton: Order approved:', data.orderID);
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user?.uid || '',
              },
              body: JSON.stringify({
                orderId: data.orderID,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              console.error('PayPalButton: Capture failed:', error);
              setError(error.error || 'Failed to capture payment');
              onError?.(error.error);
              throw new Error(error.error);
            }

            const result = await response.json();
            console.log('PayPalButton: Payment successful');
            onSuccess?.(result.orderId);
            window.location.href = result.redirectUrl;
          },

          onError: (err: any) => {
            console.error('PayPalButton: Payment error:', err);
            const errorMsg = err.message || 'Payment failed';
            setError(errorMsg);
            onError?.(errorMsg);
          },

          onCancel: () => {
            console.log('PayPalButton: User cancelled payment');
            setError('Payment cancelled');
          },
        })
        .render(containerRef.current)
        .then(() => {
          console.log('PayPalButton: Buttons rendered successfully');
          setLoading(false);
        })
        .catch((err: any) => {
          console.error('PayPalButton: Failed to render:', err);
          setError('Failed to load PayPal. Please refresh the page.');
          setLoading(false);
        });
    } catch (err) {
      console.error('PayPalButton: Setup error:', err);
      setError('Failed to initialize PayPal');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  // LE CONTAINER DOIT TOUJOURS ÊTRE PRÉSENT, MÊME PENDANT LE CHARGEMENT!
  return (
    <>
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Chargement de PayPal...</span>
        </div>
      )}
      <div 
        ref={containerRef} 
        id="paypal-button-container"
        className="paypal-button-container"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </>
  );
}

export default PayPalButton;

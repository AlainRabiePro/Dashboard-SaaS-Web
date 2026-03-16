"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Activity } from "lucide-react";
import PayPalButton from "@/components/PayPalButton";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 4.99,
    storage: 5,
    sites: 1,
    features: [
      "5GB Stockage",
      "1 Site Web",
      "Déploiement Automatique",
      "Intégration AdSense",
      "Support Email"
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || ""
  },
  {
    id: "professional",
    name: "Professional",
    price: 9.99,
    storage: 15,
    sites: -1, // Illimité
    features: [
      "15GB Stockage",
      "Sites Illimités",
      "Déploiement Automatique",
      "Intégration AdSense",
      "Provisioning Avancé",
      "Support Prioritaire",
      "Analytics"
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
    recommended: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 16.99,
    storage: 100,
    sites: -1, // Illimité
    features: [
      "100GB Stockage",
      "Sites Illimités",
      "Déploiement Automatique",
      "Intégration AdSense",
      "Provisioning Avancé",
      "Support 24/7",
      "Analytics Avancées",
      "API Access",
      "SLA Garanti"
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || ""
  }
];

export default function SelectPlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("professional");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  // Vérifier si l'utilisateur a un plan dès le montage
  useEffect(() => {
    let isMounted = true;

    const checkUserPlan = async () => {
      // Si pas d'utilisateur, redirect login
      if (!user) {
        if (isMounted) {
          router.push("/login");
        }
        return;
      }

      try {
        // Fetch le profil utilisateur via API pour éviter les subscriptions
        const token = await user.getIdToken();
        const response = await fetch('/api/user-profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': user.uid,
          }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const data = await response.json();
        
        // Si l'utilisateur a déjà un plan, redirect dashboard
        if (isMounted && data.profile?.storageLimit && data.profile.storageLimit > 0) {
          router.replace("/dashboard");
          return;
        }

        if (isMounted) {
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Error checking plan:', err);
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkUserPlan();

    return () => {
      isMounted = false;
    };
  }, [user, router]);

  // Afficher un loader pendant la vérification du plan
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground font-medium">Vérification...</p>
        </div>
      </div>
    );
  }

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handlePayPalSuccess = () => {
    // Payment was successful, redirect to billing page
    router.push("/billing?success=true");
  };

  const handlePayPalError = (error: string) => {
    setError(error);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Choisissez votre plan</h1>
          <p className="text-xl text-muted-foreground">
            Sélectionnez le plan qui correspond à vos besoins
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 mb-8 text-destructive">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 ${
                selectedPlanId === plan.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {plan.recommended && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" /> RECOMMANDÉ
                  </Badge>
                </div>
              )}
              <Card className={`h-full flex flex-col ${selectedPlanId === plan.id ? "border-primary shadow-lg" : ""}`}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground"> / mois</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">INCLUS:</p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{plan.storage}GB Stockage</p>
                      <p className="text-sm font-medium">
                        {plan.sites === -1 ? "Sites Illimités" : `${plan.sites} Site Web`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={selectedPlanId === plan.id ? "default" : "outline"}
                  >
                    {selectedPlanId === plan.id ? "✓ Sélectionné" : "Choisir"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Debug: afficher l'état */}
        {selectedPlanId && (
          <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-400">
              Plan sélectionné: {selectedPlanId} | État: {selectedPlanId ? "défini" : "vide"}
            </p>
          </div>
        )}

        {selectedPlanId && (
          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-lg p-8">
            {(() => {
              const selectedPlan = PLANS.find(p => p.id === selectedPlanId);
              return selectedPlan ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">
                      {selectedPlan.name} Plan - ${selectedPlan.price}/month
                    </h3>
                    <p className="text-muted-foreground">
                      Cliquez ci-dessous pour finaliser votre paiement via PayPal
                    </p>
                  </div>
                  <PayPalButton
                    planId={selectedPlan.id}
                    planName={selectedPlan.name}
                    amount={Math.round(selectedPlan.price * 100)} // Convert to cents
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                  />
                </div>
              ) : null;
            })()}
          </div>
        )}

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setSelectedPlanId("")}
            variant="outline"
            className="px-12 mt-4"
          >
            Annuler la sélection
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Vous pouvez changer de plan à tout moment. Pas de contrat à long terme.</p>
        </div>
      </div>
    </div>
  );
}

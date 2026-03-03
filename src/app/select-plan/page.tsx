"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { UserProfile } from "@/lib/firestore-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Activity } from "lucide-react";

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
  const firestore = useFirestore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Récupérer le profil utilisateur pour vérifier s'il a déjà un plan
  const userRef = useMemo(() => 
    user && firestore ? doc(firestore, "users", user.uid) : null,
    [user?.uid, firestore]
  );
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  // Rediriger si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!user && !isRedirecting) {
      router.push("/login");
      setIsRedirecting(true);
    }
  }, [user, router, isRedirecting]);

  // Rediriger si l'utilisateur a déjà un plan (storageLimit > 0)
  useEffect(() => {
    if (!profileLoading && profile && profile.storageLimit && profile.storageLimit > 0) {
      console.log('✅ Utilisateur avec plan détecté, redirection vers /dashboard');
      setIsRedirecting(true);
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, profileLoading]);

  // Afficher un loader si on vérifie le profil
  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si on redirige, ne rien afficher
  if (isRedirecting) {
    return null;
  }

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleConfirmPlan = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Vérifier que l'utilisateur est authentifié
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      const plan = PLANS.find(p => p.id === selectedPlanId);
      if (!plan) throw new Error("Plan not found");

      const token = await user.getIdToken();

      // Appeler l'API pour créer l'abonnement Stripe
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.stripePriceId,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la création de l'abonnement");
      }

      const data = await response.json();

      // Rediriger vers Stripe pour le paiement
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        // Si pas de paiement (mode test), rediriger vers le dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
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

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleConfirmPlan}
            disabled={isLoading}
            className="px-12"
          >
            {isLoading ? "Chargement..." : "Continuer avec ce plan"}
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Vous pouvez changer de plan à tout moment. Pas de contrat à long terme.</p>
        </div>
      </div>
    </div>
  );
}

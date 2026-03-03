"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { UserProfile } from "@/lib/firestore-service";
import { Activity } from "lucide-react";

export function DashboardProtection({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  // Récupérer le profil utilisateur
  const userRef = user && firestore ? doc(firestore, "users", user.uid) : null;
  const { data: profile, loading } = useDoc<UserProfile>(userRef);

  // Effet de redirection
  useEffect(() => {
    // Ne pas rediriger si on est en train de charger
    if (loading) return;

    // Si aucun profil ou storageLimit est 0, rediriger vers /select-plan
    if (!profile || !profile.storageLimit || profile.storageLimit === 0) {
      // S'assurer qu'on est bien authentifié
      if (user) {
        console.log('❌ Utilisateur sans plan détecté, redirection vers /select-plan');
        router.replace("/select-plan");
      }
    }
  }, [profile, loading, user, router, pathname]);

  // Si on charge toujours, afficher un loader
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground font-medium">Vérification du plan...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'a pas de plan, ne rien afficher (la redirection se fera via useEffect)
  if (!profile || !profile.storageLimit || profile.storageLimit === 0) {
    return null;
  }

  // Utilisateur a un plan valide, afficher le contenu
  return <>{children}</>;
}

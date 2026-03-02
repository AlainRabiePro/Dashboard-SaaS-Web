'use client';

import { useData } from '@/components/data-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const { error } = useData();

  if (error) {
    return (
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-center justify-center">
          <Alert variant="destructive" className="w-auto max-w-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur de connexion à la base de données</AlertTitle>
              <AlertDescription>
                  <p>L'application n'a pas pu se connecter à la base de données Firestore. Cela se produit généralement si la base de données n'a pas été créée pour votre projet Firebase ou en raison de problèmes de réseau.</p>
                  <p className="mt-2">Veuillez vérifier les points suivants :</p>
                  <ul className="list-disc list-inside mt-1 text-xs">
                      <li>Assurez-vous d'avoir une connexion Internet active.</li>
                      <li>Allez dans la console Firebase de votre projet `interface-graphique-saas`.</li>
                      <li>Dans le menu de gauche, cliquez sur "Firestore Database".</li>
                      <li>Cliquez sur "Créer une base de données" et suivez les étapes (vous pouvez démarrer en mode test).</li>
                  </ul>
                  <p className="mt-4 text-xs font-mono bg-muted p-2 rounded">
                      Détail de l'erreur : {error.message}
                  </p>
              </AlertDescription>
          </Alert>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      {children}
    </main>
  );
}

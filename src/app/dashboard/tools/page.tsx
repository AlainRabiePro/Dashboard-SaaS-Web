'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Rocket, History, Settings2, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useData } from '@/components/data-provider';
import { Skeleton } from '@/components/ui/skeleton';

const tools = [
  {
    title: 'Deplora',
    description: 'Déployez un nouveau site ou mettez à jour un site existant à partir d\'un dépôt.',
    icon: Rocket,
    href: '#',
    comingSoon: true,
  },
  {
    title: 'Historique des versions',
    description: 'Parcourez et restaurez les versions précédentes de vos sites déployés.',
    icon: History,
    href: '#',
    comingSoon: true,
  },
  {
    title: 'Intégration publicitaire',
    description: 'Intégrez facilement des plateformes publicitaires à vos projets.',
    icon: Newspaper,
    href: '#',
    comingSoon: true,
  },
  {
    title: 'Gérer les publicités',
    description: 'Configurez et gérez les campagnes et les emplacements publicitaires.',
    icon: Settings2,
    href: '#',
    comingSoon: true,
  },
];

export default function ToolsPage() {
  const { subscription, loading } = useData();
  const hasAccess = subscription?.plan === 'Pro';

  if (loading && subscription === undefined) {
    return (
        <div className="grid gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Outils</h1>
            <p className="text-muted-foreground">Une collection d\'outils et d\'utilitaires utiles pour vos projets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[230px] rounded-lg" />
            ))}
          </div>
        </div>
    );
  }

  if (!hasAccess) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 h-full text-center p-8">
            <Lock className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-2xl font-bold">Les outils sont une fonctionnalité Pro</h1>
            <p className="text-muted-foreground max-w-md mt-2 mb-6">
              Veuillez passer au forfait Pro pour accéder à Deplora, à l'historique des versions et à d'autres outils puissants.
            </p>
            <Link href="/dashboard/billing">
              <Button>Mettre à niveau votre forfait</Button>
            </Link>
        </div>
    );
  }
  
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outils</h1>
        <p className="text-muted-foreground">Une collection d\'outils et d\'utilitaires utiles pour vos projets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.title} className="flex flex-col hover:border-primary/50 transition-colors">
            <CardHeader className="flex-row items-center gap-4">
              <tool.icon className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">{tool.description}</p>
            </CardContent>
            <div className="p-6 pt-0">
                {tool.comingSoon ? (
                    <div className="text-xs font-semibold text-primary/80">Prochainement</div>
                ) : (
                    <Link href={tool.href} className="text-sm font-semibold text-primary hover:underline">
                        Lancer l'outil
                    </Link>
                )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

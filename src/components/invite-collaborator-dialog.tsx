'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Gestion complète sauf facturation' },
  { value: 'editor', label: 'Éditeur', description: 'Déployer et gérer les sites' },
  { value: 'reader', label: 'Lecteur', description: 'Accès en lecture seule' },
];

export function InviteCollaboratorDialog({
  onInvite,
  userId,
}: {
  onInvite: () => void;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'reader'>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    if (!email) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Adresse email invalide');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/collaborators', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Si l'add-on est requis, rediriger vers la page d'achat
        if (data.requiresAddon) {
          setError('Limite atteinte. Débloquez l\'add-on Team Collaborators pour ajouter plus de membres.');
          // Redirection après fermeture du dialog
          setTimeout(() => {
            window.location.href = '/billing/addons/collaborators';
          }, 1500);
          return;
        }
        
        setError(data.error || 'Erreur lors de l\'invitation');
        return;
      }

      setSuccess(true);
      setEmail('');
      setName('');
      setRole('editor');

      // Fermer la dialog après 2 secondes
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        onInvite();
      }, 2000);
    } catch (err) {
      setError('Erreur lors de l\'invitation');
      console.error('Error inviting collaborator:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Inviter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10">
        <DialogHeader>
          <DialogTitle>Inviter un collaborateur</DialogTitle>
          <DialogDescription>
            Invitez un nouveau membre de l'équipe à SaasFlow
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 font-semibold">✓ Invitation envoyée avec succès!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Un email d'invitation a été envoyé à {email}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Adresse email</label>
              <Input
                type="email"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-zinc-900 border-white/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Nom (optionnel)</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="bg-zinc-900 border-white/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Rôle</label>
              <div className="space-y-2">
                {ROLE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 rounded-md cursor-pointer border transition-colors ${
                      role === option.value
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setRole(option.value as any)}
                  >
                    <p className="font-semibold text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="border-white/10"
              >
                Annuler
              </Button>
              <Button
                onClick={handleInvite}
                disabled={loading || !email}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer l\'invitation'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

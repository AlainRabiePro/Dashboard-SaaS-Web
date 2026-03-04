'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Mail, CheckCircle2 } from 'lucide-react';
import { ROLE_DESCRIPTIONS, type Collaborator, type UserRole } from '@/lib/collaborator-service';

export function CollaboratorRow({
  collaborator,
  userId,
  onUpdate,
  onDelete,
}: {
  collaborator: Collaborator;
  userId: string;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/collaborators', {
        method: 'PATCH',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaboratorId: collaborator.id,
          role: newRole,
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating collaborator:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch('/api/collaborators', {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collaboratorId: collaborator.id }),
      });

      if (response.ok) {
        setShowDeleteAlert(false);
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting collaborator:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Actif
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 flex items-center gap-1">
        <Mail className="h-3 w-3" />
        Invité
      </Badge>
    );
  };

  return (
    <>
      <div className="p-4 rounded-md border border-white/10 bg-white/2 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold text-sm">{collaborator.name || collaborator.email}</p>
              <p className="text-xs text-muted-foreground">{collaborator.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(collaborator.status)}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {ROLE_DESCRIPTIONS[collaborator.role as UserRole]}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {collaborator.status === 'invited' ? (
            <div className="text-xs text-amber-400">
              Invite envoyée {new Date(collaborator.invitedAt || 0).toLocaleDateString('fr-FR')}
            </div>
          ) : (
            <Select
              value={collaborator.role}
              onValueChange={handleRoleChange}
              disabled={updating}
            >
              <SelectTrigger className="w-32 bg-zinc-900 border-white/10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Éditeur</SelectItem>
                <SelectItem value="reader">Lecteur</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteAlert(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le collaborateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {collaborator.name || collaborator.email}?
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel className="border-white/10">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Plus, Check } from 'lucide-react';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface DatabaseConnection {
  id: string;
  name: string;
  isDefault: boolean;
  config?: FirebaseConfig;
  projectId?: string;
}

interface DatabaseManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  databases: DatabaseConnection[];
  onDatabaseAdded: () => void;
  userId: string;
}

export function DatabaseManager({
  isOpen,
  onOpenChange,
  databases,
  onDatabaseAdded,
  userId,
}: DatabaseManagerProps) {
  const [isAddingDatabase, setIsAddingDatabase] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FirebaseConfig>>({});
  const [databaseName, setDatabaseName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDatabase = async () => {
    if (!databaseName.trim() || Object.values(formData).some(v => !v?.trim())) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: databaseName,
          config: formData,
          isDefault: databases.length === 0, // Première base = par défaut
        }),
      });

      if (!response.ok) throw new Error('Failed to add database');

      setDatabaseName('');
      setFormData({});
      setIsAddingDatabase(false);
      onDatabaseAdded();
    } catch (error) {
      console.error('Error adding database:', error);
      alert('Erreur lors de l\'ajout de la base');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDatabase = async (databaseId: string) => {
    try {
      const response = await fetch('/api/databases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId }),
      });

      if (!response.ok) throw new Error('Failed to delete database');

      setDeletingId(null);
      onDatabaseAdded();
    } catch (error) {
      console.error('Error deleting database:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSetDefault = async (databaseId: string) => {
    try {
      const response = await fetch('/api/databases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId, isDefault: true }),
      });

      if (!response.ok) throw new Error('Failed to update database');

      onDatabaseAdded();
    } catch (error) {
      console.error('Error updating database:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gérer les bases de données</DialogTitle>
          <DialogDescription>
            Connectez vos bases de données Firestore personnalisées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* List of databases */}
          <div className="space-y-3">
            <h3 className="font-semibold">Vos bases de données</h3>
            {databases.length > 0 ? (
              <div className="space-y-2">
                {databases.map((db) => (
                  <Card key={db.id} className="border-white/5 bg-white/2">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div>
                            <p className="font-semibold text-sm">{db.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {db.config?.projectId || 'Projet'} • {db.config?.authDomain || 'Auth'}
                            </p>
                          </div>
                          {db.isDefault && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                              <Check className="h-3 w-3 mr-1" />
                              Par défaut
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!db.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(db.id)}
                            >
                              Définir par défaut
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingId(db.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune base de données connectée</p>
            )}
          </div>

          {/* Add new database form */}
          <div className="border-t border-white/10 pt-6">
            {isAddingDatabase ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Ajouter une nouvelle base</h3>

                <Input
                  placeholder="Nom de la base (ex: Mon Project)"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                />

                <div className="grid gap-3">
                  <Input
                    placeholder="API Key"
                    type="password"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  />
                  <Input
                    placeholder="Auth Domain (ex: project.firebaseapp.com)"
                    value={formData.authDomain || ''}
                    onChange={(e) => setFormData({ ...formData, authDomain: e.target.value })}
                  />
                  <Input
                    placeholder="Project ID"
                    value={formData.projectId || ''}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  />
                  <Input
                    placeholder="Storage Bucket"
                    value={formData.storageBucket || ''}
                    onChange={(e) => setFormData({ ...formData, storageBucket: e.target.value })}
                  />
                  <Input
                    placeholder="Messaging Sender ID"
                    value={formData.messagingSenderId || ''}
                    onChange={(e) => setFormData({ ...formData, messagingSenderId: e.target.value })}
                  />
                  <Input
                    placeholder="App ID"
                    value={formData.appId || ''}
                    onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddDatabase}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Ajout en cours...' : 'Ajouter la base'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingDatabase(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingDatabase(true)}
                className="w-full gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Ajouter une base de données
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Supprimer la base de données</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous certain de vouloir supprimer cette base ? Cette action est irréversible.
          </AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDeleteDatabase(deletingId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

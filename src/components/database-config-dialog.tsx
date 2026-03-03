import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Check, AlertCircle, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import type { Site } from '@/lib/firestore-service';
import type { DatabaseType, FirebaseConfig, SupabaseConfig, MySQLConfig, PostgreSQLConfig, MongoDBConfig } from '@/lib/database-types';
import { DATABASE_TYPES } from '@/lib/database-types';

interface DatabaseConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  site: Site;
  onConfigUpdated: () => void;
}

type DatabaseConfigForm = FirebaseConfig | SupabaseConfig | MySQLConfig | PostgreSQLConfig | MongoDBConfig | Record<string, any>;

export function DatabaseConfigDialog({
  isOpen,
  onOpenChange,
  site,
  onConfigUpdated,
}: DatabaseConfigDialogProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [step, setStep] = useState<'list' | 'select-type' | 'add'>('list');
  const [selectedType, setSelectedType] = useState<DatabaseType>('firestore');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testError, setTestError] = useState('');
  const [selectedDbId, setSelectedDbId] = useState<string>('');
  const [dbName, setDbName] = useState('');
  const [formData, setFormData] = useState<DatabaseConfigForm>({});

  const databases = site.databases ? Object.values(site.databases) : [];
  const selectedDb = selectedDbId ? site.databases?.[selectedDbId] : null;

  const handleSelectType = (type: DatabaseType) => {
    setSelectedType(type);
    setFormData({});
    setDbName('');
    setStep('add');
  };

  const handleTestConnection = async () => {
    if (!dbName.trim()) {
      alert('Veuillez remplir le nom');
      return;
    }

    setIsTesting(true);
    setTestMessage('');
    setTestError('');

    try {
      const response = await fetch('/api/test-database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          config: formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestMessage(`✅ Connexion réussie!`);
      } else {
        setTestError(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing config:', error);
      setTestError('Erreur lors du test de connexion');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!user || !dbName.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      const dbId = `db_${Date.now()}`;
      const siteRef = doc(firestore, 'users', user.uid, 'sites', site.id);
      const newDatabases = site.databases || {};
      
      newDatabases[dbId] = {
        id: dbId,
        name: dbName,
        type: selectedType,
        config: formData,
        isDefault: Object.keys(newDatabases).length === 0, // First DB is default
      };

      await updateDoc(siteRef, { databases: newDatabases });

      setDbName('');
      setFormData({});
      setStep('list');
      onConfigUpdated();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDatabase = async (dbId: string) => {
    if (!user) return;

    try {
      const siteRef = doc(firestore, 'users', user.uid, 'sites', site.id);
      const newDatabases = site.databases ? { ...site.databases } : {};
      delete newDatabases[dbId];

      await updateDoc(siteRef, { databases: newDatabases });

      setSelectedDbId('');
      setIsRemoving(false);
      onConfigUpdated();
    } catch (error) {
      console.error('Error removing database:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSetDefault = async (dbId: string) => {
    if (!user || !site.databases) return;

    try {
      const siteRef = doc(firestore, 'users', user.uid, 'sites', site.id);
      const newDatabases = { ...site.databases };
      
      // Retirer le default des autres
      Object.values(newDatabases).forEach(db => {
        db.isDefault = false;
      });
      
      // Ajouter au sélectionné
      newDatabases[dbId].isDefault = true;

      await updateDoc(siteRef, { databases: newDatabases });
      onConfigUpdated();
    } catch (error) {
      console.error('Error updating default:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer les bases de données</DialogTitle>
            <DialogDescription>
              {site.name} - Connectez plusieurs types de bases de données
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* List View */}
            {step === 'list' && (
              <>
                {databases.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Vos bases de données ({databases.length})</h3>
                    {databases.map((db) => (
                      <Card key={db.id} className="border-white/5 bg-white/2">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div>
                                <p className="font-semibold text-sm flex items-center gap-2">
                                  {db.name}
                                  {db.isDefault && (
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                      Par défaut
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {DATABASE_TYPES[db.type]?.label}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!db.isDefault && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSetDefault(db.id)}
                                  className="text-xs"
                                >
                                  Définir par défaut
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedDbId(db.id);
                                  setIsRemoving(true);
                                }}
                                className="text-red-400 hover:text-red-300"
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
                  <div className="py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucune base de données configurée</p>
                  </div>
                )}

                <Button
                  onClick={() => setStep('select-type')}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une base de données
                </Button>
              </>
            )}

            {/* Select Type View */}
            {step === 'select-type' && (
              <>
                <h3 className="font-semibold text-sm">Sélectionner le type de base</h3>
                <div className="grid gap-2">
                  {Object.entries(DATABASE_TYPES).map(([type, info]) => (
                    <Button
                      key={type}
                      variant="outline"
                      className="h-auto justify-start gap-3 p-4"
                      onClick={() => handleSelectType(type as DatabaseType)}
                    >
                      <div className="text-left">
                        <p className="font-semibold text-sm">{info.label}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setStep('list')}
                  className="w-full"
                >
                  Retour
                </Button>
              </>
            )}

            {/* Add Configuration View */}
            {step === 'add' && (
              <>
                <div>
                  <label className="text-sm font-medium">Nom de la base</label>
                  <Input
                    placeholder="Ex: Base principale"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Dynamic form fields based on type */}
                <ConfigurationForm
                  type={selectedType}
                  config={formData}
                  onChange={setFormData}
                />

                {testMessage && (
                  <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30 text-sm text-green-400">
                    {testMessage}
                  </div>
                )}
                {testError && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                    {testError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    variant="outline"
                    className="flex-1"
                  >
                    {isTesting ? 'Test en cours...' : 'Tester'}
                  </Button>
                  <Button
                    onClick={handleSaveConfig}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Sauvegarde...' : 'Ajouter'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep('list')}
                  >
                    Retour
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={isRemoving} onOpenChange={setIsRemoving}>
        <AlertDialogContent>
          <AlertDialogTitle>Supprimer la base de données</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous certain de vouloir supprimer cette base?
          </AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedDbId) {
                  handleRemoveDatabase(selectedDbId);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Formulaire dynamique selon le type de base
 */
function ConfigurationForm({
  type,
  config,
  onChange,
}: {
  type: DatabaseType;
  config: DatabaseConfigForm;
  onChange: (config: DatabaseConfigForm) => void;
}) {
  switch (type) {
    case 'firestore':
      return (
        <div className="space-y-3">
          <Input
            placeholder="API Key"
            type="password"
            value={(config as any).apiKey || ''}
            onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
          />
          <Input
            placeholder="Auth Domain"
            value={(config as any).authDomain || ''}
            onChange={(e) => onChange({ ...config, authDomain: e.target.value })}
          />
          <Input
            placeholder="Project ID"
            value={(config as any).projectId || ''}
            onChange={(e) => onChange({ ...config, projectId: e.target.value })}
          />
          <Input
            placeholder="Storage Bucket"
            value={(config as any).storageBucket || ''}
            onChange={(e) => onChange({ ...config, storageBucket: e.target.value })}
          />
          <Input
            placeholder="Messaging Sender ID"
            value={(config as any).messagingSenderId || ''}
            onChange={(e) => onChange({ ...config, messagingSenderId: e.target.value })}
          />
          <Input
            placeholder="App ID"
            value={(config as any).appId || ''}
            onChange={(e) => onChange({ ...config, appId: e.target.value })}
          />
        </div>
      );

    case 'supabase':
      return (
        <div className="space-y-3">
          <Input
            placeholder="Project URL (https://xxxxx.supabase.co)"
            value={(config as any).projectUrl || ''}
            onChange={(e) => onChange({ ...config, projectUrl: e.target.value })}
          />
          <Input
            placeholder="Anon Key"
            type="password"
            value={(config as any).anonKey || ''}
            onChange={(e) => onChange({ ...config, anonKey: e.target.value })}
          />
          <Input
            placeholder="Service Key (optionnel)"
            type="password"
            value={(config as any).serviceKey || ''}
            onChange={(e) => onChange({ ...config, serviceKey: e.target.value })}
          />
        </div>
      );

    case 'mysql':
    case 'mariadb':
      return (
        <div className="space-y-3">
          <Input
            placeholder="Host"
            value={(config as any).host || ''}
            onChange={(e) => onChange({ ...config, host: e.target.value })}
          />
          <Input
            placeholder="Port"
            type="number"
            value={(config as any).port || 3306}
            onChange={(e) => onChange({ ...config, port: parseInt(e.target.value) })}
          />
          <Input
            placeholder="Username"
            value={(config as any).username || ''}
            onChange={(e) => onChange({ ...config, username: e.target.value })}
          />
          <Input
            placeholder="Password"
            type="password"
            value={(config as any).password || ''}
            onChange={(e) => onChange({ ...config, password: e.target.value })}
          />
          <Input
            placeholder="Database"
            value={(config as any).database || ''}
            onChange={(e) => onChange({ ...config, database: e.target.value })}
          />
        </div>
      );

    case 'postgresql':
      return (
        <div className="space-y-3">
          <Input
            placeholder="Host"
            value={(config as any).host || ''}
            onChange={(e) => onChange({ ...config, host: e.target.value })}
          />
          <Input
            placeholder="Port"
            type="number"
            value={(config as any).port || 5432}
            onChange={(e) => onChange({ ...config, port: parseInt(e.target.value) })}
          />
          <Input
            placeholder="Username"
            value={(config as any).username || ''}
            onChange={(e) => onChange({ ...config, username: e.target.value })}
          />
          <Input
            placeholder="Password"
            type="password"
            value={(config as any).password || ''}
            onChange={(e) => onChange({ ...config, password: e.target.value })}
          />
          <Input
            placeholder="Database"
            value={(config as any).database || ''}
            onChange={(e) => onChange({ ...config, database: e.target.value })}
          />
        </div>
      );

    case 'mongodb':
      return (
        <div className="space-y-3">
          <Input
            placeholder="Connection String (mongodb://...)"
            type="password"
            value={(config as any).connectionString || ''}
            onChange={(e) => onChange({ ...config, connectionString: e.target.value })}
          />
          <Input
            placeholder="Database Name"
            value={(config as any).database || ''}
            onChange={(e) => onChange({ ...config, database: e.target.value })}
          />
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">Configuration personnalisée</p>;
  }
}

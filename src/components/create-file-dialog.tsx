"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load Monaco Editor
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { 
    ssr: false,
    loading: () => <div className="h-64 bg-zinc-900 flex items-center justify-center text-muted-foreground">Chargement de l'éditeur...</div>
  }
);

interface CreateFileDialogProps {
  projectId: string;
  userId: string;
  onFileCreated?: (fileName: string, filePath: string) => void;
}

export function CreateFileDialog({
  projectId,
  userId,
  onFileCreated,
}: CreateFileDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!fileName.trim()) {
      setError("Le nom du fichier est requis");
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const response = await fetch('/api/console/create-file', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'x-project-id': projectId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: fileName,
          content: content || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const data = await response.json();
      
      // Callback pour mettre à jour la liste des fichiers
      if (onFileCreated) {
        onFileCreated(data.name, data.path);
      }

      // Reset et fermer
      setFileName("");
      setContent("");
      setOpen(false);
      alert("Fichier créé avec succès!");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau fichier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Créer un nouveau fichier</DialogTitle>
          <DialogDescription>
            Créez un nouveau fichier dans votre projet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nom du fichier */}
          <div>
            <label className="text-sm font-medium block mb-2">Chemin du fichier</label>
            <Input
              placeholder="ex: src/components/Button.tsx"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-white/5 border-white/10"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Chemin relatif à la racine du projet
            </p>
          </div>

          {/* Contenu du fichier */}
          <div>
            <label className="text-sm font-medium block mb-2">Contenu</label>
            <div className="border border-white/10 rounded-lg overflow-hidden h-64">
              <MonacoEditor
                height="100%"
                defaultLanguage="typescript"
                theme="vs-dark"
                value={content}
                onChange={(value) => setContent(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !fileName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le fichier
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

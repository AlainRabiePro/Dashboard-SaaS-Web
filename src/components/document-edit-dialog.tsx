import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";

interface DocumentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  document?: any;
  collectionName: string;
  documentId?: string;
  isNewDocument?: boolean;
}

export function DocumentEditDialog({
  isOpen,
  onClose,
  onSave,
  document,
  collectionName,
  documentId,
  isNewDocument = false,
}: DocumentEditDialogProps) {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (document) {
      try {
        setContent(JSON.stringify(document, null, 2));
        setError("");
      } catch (err) {
        setError("Erreur de format JSON");
      }
    } else if (isNewDocument) {
      setContent(JSON.stringify({}, null, 2));
      setError("");
    }
  }, [document, isNewDocument]);

  const handleSave = async () => {
    try {
      setError("");
      
      // Valider le JSON
      const parsedData = JSON.parse(content);
      
      setIsSaving(true);
      await onSave(parsedData);
      
      onClose();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError("JSON invalide: " + err.message);
      } else {
        setError(err.message || "Erreur lors de la sauvegarde");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewDocument ? "Créer un nouveau document" : "Éditer le document"}
          </DialogTitle>
          <DialogDescription>
            Collection: <span className="font-mono text-blue-400">{collectionName}</span>
            {documentId && (
              <>
                {" / "}<span className="font-mono text-pink-400">{documentId}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-900/20 border border-red-500/30 text-red-300 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-xs bg-zinc-900 border-white/10 h-64"
            placeholder="Entrez le JSON..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

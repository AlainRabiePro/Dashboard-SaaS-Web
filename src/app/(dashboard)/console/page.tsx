"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Terminal, 
  Code, 
  AlertCircle, 
  Loader2, 
  Save, 
  Search, 
  X,
  FileCode,
  Bug,
  Clock
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

// Lazy load Monaco Editor
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { 
    ssr: false,
    loading: () => <div className="h-96 bg-zinc-900 flex items-center justify-center text-muted-foreground">Chargement de l'éditeur...</div>
  }
);

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
  stack?: string;
}

interface FileContent {
  name: string;
  content: string;
  language: string;
  path: string;
}

interface Project {
  id: string;
  name: string;
  domain: string;
}

export default function ConsolePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [files, setFiles] = useState<FileContent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("files");
  const editorRef = useRef<any>(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch('/api/console/projects', {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        setProjects(data.projects || []);
        
        // Select first project by default
        if (data.projects?.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user?.uid]);

  // Fetch files when project changes
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid || !selectedProject) return;
      
      setLoading(true);
      try {
        const [logsRes, filesRes] = await Promise.all([
          fetch('/api/console/logs', {
            headers: { 'x-user-id': user.uid, 'x-project-id': selectedProject }
          }),
          fetch('/api/console/files', {
            headers: { 'x-user-id': user.uid, 'x-project-id': selectedProject }
          })
        ]);
        
        const logsData = await logsRes.json();
        const filesData = await filesRes.json();
        
        setLogs(logsData.logs || []);
        setFiles(filesData.files || []);
        
        // Select first file by default
        if (filesData.files?.length > 0) {
          setSelectedFile(filesData.files[0]);
        } else {
          setSelectedFile(null);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh logs every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user?.uid, selectedProject]);

  const handleSaveFile = async () => {
    if (!selectedFile || !user?.uid) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/console/save', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: selectedFile.path,
          content: selectedFile.content
        })
      });

      if (response.ok) {
        // Show success message
        alert('Fichier sauvegardé avec succès!');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      setSelectedFile({
        ...selectedFile,
        content: value
      });
    }
  };

  const handleFindAndReplace = () => {
    if (selectedFile && searchQuery) {
      const regex = new RegExp(searchQuery, 'g');
      const newContent = selectedFile.content.replace(regex, replaceQuery);
      setSelectedFile({
        ...selectedFile,
        content: newContent
      });
    }
  };

  const getLogColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'warn': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'info': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'debug': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'warn': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Code className="h-4 w-4" />;
      case 'debug': return <Bug className="h-4 w-4" />;
      default: return <Terminal className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Console Débuger</h1>
        <p className="text-muted-foreground italic">Éditeur intégré avec syntax highlighting, recherche/remplacement et logs en temps réel.</p>
      </div>

      {/* Project Selector */}
      <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium min-w-fit">Sélectionner un projet:</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full bg-white/5 border-white/10">
                <SelectValue placeholder="Choisir un projet..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/5">
                {projects.length === 0 ? (
                  <div className="p-2 text-muted-foreground text-sm">Aucun projet disponible</div>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedProject && (
              <div className="text-sm text-muted-foreground">
                {projects.find(p => p.id === selectedProject)?.domain}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-950/50 border-white/5">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Éditeur
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Logs & Erreurs
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Éditeur de code</CardTitle>
                  <CardDescription>
                    {selectedFile ? `Édition: ${selectedFile.name}` : "Aucun fichier sélectionné"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReplace(!showReplace)}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Chercher/Remplacer
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveFile}
                    disabled={isSaving || !selectedFile}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File List */}
              <div className="flex gap-2 pb-4 border-b border-white/5 overflow-x-auto">
                {files.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun fichier disponible</p>
                ) : (
                  files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedFile?.path === file.path
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {file.name}
                    </button>
                  ))
                )}
              </div>

              {/* Search/Replace */}
              {showReplace && (
                <div className="space-y-3 p-3 bg-white/5 rounded border border-white/10">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chercher</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Entrez le texte à chercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowReplace(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Remplacer par</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Entrez le texte de remplacement..."
                        value={replaceQuery}
                        onChange={(e) => setReplaceQuery(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                      <Button
                        size="sm"
                        onClick={handleFindAndReplace}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Remplacer
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Monaco Editor */}
              {selectedFile ? (
                <div className="rounded border border-white/10 overflow-hidden">
                  <MonacoEditor
                    height="500px"
                    language={selectedFile.language}
                    value={selectedFile.content}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 13,
                      fontFamily: '"Fira Code", "Courier New", monospace',
                      formatOnPaste: true,
                      formatOnType: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              ) : (
                <div className="h-96 bg-zinc-900 rounded border border-white/10 flex items-center justify-center text-muted-foreground">
                  Sélectionnez un fichier pour commencer
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Errors Summary */}
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle>Erreurs & Avertissements</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs
                    .filter((log) => log.level.toLowerCase() === 'error' || log.level.toLowerCase() === 'warn')
                    .slice(0, 10)
                    .map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded text-sm border ${getLogColor(log.level)}`}
                      >
                        <div className="flex items-start gap-2">
                          {getLogIcon(log.level)}
                          <div className="flex-1">
                            <p className="font-mono">{log.message}</p>
                            <p className="text-xs opacity-75 mt-1">{log.source}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {logs.filter((log) => log.level.toLowerCase() === 'error' || log.level.toLowerCase() === 'warn').length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Aucune erreur</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* All Logs */}
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-blue-500" />
                  <CardTitle>Tous les logs</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded p-3 font-mono text-xs space-y-1 max-h-80 overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div key={idx} className={`${getLogColor(log.level)} flex gap-2`}>
                      <span className="text-gray-500 flex-shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className="flex-shrink-0 font-bold">{log.level.toUpperCase()}</span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-gray-500 text-center py-4">Aucun log disponible</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

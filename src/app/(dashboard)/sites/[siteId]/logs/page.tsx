
"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Site, Log } from "@/lib/firestore-service";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Terminal, 
  RefreshCw, 
  ChevronRight, 
  Loader2,
  Info,
  AlertTriangle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SiteLogsPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const { user } = useAuth();
  const firestore = useFirestore();

  const siteRef = useMemo(() => 
    user ? doc(firestore, "users", user.uid, "sites", siteId) : null, 
    [firestore, user, siteId]
  );

  const logsQuery = useMemo(() => 
    user ? query(
      collection(firestore, "users", user.uid, "sites", siteId, "logs"), 
      orderBy("timestamp", "desc"),
      limit(100)
    ) : null, 
    [firestore, user, siteId]
  );

  const { data: site, loading: siteLoading } = useDoc<Site>(siteRef);
  const { data: logs, loading: logsLoading } = useCollection<Log>(logsQuery);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-3 w-3 text-rose-500" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-amber-500" />;
      default: return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  const getLogLevelClass = (level: string) => {
    switch (level) {
      case 'error': return "text-rose-400";
      case 'warning': return "text-amber-400";
      default: return "text-zinc-400";
    }
  };

  if (siteLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 border border-white/5" asChild>
            <Link href="/sites"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/sites" className="hover:text-foreground">Projets</Link>
              <ChevronRight className="h-3 w-3" />
              <span>{site?.name}</span>
              <ChevronRight className="h-3 w-3" />
              <span>Logs</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Console Temps Réel</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" className="border-white/5 h-9">
          <RefreshCw className="mr-2 h-4 w-4" /> Rafraîchir
        </Button>
      </div>

      <Card className="border-white/5 bg-zinc-950/80 backdrop-blur-xl overflow-hidden font-mono">
        <CardHeader className="bg-white/5 border-b border-white/5 flex flex-row items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">system_logs_stream</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] text-emerald-500/80 font-bold">LIVE</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] w-full bg-black/40">
            <div className="p-4 space-y-1">
              {logsLoading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground text-xs italic">
                  Initialisation du flux de données...
                </div>
              ) : logs.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground text-xs italic">
                  Aucun log disponible pour ce projet.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="group flex items-start gap-4 py-1 hover:bg-white/5 px-2 rounded transition-colors text-[13px] leading-relaxed">
                    <span className="text-zinc-600 shrink-0 min-w-[140px]">
                      [{log.timestamp ? format(log.timestamp.toDate(), "HH:mm:ss.SSS") : "..."}]
                    </span>
                    <span className={cn("font-bold uppercase shrink-0 min-w-[60px]", getLogLevelClass(log.level))}>
                      {log.level}
                    </span>
                    <span className="text-emerald-500/70 shrink-0 min-w-[80px]">
                      @{log.source}
                    </span>
                    <span className="text-zinc-300 break-all flex-1">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-950/50 border-white/5 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Info</p>
            <p className="text-xl font-bold">{logs.filter(l => l.level === 'info').length}</p>
          </div>
        </Card>
        <Card className="bg-zinc-950/50 border-white/5 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Warning</p>
            <p className="text-xl font-bold">{logs.filter(l => l.level === 'warning').length}</p>
          </div>
        </Card>
        <Card className="bg-zinc-950/50 border-white/5 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Error</p>
            <p className="text-xl font-bold">{logs.filter(l => l.level === 'error').length}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

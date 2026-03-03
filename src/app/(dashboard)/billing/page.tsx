
"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserProfile, Invoice } from "@/lib/firestore-service";
import { format } from "date-fns";
import { FileDown, CreditCard, Loader2, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const invoicesQuery = useMemo(() => 
    user ? query(collection(firestore, "users", user.uid, "invoices"), orderBy("date", "desc")) : null
  , [firestore, user]);

  const { data: profile } = useDoc<UserProfile>(profileRef);
  const { data: invoices, loading } = useCollection<Invoice>(invoicesQuery);

  const getPlanPrice = (plan: string | undefined) => {
    switch (plan) {
      case 'Starter': return '$4.99';
      case 'Professional': return '$9.99';
      case 'Enterprise': return '$16.99';
      default: return '$9.99';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturation</h1>
        <p className="text-muted-foreground">Gérez vos abonnements, modes de paiement et téléchargez vos factures.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Historique des factures</CardTitle>
            <CardDescription>Consultez vos récents relevés de compte.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Montant</TableHead>
                  <TableHead className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase font-bold tracking-widest text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Chargement des factures...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-sm">
                        {inv.date ? format(inv.date.toDate(), "MMMM dd, yyyy") : "..."}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">${inv.amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="hover:bg-white/10 h-8">
                          <FileDown className="mr-2 h-4 w-4" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                      Aucune facture trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 border border-white/5 bg-zinc-900/50 rounded-xl">
                <div className="h-10 w-12 bg-zinc-800 rounded-md flex items-center justify-center font-bold text-[10px] text-zinc-400">VISA</div>
                <div className="flex-1">
                  <p className="text-xs font-bold">•••• 4242</p>
                  <p className="text-[10px] text-muted-foreground">Expire 12/26</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs hover:bg-white/10 h-8">Editer</Button>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs border-white/5 text-destructive hover:bg-destructive/10">
                Résilier mon abonnement
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
             <CardHeader className="pb-3">
               <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Aperçu du Plan</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-1">
                 <p className="text-xl font-bold">{profile?.plan || "Chargement..."} Plan</p>
                 <p className="text-xs text-muted-foreground italic">Prochaine facturation le 01 Avril 2024</p>
               </div>
               
               <Button className="w-full font-bold text-xs uppercase tracking-widest" asChild>
                 <Link href="/storage">
                   <Sparkles className="mr-2 h-3 w-3" /> Upgrade Maintenant
                 </Link>
               </Button>
               
               <div className="pt-4 border-t border-primary/10 space-y-3">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <Calendar className="h-3 w-3" /> Prochaines échéances
                 </p>
                 <div className="space-y-2">
                   <div className="flex justify-between text-xs">
                     <span className="text-muted-foreground">01 Mai 2024</span>
                     <span className="font-semibold">{getPlanPrice(profile?.plan)}</span>
                   </div>
                   <div className="flex justify-between text-xs">
                     <span className="text-muted-foreground">01 Juin 2024</span>
                     <span className="font-semibold">{getPlanPrice(profile?.plan)}</span>
                   </div>
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

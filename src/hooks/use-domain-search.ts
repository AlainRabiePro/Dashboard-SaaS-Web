import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './use-toast';

interface DomainSearchResult {
  domain: string;
  available: boolean | null;
  error?: string;
  checked_at?: string;
  extension: string;
  price: number;
}

interface DomainOrder {
  id: string;
  domain: string;
  price: number;
  status: 'pending' | 'paid' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

const POPULAR_EXTENSIONS = ['.com', '.fr', '.net', '.org', '.co', '.io', '.dev', '.app', '.online', '.site'];

const EXTENSION_PRICES: Record<string, number> = {
  '.com': 8.99,
  '.fr': 5.99,
  '.co': 10.99,
  '.io': 15.99,
  '.dev': 12.99,
  '.app': 11.99,
  '.online': 7.99,
  '.site': 6.99,
  '.net': 7.99,
  '.org': 6.99,
};

export function useDomainSearch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const getPrice = (extension: string): number => EXTENSION_PRICES[extension] || 9.99;

  // Recherche multi-extensions
  const searchDomainVariations = async (keyword: string): Promise<DomainSearchResult[]> => {
    if (!keyword.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un mot-clé',
        variant: 'destructive',
      });
      return [];
    }

    setSearchLoading(true);
    try {
      // Construire les promesses pour toutes les extensions
      const promises = POPULAR_EXTENSIONS.map(ext => {
        const fullDomain = keyword.toLowerCase().trim() + ext;
        return fetch(`/api/domains/search?domain=${encodeURIComponent(fullDomain)}`)
          .then(res => res.json())
          .then(data => ({
            ...data,
            extension: ext,
            price: getPrice(ext),
          } as DomainSearchResult))
          .catch(() => ({
            domain: fullDomain,
            available: null,
            error: 'Impossible de vérifier',
            extension: ext,
            price: getPrice(ext),
          }));
      });

      const results = await Promise.all(promises);
      
      // Trier : disponibles d'abord, puis par prix croissant
      const sorted = results.sort((a, b) => {
        if (a.available === b.available) {
          return a.price - b.price;
        }
        return a.available ? -1 : 1;
      });

      setSearchResults(sorted);
      return sorted;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur s\'est produite',
        variant: 'destructive',
      });
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  const orderDomain = async (domain: string, price: number): Promise<boolean> => {
    // Attendre que l'utilisateur soit chargé
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour commander un domaine',
        variant: 'destructive',
      });
      return false;
    }

    if (!user.uid) {
      toast({
        title: 'Erreur',
        description: 'ID utilisateur manquant',
        variant: 'destructive',
      });
      return false;
    }

    setSearchLoading(true);
    try {
      const response = await fetch('/api/domains/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          domain,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible de commander le domaine',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Succès',
        description: `Commande créée pour ${domain}. Statut: ${data.status}`,
      });

      await fetchOrders();
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur s\'est produite',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user?.uid) return;
    setOrdersLoading(true);
    try {
      const response = await fetch('/api/domains/order', {
        headers: {
          'x-user-id': user.uid,
        },
      });
      if (!response.ok) throw new Error('Impossible de récupérer les commandes');

      const data = await response.json();
      const ordersData = (data.orders || []).map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        expiresAt: new Date(order.expiresAt),
      }));
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Erreur:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  return {
    searchDomainVariations,
    searchLoading,
    searchResults,
    orderDomain,
    fetchOrders,
    orders,
    ordersLoading,
  };
}

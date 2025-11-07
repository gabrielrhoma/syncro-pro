import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
  code: string;
}

interface StoreContextType {
  currentStore: Store | null;
  availableStores: Store[];
  setCurrentStore: (store: Store) => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStores();
  }, []);

  const loadUserStores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar lojas do usuário
      const { data: userStores, error } = await supabase
        .from('user_stores')
        .select('store_id, stores(id, name, code), is_default')
        .eq('user_id', user.id);

      if (error) throw error;

      if (userStores && userStores.length > 0) {
        const stores = userStores
          .map(us => us.stores)
          .filter(Boolean) as Store[];
        
        setAvailableStores(stores);

        // Definir loja padrão
        const defaultStore = userStores.find(us => us.is_default);
        if (defaultStore && defaultStore.stores) {
          setCurrentStoreState(defaultStore.stores as Store);
        } else {
          setCurrentStoreState(stores[0]);
        }
      } else {
        // Se não tiver lojas vinculadas, buscar primeira loja disponível
        const { data: allStores } = await supabase
          .from('stores')
          .select('id, name, code')
          .eq('active', true)
          .limit(1);

        if (allStores && allStores.length > 0) {
          setAvailableStores(allStores);
          setCurrentStoreState(allStores[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      toast.error('Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  const setCurrentStore = (store: Store) => {
    setCurrentStoreState(store);
    localStorage.setItem('currentStoreId', store.id);
  };

  return (
    <StoreContext.Provider value={{ currentStore, availableStores, setCurrentStore, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
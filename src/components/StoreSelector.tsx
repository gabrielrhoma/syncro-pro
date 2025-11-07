import { useStore } from '@/contexts/StoreContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store } from 'lucide-react';

export function StoreSelector() {
  const { currentStore, availableStores, setCurrentStore, loading } = useStore();

  if (loading || availableStores.length === 0) {
    return null;
  }

  // Se só tem uma loja, não mostra o seletor
  if (availableStores.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        <span>{currentStore?.name}</span>
      </div>
    );
  }

  return (
    <Select
      value={currentStore?.id}
      onValueChange={(storeId) => {
        const store = availableStores.find(s => s.id === storeId);
        if (store) setCurrentStore(store);
      }}
    >
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableStores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name} ({store.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
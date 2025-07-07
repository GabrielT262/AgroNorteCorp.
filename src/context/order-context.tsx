
'use client';

import * as React from 'react';
import type { OrderItem, InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface OrderContextType {
  orderItems: OrderItem[];
  addItem: (item: InventoryItem, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemDetails: (itemId: string, details: Partial<Omit<OrderItem, 'item_id' | 'name' | 'quantity' | 'unit' | 'category'>>) => void;
  clearOrder: () => void;
  isSheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}

const OrderContext = React.createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
  const [isSheetOpen, setSheetOpen] = React.useState(false);
  const { toast } = useToast();

  const addItem = (item: InventoryItem, quantity: number) => {
    if (quantity <= 0) return;

    const totalStock = item.batches.reduce((sum, batch) => sum + batch.stock, 0);
    const existingItem = orderItems.find((i) => i.item_id === item.id);
    const newQuantity = (existingItem?.quantity || 0) + quantity;

    if (newQuantity > totalStock) {
      toast({
        title: "Stock Insuficiente",
        description: `No puedes solicitar más de ${totalStock} ${item.unit} de ${item.name}.`,
        variant: "destructive",
      });
      return;
    }

    if (existingItem) {
        setOrderItems(prevItems => prevItems.map(i => i.item_id === item.id ? { ...i, quantity: newQuantity } : i));
    } else {
        setOrderItems(prevItems => [...prevItems, { 
            item_id: item.id, 
            name: item.name, 
            quantity, 
            unit: item.unit, 
            category: item.category,
            area: undefined,
            cost_center: '',
            cultivo: undefined,
            observations: '',
        }]);
    }

    toast({
      title: "Artículo Añadido",
      description: `${quantity} x ${item.name} añadido(s) a tu solicitud.`,
    });
  };
  
  const updateItemQuantity = (itemId: string, quantity: number) => {
    setOrderItems((prevItems) => {
        if (quantity <= 0) {
            return prevItems.filter((i) => i.item_id !== itemId);
        }
        return prevItems.map((i) =>
            i.item_id === itemId ? { ...i, quantity } : i
        );
    });
  };

  const updateItemDetails = (itemId: string, details: Partial<Omit<OrderItem, 'item_id' | 'name' | 'quantity' | 'unit' | 'category'>>) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.item_id === itemId ? { ...item, ...details } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setOrderItems((prevItems) => prevItems.filter((i) => i.item_id !== itemId));
  };
  
  const clearOrder = () => {
      setOrderItems([]);
  }

  return (
    <OrderContext.Provider value={{ orderItems, addItem, removeItem, updateItemQuantity, updateItemDetails, clearOrder, isSheetOpen, setSheetOpen }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = React.useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

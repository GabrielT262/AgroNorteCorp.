
'use client';

import * as React from 'react';
import type { OrderItem, InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface OrderContextType {
  orderItems: OrderItem[];
  addItem: (item: InventoryItem, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemUsageDescription: (itemId: string, description: string) => void;
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

    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.itemId === item.id);
      const newQuantity = (existingItem?.quantity || 0) + quantity;

      if (newQuantity > item.stock) {
        toast({
          title: "Stock Insuficiente",
          description: `No puedes solicitar más de ${item.stock} ${item.unit} de ${item.name}.`,
          variant: "destructive",
        });
        return prevItems;
      }
      
      toast({
        title: "Artículo Añadido",
        description: `${quantity} x ${item.name} añadido(s) a tu solicitud.`,
      });

      if (existingItem) {
        return prevItems.map((i) =>
          i.itemId === item.id ? { ...i, quantity: newQuantity } : i
        );
      }
      return [...prevItems, { 
        itemId: item.id, 
        name: item.name, 
        quantity, 
        unit: item.unit, 
        stock: item.stock, 
        category: item.category,
        usageDescription: '',
      }];
    });
  };
  
  const updateItemQuantity = (itemId: string, quantity: number) => {
    setOrderItems((prevItems) => {
       const itemToUpdate = prevItems.find((i) => i.itemId === itemId);
       if (!itemToUpdate) return prevItems;

       if (quantity > itemToUpdate.stock) {
         toast({
          title: "Stock Insuficiente",
          description: `No puedes solicitar más de ${itemToUpdate.stock} ${itemToUpdate.unit}.`,
          variant: "destructive",
         });
         return prevItems.map((i) =>
            i.itemId === itemId ? { ...i, quantity: itemToUpdate.stock } : i
         );
       }

       if (quantity <= 0) {
         return prevItems.filter((i) => i.itemId !== itemId);
       }

       return prevItems.map((i) =>
         i.itemId === itemId ? { ...i, quantity } : i
       );
    });
  };

  const updateItemUsageDescription = (itemId: string, description: string) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.itemId === itemId ? { ...item, usageDescription: description } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setOrderItems((prevItems) => prevItems.filter((i) => i.itemId !== itemId));
  };
  
  const clearOrder = () => {
      setOrderItems([]);
  }

  return (
    <OrderContext.Provider value={{ orderItems, addItem, removeItem, updateItemQuantity, updateItemUsageDescription, clearOrder, isSheetOpen, setSheetOpen }}>
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

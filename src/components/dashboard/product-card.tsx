
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/lib/types';
import { Minus, Plus, ShoppingCart, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useOrder } from '@/context/order-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductCardProps {
  item: InventoryItem;
  canManage: boolean;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductCard({ item, canManage, onViewDetails, onEdit, onDelete }: ProductCardProps) {
  const { addItem } = useOrder();
  const [quantity, setQuantity] = React.useState(1);
  const isDecimalAllowed = item.category === 'Agroquímicos' || item.category === 'Fertilizantes';

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity(0); // Treat empty string as 0 for validation, but show empty in input
      return;
    }
    const numValue = Number(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
        setQuantity(numValue);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const numericValue = Number(event.target.value);
    if (numericValue > 0 && numericValue <= 2) {
      event.target.select();
    }
  };

  const increment = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decrement = () => {
    setQuantity(prev => Math.max(0, prev - 1));
  };

  const handleAddClick = () => {
    if (quantity > 0) {
      addItem(item, quantity);
      setQuantity(1); // Reset after adding
    }
  };

  const statusVariant = {
    "En Stock": "default",
    "Poco Stock": "secondary",
    "Agotado": "destructive",
  } as const;

  return (
    <Card className="flex flex-col relative group">
       {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/50 hover:bg-black/75 text-white hover:text-white">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Borrar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <CardHeader className="p-4">
        <button className="aspect-square relative w-full bg-muted rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={onViewDetails}>
          <Image
            src={item.images?.[0] || 'https://placehold.co/400x400.png'}
            alt={item.name}
            fill
            className="object-cover"
            data-ai-hint={item.aiHint}
          />
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <Badge variant={statusVariant[item.status]} className="mb-2">{item.status}</Badge>
        <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{item.area}</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">{item.id}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Stock: {item.stock} {item.unit}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex-col items-start gap-4">
        <div className="flex items-center gap-2 w-full">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={decrement} disabled={item.status === 'Agotado'}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input 
            type="number"
            className="h-10 text-center text-sm" 
            value={quantity || ''} 
            onChange={handleQuantityChange}
            onFocus={handleFocus}
            min="0"
            step={isDecimalAllowed ? "0.01" : "1"}
            disabled={item.status === 'Agotado'}
            placeholder="0"
          />
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={increment} disabled={item.status === 'Agotado'}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button className="w-full" onClick={handleAddClick} disabled={item.status === 'Agotado' || quantity <= 0}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Añadir al Pedido
        </Button>
      </CardFooter>
    </Card>
  );
}

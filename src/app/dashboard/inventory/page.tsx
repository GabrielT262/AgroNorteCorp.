import type { InventoryItem } from '@/lib/types';
import { InventoryClient } from '@/components/dashboard/inventory-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { getInventoryItems } from '@/lib/db';

const InventoryPageSkeleton = () => (
    <div className="flex flex-col h-full">
         <header className="bg-background p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <Skeleton className="h-10 w-1/4" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
             <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[240px]" />
            </div>
         </header>
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
                <Card key={i}>
                    <div className="p-4">
                        <Skeleton className="aspect-square w-full" />
                    </div>
                    <div className="p-4 pt-0 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </Card>
            ))}
        </div>
    </div>
);


export default async function InventoryPage() {
  // Se obtienen los datos de la base de datos de Supabase.
  const inventory: InventoryItem[] = await getInventoryItems();

  return (
    <div className="h-full">
      <Suspense fallback={<InventoryPageSkeleton />}>
        <InventoryClient inventory={inventory} />
      </Suspense>
    </div>
  );
}

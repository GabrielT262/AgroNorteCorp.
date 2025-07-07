
'use client';

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryItem, InventoryCategory, UserRole, UserArea, InventoryCultivo, InventoryUnit, InventoryHistoryEntry, ManagedUser } from "@/lib/types";
import { CreateProductDialog } from "@/components/dashboard/create-product-dialog";
import { ProductDetailDialog } from "@/components/dashboard/product-detail-dialog";
import { PlusCircle, Search, Upload, Download, History, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "@/components/dashboard/product-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { InventoryHistoryDialog } from "./inventory-history-dialog";
import { deleteProductAction, importInventoryAction } from "@/app/actions/inventory-actions";
import { AddStockDialog } from "./add-stock-dialog";


interface InventoryClientProps {
  inventory: InventoryItem[];
  history: InventoryHistoryEntry[];
  currentUser: ManagedUser;
}

export function InventoryClient({ inventory, history, currentUser }: InventoryClientProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("q") || "");
  const [category, setCategory] = React.useState("Todos");
  const [area, setArea] = React.useState("Todos");
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isAddStockDialogOpen, setAddStockDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = React.useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<InventoryItem | null>(null);
  const [isHistoryDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [isImporting, startImportTransition] = React.useTransition();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const canManageProductsRoles: UserRole[] = ['Logística', 'Almacén', 'Administrador'];
  const canViewHistoryRoles: UserRole[] = ['Gerencia', 'Logística', 'Almacén', 'Administrador'];
  
  const canManageProducts = canManageProductsRoles.includes(currentUser.role);
  const canViewHistory = canViewHistoryRoles.includes(currentUser.role);

  React.useEffect(() => {
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  const filteredInventory = React.useMemo(() => {
    return inventory.filter((item) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchTerm) || item.id.toLowerCase().includes(searchTerm);
      const matchesCategory = category === "Todos" || item.category === category;
      const matchesArea = area === "Todos" || item.area === area;
      return matchesSearch && matchesCategory && matchesArea;
    });
  }, [inventory, search, category, area]);

  const categories: ("Todos" | InventoryCategory)[] = ["Todos", "Herramientas", "Repuestos", "Fertilizantes", "Agroquímicos", "Varios", "Implementos de Riego", "Implementos de SST"];
  const areas: ("Todos" | UserArea)[] = ["Todos", 'Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];

  const handleOpenCreateDialog = () => {
    setEditingItem(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setViewingItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    const result = await deleteProductAction(deletingItem.id);

    if (result.success) {
      toast({
        title: "Producto Eliminado",
        description: `El producto "${deletingItem.name}" ha sido eliminado.`,
      });
    } else {
      toast({
        title: "Error al eliminar",
        description: result.message || "No se pudo eliminar el producto de la base de datos.",
        variant: "destructive",
      });
    }
    
    setDeletingItem(null);
  };
  
  const closeProductDialog = () => {
    setEditingItem(null);
    setCreateDialogOpen(false);
  }

  const handleExport = () => {
    const dataToExport = inventory.flatMap(item => 
        item.batches.map(batch => ({
            'SKU': item.id,
            'Nombre': item.name,
            'Categoría': item.category,
            'Área': item.area,
            'Ubicación': item.location,
            'Lote ID': batch.id,
            'Stock Lote': batch.stock,
            'Unidad': item.unit,
            'Fecha de Vencimiento Lote': batch.expiry_date || '',
        }))
    );
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario por Lotes");
    XLSX.writeFile(workbook, "inventario_por_lotes.xlsx");
    toast({
        title: "Exportación Completa",
        description: "El inventario por lotes ha sido exportado.",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startImportTransition(async () => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          const result = await importInventoryAction(json);

          if (result.success) {
            toast({
              title: "Importación Exitosa",
              description: `Se procesaron ${result.processed} productos. ${result.created} creados, ${result.updated} actualizados.`,
            });
          } else {
            toast({
              title: `Importación completada con ${result.errors} errores`,
              description: result.message,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          toast({
            title: "Error de Archivo",
            description: "No se pudo leer o procesar el archivo Excel.",
            variant: "destructive",
          });
        }
      };
      reader.readAsBinaryString(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <header className="bg-background p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Inventario</h1>
                    <p className="text-muted-foreground">Añade productos a tu solicitud de pedido.</p>
                </div>
                 <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
                    {canViewHistory && (
                      <>
                        <Button variant="outline" onClick={() => setHistoryDialogOpen(true)}>
                            <History className="mr-2 h-4 w-4" />
                            Historial
                        </Button>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                      </>
                    )}
                     {canManageProducts && (
                      <>
                        <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
                          {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          Importar
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileImport}
                          className="hidden" 
                          accept=".xlsx, .xls, .csv"
                        />
                        <Button variant="outline" onClick={() => setAddStockDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Stock
                        </Button>
                        <Button onClick={handleOpenCreateDialog}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Producto
                        </Button>
                      </>
                     )}
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nombre o SKU..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select onValueChange={setCategory} defaultValue="Todos">
                    <SelectTrigger className="w-full sm:w-[240px]">
                        <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat === 'Todos' ? 'Todas las categorías' : cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select onValueChange={setArea} defaultValue="Todos">
                    <SelectTrigger className="w-full sm:w-[240px]">
                        <SelectValue placeholder="Filtrar por área" />
                    </SelectTrigger>
                    <SelectContent>
                        {areas.map(area => (
                            <SelectItem key={area} value={area}>{area === 'Todos' ? 'Todas las áreas' : area}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </header>
        
        <ScrollArea className="flex-1">
            <div className="p-4 sm:p-6">
                 {filteredInventory.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredInventory.map((item) => (
                          <ProductCard 
                            key={item.id} 
                            item={item} 
                            canManage={canManageProducts}
                            onViewDetails={() => setViewingItem(item)}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => setDeletingItem(item)}
                          />
                        ))}
                    </div>
                    ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                        <h3 className="text-2xl font-semibold">No se encontraron resultados</h3>
                        <p className="text-muted-foreground mt-2">Intenta con otra búsqueda o filtro.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </div>
      <CreateProductDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={closeProductDialog}
      />
      <AddStockDialog
        isOpen={isAddStockDialogOpen}
        onOpenChange={setAddStockDialogOpen}
        inventory={inventory}
      />
      <ProductDetailDialog 
        item={viewingItem}
        isOpen={!!viewingItem}
        onOpenChange={(open) => {
            if(!open) setViewingItem(null)
        }}
      />
      <InventoryHistoryDialog 
        history={history}
        isOpen={isHistoryDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />
       <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{deletingItem?.name}" y todos sus lotes del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingItem(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

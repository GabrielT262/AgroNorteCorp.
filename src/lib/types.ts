

export type UserRole = 'Administrador' | 'Usuario';

export type UserArea =
  | 'Gerencia'
  | 'Logística'
  | 'RR.HH'
  | 'Seguridad Patrimonial'
  | 'Almacén'
  | 'Taller'
  | 'Producción'
  | 'Sanidad'
  | 'SS.GG'
  | 'Administrador';

export interface User {
  name: string;
  role: UserRole;
  area: UserArea;
}

export type InventoryCategory =
  | 'Herramientas'
  | 'Repuestos'
  | 'Fertilizantes'
  | 'Agroquímicos'
  | 'Varios'
  | 'Implementos de Riego'
  | 'Implementos de SST';

export type InventoryUnit = 'Unidad' | 'Kg' | 'Litros' | 'Metros';
export type InventoryCultivo = 'Uva' | 'Palto';

export interface InventoryItem {
  id: string; // SKU
  name: string;
  description: string;
  category: InventoryCategory;
  area: UserArea;
  cultivo?: InventoryCultivo;
  location: string;
  stock: number;
  unit: InventoryUnit;
  expiryDate?: string; // Formato YYYY-MM-DD, opcional
  status: 'En Stock' | 'Poco Stock' | 'Agotado';
  images: string[];
  aiHint: string;
  technicalSheetUrl?: string; // URL to PDF
  remissionGuideUrl?: string; // URL to PDF
}


export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  stock: number;
  category: InventoryCategory;
  usageDescription?: string;
}

export interface RecentOrder {
  id: string;
  date: string; // ISO String
  items: OrderItem[];
  status: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Despachado';
  requestingArea: UserArea;
  requestingUserName: string;
  requestingUserSignatureUrl?: string;
  costCenter?: string;
  cultivo?: InventoryCultivo;
  observations?: string;
}

export interface ExpiringProduct {
  name: string;
  expiresIn: string;
  stock: number;
}

export interface InventoryHistoryEntry {
  id: string;
  date: string; // ISO String
  productName: string;
  productId: string;
  type: 'Entrada' | 'Salida';
  quantity: number;
  unit: InventoryUnit;
  requestingArea: UserArea;
  user: string;
}

export interface Communication {
    id: string;
    title: string;
    description: string;
    date: string; // ISO String
    authorName: string;
    images: string[];
    aiHint?: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  recipientArea: UserArea | 'Gerencia' | 'All';
  path?: string;
  communicationId?: string;
}

export type FuelType = 'Gasolina' | 'Petróleo';
export type Shift = 'Día' | 'Noche';
export type VehicleType = 'Tractor' | 'Camión' | 'Camioneta' | 'Moto Lineal';

export interface FuelDispatchFormValues {
    area: UserArea;
    user: string;
    fuelType: FuelType;
    shift: Shift;
    vehicleType: VehicleType;
    horometro?: number;
    kilometraje?: number;
    quantity: number;
}

export interface FuelHistoryEntry {
    id: string;
    date: string; // ISO string
    type: 'Abastecimiento' | 'Consumo';
    fuelType: FuelType;
    quantity: number;
    area?: UserArea;
    user?: string;
    vehicleType?: VehicleType;
    registeredBy: string;
}

export interface RegisteredVehicle {
  id: string;
  employeeName: string;
  employeeArea: UserArea;
  vehicleType: string;
  vehicleModel: string;
  vehiclePlate: string;
}

export interface SecurityReport {
  id: string;
  date: string; // ISO String
  title: string;
  description: string;
  type: 'Incidente' | 'Novedad' | 'Solicitud de Permiso' | 'Ingreso de Proveedor' | 'Ingreso Vehículo Trabajador';
  author: string;
  photos: string[];
  status: 'Abierto' | 'Cerrado' | 'Aprobación Pendiente' | 'Aprobado' | 'Rechazado';
  meta?: {
    targetArea?: 'Gerencia' | 'Almacén';
    details?: string;
  };
}

export interface GalleryPost {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorArea: UserArea;
  date: string; // ISO String
  images: string[];
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  aiHint?: string;
}

export interface ManagedUser {
  id: string;
  username: string;
  name: string;
  lastName: string;
  email: string;
  role: UserRole;
  area: UserArea;
  password?: string;
  signatureUrl?: string;
}

export interface CompanySettings {
  logoUrl: string;
  loginBackgroundUrl: string;
  supportWhatsApp: string;
}

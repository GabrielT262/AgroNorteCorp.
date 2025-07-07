

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

export interface Batch {
  id: string; // Lote ID
  stock: number;
  expiry_date?: string; // Formato YYYY-MM-DD
}

export interface InventoryItem {
  id: string; // SKU
  name: string;
  description: string;
  category: InventoryCategory;
  area: UserArea;
  cultivo?: InventoryCultivo;
  location: string;
  unit: InventoryUnit;
  ai_hint: string;
  images: string[];
  technical_sheet_url?: string;
  batches: Batch[];
}


export interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  category: InventoryCategory;
  area?: UserArea;
  cost_center?: string;
  cultivo?: InventoryCultivo;
  observations?: string;
}

export interface RecentOrder {
  id: string;
  date: string; // ISO String
  items: OrderItem[];
  status: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Despachado';
  requesting_area: UserArea;
  requesting_user_id: string;
  users?: { // From join
    name: string;
    last_name: string;
  }
}

export interface ExpiringProduct {
  name: string;
  expires_in: string; // Renamed from expiresIn for consistency
  stock: number;
  lote_id: string;
}

export interface InventoryHistoryEntry {
  id: string;
  date: string; // ISO String
  product_name: string;
  product_id: string;
  type: 'Entrada' | 'Salida';
  quantity: number;
  unit: InventoryUnit;
  requesting_area: UserArea;
  user_id: string;
  order_id?: string;
  lote_id?: string;
   users?: { // From join
    name: string;
    last_name: string;
  }
}

export interface Communication {
    id: string;
    title: string;
    description: string;
    date: string; // ISO String
    author_id: string;
    ai_hint?: string;
    users?: { // From join
        name: string;
        last_name: string;
    }
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  description: string;
  path?: string;
  is_read: boolean;
  created_at: string; // ISO string
}

export type FuelType = 'Gasolina' | 'Petróleo';
export type Shift = 'Día' | 'Noche';
export type VehicleType = 'Tractor' | 'Camión' | 'Camioneta' | 'Moto Lineal';

export interface FuelDispatchFormValues {
    area: UserArea;
    user_name: string;
    fuel_type: FuelType;
    shift: Shift;
    vehicle_type: VehicleType;
    vehicle_model?: string;
    horometro?: number;
    kilometraje?: number;
    quantity: number;
}

export interface FuelHistoryEntry {
    id: string;
    date: string; // ISO string
    type: 'Abastecimiento' | 'Consumo';
    fuel_type: FuelType;
    quantity: number;
    area?: UserArea;
    user_name?: string;
    vehicle_type?: VehicleType;
    vehicle_model?: string;
    registered_by_id: string;
    horometro?: number;
    kilometraje?: number;
    users?: { // From join for registered_by_id
        name: string;
        last_name: string;
    }
}

export interface RegisteredVehicle {
  id: string;
  employee_id: string;
  employee_area: UserArea;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
   users?: { // From join
    name: string;
    last_name: string;
  }
}

export interface SecurityReport {
  id: string;
  date: string; // ISO String
  title: string;
  description: string;
  type: 'Incidente' | 'Novedad' | 'Solicitud de Permiso' | 'Ingreso de Proveedor' | 'Ingreso Vehículo Trabajador';
  author_id: string;
  status: 'Abierto' | 'Cerrado' | 'Aprobación Pendiente' | 'Aprobado' | 'Rechazado';
  meta?: {
    targetArea?: 'Gerencia' | 'Almacén';
    details?: string;
  };
  photos?: string[];
  users?: { // From join
    name: string;
    last_name: string;
  }
}

export interface GalleryPost {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author_area: UserArea;
  date: string; // ISO String
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  ai_hint?: string;
  images: string[];
  users?: { // From join
    name: string;
    last_name: string;
  }
}

export interface ManagedUser {
  id: string;
  username: string;
  name: string;
  last_name: string;
  email: string;
  role: UserRole;
  area: UserArea;
  password?: string;
  status: 'pending' | 'active';
  avatar_url?: string | null;
  signature_url?: string | null;
}

export interface CompanySettings {
  id: number;
  support_whats_app: string | null;
  logo_url?: string | null;
  login_bg_url?: string | null;
}

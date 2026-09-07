export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'DELIVERY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
  branch?: string;
  active: boolean;
  pin?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  lastOrderAt?: string;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
}

export interface ProductExtra {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  costPrice: number;
  categoryId: string;
  image: string;
  isAvailable: boolean;
  isPopular?: boolean;
  isNewArrival?: boolean;
  hasSpicyOption?: boolean;
  extras?: ProductExtra[];
}

export type OrderType = 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY' | 'WEBSITE';

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItemExtra {
  id: string;
  nameAr: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  spicyChoice?: 'NORMAL' | 'SPICY';
  extras?: OrderItemExtra[];
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  tableNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryLocation?: {
    lat: number;
    lng: number;
  };
  deliveryInstructions?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentStatus: 'PAID' | 'UNPAID';
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
  cashierName?: string;
  createdAt: string;
  updatedAt: string;
  printedCount: number;
  lastPrintedAt?: string;
}

export interface PrintJob {
  id: string;
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  slipsCount: number;
  slips: ('CUSTOMER' | 'KITCHEN')[];
  status: 'PENDING' | 'PRINTED' | 'FAILED';
  idempotencyKey: string;
  createdAt: string;
  printedAt?: string;
  content: string;
}

export interface DeliveryEmployee {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
  isAvailable: boolean;
  currentOrderId?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
}

export interface InventoryItem {
  id: string;
  nameAr: string;
  nameEn: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  supplier?: string;
  lastRestockedAt?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdByName: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actorName: string;
  role: string;
  details: string;
  timestamp: string;
}

export interface ScreenPasswords {
  pos: string;
  kitchen?: string;
  delivery: string;
  admin: string;
}

export interface RestaurantSettings {
  restaurantNameAr: string;
  restaurantNameEn: string;
  hotline: string;
  addressAr: string;
  addressEn: string;
  branchLocation: {
    lat: number;
    lng: number;
  };
  taxRate: number;
  defaultDeliveryFee: number;
  currencySymbolAr: string;
  currencySymbolEn: string;
  paperRules: {
    dineInSlips: number;
    takeAwaySlips: number;
    deliverySlips: number;
  };
  autoPrintEnabled: boolean;
  audioAlertsEnabled: boolean;
  screenPasswords?: ScreenPasswords;
}

export interface WhatsAppTemplate {
  id: string;
  key: OrderStatus | 'THANK_YOU';
  titleAr: string;
  body: string;
}

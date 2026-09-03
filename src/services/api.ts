import {
  Category,
  Product,
  Customer,
  Order,
  OrderStatus,
  OrderType,
  PrintJob,
  DeliveryEmployee,
  InventoryItem,
  Expense,
  ActivityLog,
  RestaurantSettings,
  WhatsAppTemplate,
} from '../types';

const BASE_URL = '/api';

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/categories`);
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/products`);
  return res.json();
}

export async function createProduct(prod: Partial<Product>, actorName?: string): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...prod, actorName }),
  });
  return res.json();
}

export async function updateProduct(id: string, prod: Partial<Product>, actorName?: string): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...prod, actorName }),
  });
  return res.json();
}

export async function toggleProductAvailability(id: string, actorName?: string): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${id}/toggle-availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actorName }),
  });
  return res.json();
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${BASE_URL}/customers`);
  return res.json();
}

export async function fetchCustomerByPhone(phone: string): Promise<Customer | null> {
  const res = await fetch(`${BASE_URL}/customers/by-phone/${encodeURIComponent(phone)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/orders`);
  return res.json();
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  const res = await fetch(`${BASE_URL}/orders/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function createOrder(payload: {
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryLocation?: { lat: number; lng: number };
  deliveryInstructions?: string;
  tableNumber?: string;
  items: Order['items'];
  discount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE';
  cashierName?: string;
}): Promise<{ order: Order; printJob: PrintJob }> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, actorName?: string): Promise<Order> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actorName }),
  });
  return res.json();
}

export async function assignDeliveryDriver(orderId: string, driverId: string, actorName?: string): Promise<Order> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, actorName }),
  });
  return res.json();
}

export async function updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
  await fetch(`${BASE_URL}/delivery/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, lat, lng }),
  });
}

export async function fetchDeliveryStaff(): Promise<DeliveryEmployee[]> {
  const res = await fetch(`${BASE_URL}/delivery/staff`);
  return res.json();
}

export async function completePrintJob(jobId: string, idempotencyKey: string): Promise<PrintJob> {
  const res = await fetch(`${BASE_URL}/print-jobs/${jobId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idempotencyKey }),
  });
  return res.json();
}

export async function reprintOrder(orderId: string, actorName?: string): Promise<PrintJob> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/reprint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actorName }),
  });
  return res.json();
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const res = await fetch(`${BASE_URL}/inventory`);
  return res.json();
}

export async function updateInventoryStock(id: string, currentStock: number, note?: string): Promise<InventoryItem> {
  const res = await fetch(`${BASE_URL}/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentStock, note }),
  });
  return res.json();
}

export async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetch(`${BASE_URL}/expenses`);
  return res.json();
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const res = await fetch(`${BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  return res.json();
}

export async function fetchSettings(): Promise<RestaurantSettings> {
  const res = await fetch(`${BASE_URL}/settings`);
  return res.json();
}

export async function updateSettings(settings: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function fetchWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const res = await fetch(`${BASE_URL}/whatsapp/templates`);
  return res.json();
}

export async function updateWhatsAppTemplate(id: string, body: string): Promise<WhatsAppTemplate> {
  const res = await fetch(`${BASE_URL}/whatsapp/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  return res.json();
}

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const res = await fetch(`${BASE_URL}/activity-logs`);
  return res.json();
}

export async function fetchAnalytics(): Promise<{
  totalSales: number;
  totalOrdersCount: number;
  activeOrdersCount: number;
  totalExpenses: number;
  netProfit: number;
  topItems: { name: string; quantity: number }[];
}> {
  const res = await fetch(`${BASE_URL}/analytics`);
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users`);
  return res.json();
}

export async function createUser(userData: Partial<User>, actorName?: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, actorName }),
  });
  return res.json();
}

export async function updateUser(id: string, updates: Partial<User>, actorName?: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updates, actorName }),
  });
  return res.json();
}

export async function deleteUser(id: string, actorName?: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/users/${id}${actorName ? `?actorName=${encodeURIComponent(actorName)}` : ''}`, {
    method: 'DELETE',
  });
  return res.json();
}

// SSE Connection Listener
export function subscribeToRealtimeEvents(onEvent: (event: { type: string; payload: any }) => void) {
  const eventSource = new EventSource(`${BASE_URL}/events`);

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch (err) {
      console.error('Error parsing SSE data', err);
    }
  };

  eventSource.onerror = () => {
    // EventSource will automatically attempt to reconnect
  };

  return () => {
    eventSource.close();
  };
}

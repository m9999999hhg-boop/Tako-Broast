import fs from 'fs';
import path from 'path';
import {
  Category,
  Product,
  User,
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
} from '../src/types';
import {
  initialCategories,
  initialProducts,
  initialUsers,
  initialCustomers,
  initialOrders,
  initialDeliveryEmployees,
  initialInventory,
  initialExpenses,
  initialSettings,
  initialWhatsAppTemplates,
} from './initialData';

interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  users: User[];
  customers: Customer[];
  orders: Order[];
  printJobs: PrintJob[];
  deliveryEmployees: DeliveryEmployee[];
  inventory: InventoryItem[];
  expenses: Expense[];
  activityLogs: ActivityLog[];
  settings: RestaurantSettings;
  whatsappTemplates: WhatsAppTemplate[];
  lastOrderSequence: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class UnifiedDatabase {
  private data: DatabaseSchema;
  private sseClients: Set<(data: string) => void> = new Set();

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read saved database.json, initializing fresh data.', e);
    }

    const defaultData: DatabaseSchema = {
      categories: initialCategories,
      products: initialProducts,
      users: initialUsers,
      customers: initialCustomers,
      orders: initialOrders,
      printJobs: [],
      deliveryEmployees: initialDeliveryEmployees,
      inventory: initialInventory,
      expenses: initialExpenses,
      activityLogs: [
        {
          id: 'act-init',
          action: 'SYSTEM_BOOT',
          actorName: 'System',
          role: 'SYSTEM',
          details: 'Unified Database initialized with full Taco Broast menu and config',
          timestamp: new Date().toISOString(),
        },
      ],
      settings: initialSettings,
      whatsappTemplates: initialWhatsAppTemplates,
      lastOrderSequence: 8495,
    };

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  // Real-time SSE broadcasting
  public subscribeSSE(client: (data: string) => void) {
    this.sseClients.add(client);
    return () => {
      this.sseClients.delete(client);
    };
  }

  public broadcast(event: { type: string; payload: any }) {
    const raw = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client(raw);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  // Activity Logger
  public logActivity(actorName: string, role: string, action: string, details: string) {
    const entry: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actorName,
      role,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(entry);
    if (this.data.activityLogs.length > 200) {
      this.data.activityLogs.pop();
    }
    this.saveData();
    this.broadcast({ type: 'ACTIVITY_LOG', payload: entry });
  }

  // Categories & Products
  public getCategories(): Category[] {
    return this.data.categories;
  }

  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public updateProduct(updated: Product, actorName: string = 'Admin'): Product {
    const idx = this.data.products.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...updated };
      this.saveData();
      this.broadcast({ type: 'PRODUCT_UPDATED', payload: this.data.products[idx] });
      this.logActivity(actorName, 'ADMIN', 'UPDATE_PRODUCT', `Updated product ${updated.nameAr} (${updated.price} EGP)`);
      return this.data.products[idx];
    } else {
      this.data.products.push(updated);
      this.saveData();
      this.broadcast({ type: 'PRODUCT_CREATED', payload: updated });
      this.logActivity(actorName, 'ADMIN', 'CREATE_PRODUCT', `Created product ${updated.nameAr}`);
      return updated;
    }
  }

  public toggleProductAvailability(id: string, actorName: string = 'Cashier'): Product | null {
    const prod = this.data.products.find((p) => p.id === id);
    if (prod) {
      prod.isAvailable = !prod.isAvailable;
      this.saveData();
      this.broadcast({ type: 'PRODUCT_UPDATED', payload: prod });
      this.logActivity(actorName, 'STAFF', 'AVAILABILITY_TOGGLE', `${prod.nameAr} is now ${prod.isAvailable ? 'Available' : 'Sold Out'}`);
      return prod;
    }
    return null;
  }

  // Customers (Phone number is unique key)
  public getCustomers(): Customer[] {
    return this.data.customers;
  }

  public getCustomerByPhone(phone: string): Customer | undefined {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    return this.data.customers.find((c) => c.phone.trim().replace(/\s+/g, '') === cleanPhone);
  }

  public upsertCustomer(customerData: {
    name: string;
    phone: string;
    address?: string;
    location?: { lat: number; lng: number };
    notes?: string;
  }): Customer {
    const cleanPhone = customerData.phone.trim().replace(/\s+/g, '');
    let existing = this.data.customers.find((c) => c.phone.trim().replace(/\s+/g, '') === cleanPhone);

    if (existing) {
      existing.name = customerData.name || existing.name;
      if (customerData.address) existing.address = customerData.address;
      if (customerData.location) existing.location = customerData.location;
      if (customerData.notes) existing.notes = customerData.notes;
      this.saveData();
      return existing;
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: customerData.name,
        phone: cleanPhone,
        address: customerData.address,
        location: customerData.location,
        notes: customerData.notes,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
      };
      this.data.customers.push(newCustomer);
      this.saveData();
      return newCustomer;
    }
  }

  // Orders
  public getOrders(): Order[] {
    return this.data.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public createOrder(orderInput: {
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
  }): { order: Order; printJob: PrintJob } {
    this.data.lastOrderSequence += 1;
    const orderNumber = `#TB-${this.data.lastOrderSequence}`;
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Upsert Customer
    const customer = this.upsertCustomer({
      name: orderInput.customerName,
      phone: orderInput.customerPhone,
      address: orderInput.deliveryAddress,
      location: orderInput.deliveryLocation,
    });

    const subtotal = orderInput.items.reduce((sum, item) => {
      const extrasSum = (item.extras || []).reduce((es, e) => es + e.price, 0);
      return sum + (item.price + extrasSum) * item.quantity;
    }, 0);

    const discount = orderInput.discount || 0;
    const deliveryFee =
      orderInput.orderType === 'DELIVERY' || orderInput.orderType === 'WEBSITE'
        ? this.data.settings.defaultDeliveryFee
        : 0;
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableSubtotal * this.data.settings.taxRate * 10) / 10;
    const total = Math.round((taxableSubtotal + deliveryFee + tax) * 10) / 10;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      orderType: orderInput.orderType,
      status: 'NEW',
      tableNumber: orderInput.tableNumber,
      customerId: customer.id,
      customerName: orderInput.customerName,
      customerPhone: orderInput.customerPhone,
      deliveryAddress: orderInput.deliveryAddress,
      deliveryLocation: orderInput.deliveryLocation,
      deliveryInstructions: orderInput.deliveryInstructions,
      items: orderInput.items,
      subtotal,
      discount,
      deliveryFee,
      tax,
      total,
      paymentStatus: orderInput.orderType === 'WEBSITE' ? 'UNPAID' : 'PAID',
      paymentMethod: orderInput.paymentMethod || 'CASH',
      cashierName: orderInput.cashierName || (orderInput.orderType === 'WEBSITE' ? 'Online Customer' : 'Cashier'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      printedCount: 0,
    };

    // Update Customer Statistics
    customer.totalOrders += 1;
    customer.totalSpent += total;
    customer.lastOrderAt = newOrder.createdAt;

    this.data.orders.unshift(newOrder);

    // Automatic Receipt Generation and Idempotent Print Job Creation
    const slips: ('CUSTOMER' | 'KITCHEN')[] = [];
    if (orderInput.orderType === 'TAKE_AWAY') {
      slips.push('CUSTOMER', 'KITCHEN');
    } else if (orderInput.orderType === 'DINE_IN') {
      slips.push('CUSTOMER');
    } else {
      // Delivery & Website Delivery
      slips.push('CUSTOMER');
    }

    const printJob: PrintJob = {
      id: `pj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      orderType: newOrder.orderType,
      slipsCount: slips.length,
      slips,
      status: 'PENDING',
      idempotencyKey: `print-${newOrder.id}-v1`,
      createdAt: new Date().toISOString(),
      content: this.generateReceiptContent(newOrder),
    };

    this.data.printJobs.unshift(printJob);
    this.saveData();

    // Real-Time Broadcast to all POS, Kitchen, and Admin interfaces!
    this.broadcast({
      type: 'ORDER_CREATED',
      payload: {
        order: newOrder,
        printJob,
      },
    });

    this.logActivity(
      newOrder.cashierName || 'System',
      'POS',
      'CREATE_ORDER',
      `Order ${orderNumber} created (${orderInput.orderType}) for ${newOrder.customerName} - Total: ${total} EGP`
    );

    return { order: newOrder, printJob };
  }

  public updateOrderStatus(orderId: string, status: OrderStatus, actorName: string = 'Staff'): Order | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();

      if (status === 'DELIVERED') {
        order.paymentStatus = 'PAID';
        if (order.driverId) {
          const emp = this.data.deliveryEmployees.find((e) => e.id === order.driverId);
          if (emp) {
            emp.isAvailable = true;
            emp.currentOrderId = undefined;
          }
        }
      }

      this.saveData();
      this.broadcast({ type: 'ORDER_UPDATED', payload: order });
      this.logActivity(actorName, 'OPERATIONS', 'STATUS_CHANGE', `Order ${order.orderNumber} status changed to ${status}`);
      return order;
    }
    return null;
  }

  public assignDelivery(orderId: string, driverId: string, actorName: string = 'Manager'): Order | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    const driver = this.data.deliveryEmployees.find((d) => d.id === driverId);
    if (order && driver) {
      order.driverId = driver.id;
      order.driverName = driver.name;
      order.driverPhone = driver.phone;
      order.status = 'ASSIGNED';
      order.updatedAt = new Date().toISOString();
      if (driver.currentLocation) {
        order.driverLocation = { ...driver.currentLocation };
      }

      driver.isAvailable = false;
      driver.currentOrderId = order.id;

      this.saveData();
      this.broadcast({ type: 'ORDER_UPDATED', payload: order });
      this.logActivity(actorName, 'DELIVERY', 'ASSIGN_DRIVER', `Assigned ${driver.name} to order ${order.orderNumber}`);
      return order;
    }
    return null;
  }

  public updateDriverLocation(driverId: string, lat: number, lng: number): void {
    const driver = this.data.deliveryEmployees.find((d) => d.id === driverId);
    const now = new Date().toISOString();
    if (driver) {
      driver.currentLocation = { lat, lng, updatedAt: now };

      // If driver is currently delivering an order, update the order's driverLocation and broadcast
      if (driver.currentOrderId) {
        const order = this.data.orders.find((o) => o.id === driver.currentOrderId);
        if (order) {
          order.driverLocation = { lat, lng, updatedAt: now };
          this.broadcast({
            type: 'DRIVER_LOCATION',
            payload: {
              orderId: order.id,
              driverId: driver.id,
              location: { lat, lng, updatedAt: now },
            },
          });
        }
      }
      this.saveData();
    }
  }

  // Printing & Idempotency
  public completePrintJob(printJobId: string, idempotencyKey: string): PrintJob | null {
    const job = this.data.printJobs.find((j) => j.id === printJobId || j.idempotencyKey === idempotencyKey);
    if (job) {
      if (job.status === 'PRINTED') {
        return job; // Idempotent return
      }
      job.status = 'PRINTED';
      job.printedAt = new Date().toISOString();

      const order = this.data.orders.find((o) => o.id === job.orderId);
      if (order) {
        order.printedCount += 1;
        order.lastPrintedAt = job.printedAt;
      }

      this.saveData();
      this.broadcast({ type: 'PRINT_COMPLETED', payload: job });
      return job;
    }
    return null;
  }

  public createReprintJob(orderId: string, actorName: string = 'Cashier'): PrintJob | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const printJob: PrintJob = {
      id: `pj-rep-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      slipsCount: 1,
      slips: ['CUSTOMER'],
      status: 'PENDING',
      idempotencyKey: `reprint-${order.id}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      content: this.generateReceiptContent(order, true),
    };

    this.data.printJobs.unshift(printJob);
    this.saveData();
    this.broadcast({ type: 'PRINT_JOB_CREATED', payload: printJob });
    this.logActivity(actorName, 'POS', 'REPRINT', `Reprint requested for order ${order.orderNumber}`);
    return printJob;
  }

  private generateReceiptContent(order: Order, isReprint: boolean = false): string {
    const lines = [
      '==========================================',
      '           TACO BROAST | تاكو بروست       ',
      '        01036130204 - شبرا النخلة         ',
      '==========================================',
      `Order: ${order.orderNumber}  Type: ${order.orderType}`,
      `Date: ${new Date(order.createdAt).toLocaleString('ar-EG')}`,
      `Customer: ${order.customerName} (${order.customerPhone})`,
      order.deliveryAddress ? `Address: ${order.deliveryAddress}` : '',
      order.tableNumber ? `Table: ${order.tableNumber}` : '',
      isReprint ? '*** [REPRINT - نسخة مكررة] ***' : '',
      '------------------------------------------',
      'ITEM                       QTY     PRICE  ',
      '------------------------------------------',
      ...order.items.map((i) => {
        const itemLine = `${i.nameAr.padEnd(24)} ${i.quantity}x     ${i.price * i.quantity} EGP`;
        const spicyLine = i.spicyChoice ? `  * ${i.spicyChoice === 'SPICY' ? 'حار سبايسي' : 'عادي بارد'}` : '';
        const extras = (i.extras || []).map((e) => `  + ${e.nameAr} (${e.price} EGP)`).join('\n');
        return [itemLine, spicyLine, extras].filter(Boolean).join('\n');
      }),
      '------------------------------------------',
      `Subtotal:                 ${order.subtotal} EGP`,
      order.discount > 0 ? `Discount:                -${order.discount} EGP` : '',
      order.deliveryFee > 0 ? `Delivery Fee:            +${order.deliveryFee} EGP` : '',
      `Tax (8%):                 +${order.tax} EGP`,
      '==========================================',
      `TOTAL AMOUNT:             ${order.total} EGP`,
      `Payment Method:           ${order.paymentMethod} (${order.paymentStatus})`,
      '==========================================',
      '       شكراً لزيارتكم تاكو بروست!         ',
      '      نتمنى لكم وجبة شهية وهنيئة          ',
      '==========================================',
    ].filter(Boolean);
    return lines.join('\n');
  }

  // Delivery Employees
  public getDeliveryEmployees(): DeliveryEmployee[] {
    return this.data.deliveryEmployees;
  }

  // Inventory
  public getInventory(): InventoryItem[] {
    return this.data.inventory;
  }

  public updateInventoryStock(itemId: string, currentStock: number, note?: string): InventoryItem | null {
    const item = this.data.inventory.find((i) => i.id === itemId);
    if (item) {
      item.currentStock = currentStock;
      this.saveData();
      this.broadcast({ type: 'INVENTORY_UPDATED', payload: item });
      this.logActivity('Manager', 'INVENTORY', 'STOCK_ADJUSTMENT', `Stock adjusted for ${item.nameAr}: ${currentStock} ${item.unit} (${note || 'Manual edit'})`);
      return item;
    }
    return null;
  }

  // Expenses
  public getExpenses(): Expense[] {
    return this.data.expenses;
  }

  public addExpense(expenseData: Omit<Expense, 'id'>): Expense {
    const exp: Expense = {
      id: `exp-${Date.now()}`,
      ...expenseData,
    };
    this.data.expenses.unshift(exp);
    this.saveData();
    this.broadcast({ type: 'EXPENSE_ADDED', payload: exp });
    this.logActivity(expenseData.createdByName, 'ACCOUNTING', 'ADD_EXPENSE', `Expense of ${exp.amount} EGP for ${exp.description}`);
    return exp;
  }

  // Users & Roles
  public getUsers(): User[] {
    return this.data.users;
  }

  public addUser(userData: Omit<User, 'id'>, actorName: string = 'Admin'): User {
    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: userData.name.trim(),
      email: userData.email?.trim() || `${Date.now()}@tacobroast.com`,
      role: userData.role || 'CASHIER',
      phone: userData.phone?.trim(),
      branch: userData.branch || 'شبرا النخلة',
      active: userData.active ?? true,
    };
    this.data.users.push(newUser);
    this.saveData();
    this.broadcast({ type: 'USERS_UPDATED', payload: this.data.users });
    this.logActivity(actorName, 'STAFF', 'ADD_USER', `Added employee ${newUser.name} (${newUser.role})`);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>, actorName: string = 'Admin'): User | null {
    const user = this.data.users.find((u) => u.id === id);
    if (user) {
      if (updates.name !== undefined) user.name = updates.name.trim();
      if (updates.email !== undefined) user.email = updates.email.trim();
      if (updates.role !== undefined) user.role = updates.role;
      if (updates.phone !== undefined) user.phone = updates.phone.trim();
      if (updates.branch !== undefined) user.branch = updates.branch.trim();
      if (updates.active !== undefined) user.active = updates.active;

      this.saveData();
      this.broadcast({ type: 'USERS_UPDATED', payload: this.data.users });
      this.logActivity(actorName, 'STAFF', 'UPDATE_USER', `Updated employee ${user.name}`);
      return user;
    }
    return null;
  }

  public deleteUser(id: string, actorName: string = 'Admin'): boolean {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      const removed = this.data.users.splice(index, 1)[0];
      this.saveData();
      this.broadcast({ type: 'USERS_UPDATED', payload: this.data.users });
      this.logActivity(actorName, 'STAFF', 'DELETE_USER', `Deleted employee ${removed.name}`);
      return true;
    }
    return false;
  }

  // Settings
  public getSettings(): RestaurantSettings {
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<RestaurantSettings>): RestaurantSettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveData();
    this.broadcast({ type: 'SETTINGS_UPDATED', payload: this.data.settings });
    this.logActivity('Admin', 'SETTINGS', 'UPDATE_SETTINGS', 'Restaurant operational settings updated');
    return this.data.settings;
  }

  // WhatsApp Templates
  public getWhatsAppTemplates(): WhatsAppTemplate[] {
    return this.data.whatsappTemplates;
  }

  public updateWhatsAppTemplate(id: string, body: string): WhatsAppTemplate | null {
    const tpl = this.data.whatsappTemplates.find((t) => t.id === id);
    if (tpl) {
      tpl.body = body;
      this.saveData();
      return tpl;
    }
    return null;
  }

  // Activity Logs
  public getActivityLogs(): ActivityLog[] {
    return this.data.activityLogs;
  }

  // Backup & Restore
  public getFullDump(): DatabaseSchema {
    return this.data;
  }

  public restoreDump(dump: DatabaseSchema): boolean {
    if (dump && dump.categories && dump.products && dump.orders) {
      this.data = dump;
      this.saveData();
      this.broadcast({ type: 'DATABASE_RESTORED', payload: {} });
      this.logActivity('Super Admin', 'SYSTEM', 'RESTORE', 'Full database restored from JSON backup');
      return true;
    }
    return false;
  }
}

export const db = new UnifiedDatabase();

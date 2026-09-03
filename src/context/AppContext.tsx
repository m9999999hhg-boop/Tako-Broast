import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Category,
  Product,
  Customer,
  Order,
  OrderStatus,
  OrderType,
  OrderItem,
  PrintJob,
  DeliveryEmployee,
  RestaurantSettings,
  User,
} from '../types';
import * as api from '../services/api';
import { audioEngine } from '../utils/audio';

export type AppRoute = 'website' | 'pos' | 'delivery' | 'admin';

export interface CartItem extends OrderItem {
  id: string; // unique key in cart
}

interface AppContextType {
  // Navigation & Role
  currentRoute: AppRoute;
  setCurrentRoute: (route: AppRoute) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  allUsers: User[];
  isLiveConnected: boolean;
  addNewUser: (user: Partial<User>) => Promise<User>;
  updateExistingUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteExistingUser: (id: string) => Promise<void>;

  // Domain Data
  categories: Category[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  settings: RestaurantSettings | null;
  deliveryStaff: DeliveryEmployee[];

  // Website Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, spicyChoice?: 'NORMAL' | 'SPICY', extras?: { id: string; nameAr: string; price: number }[], notes?: string) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotal: number;

  // Order Actions
  placeOrder: (orderData: {
    orderType: OrderType;
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
    deliveryLocation?: { lat: number; lng: number };
    deliveryInstructions?: string;
    tableNumber?: string;
    items?: OrderItem[];
    discount?: number;
    paymentMethod?: 'CASH' | 'CARD' | 'ONLINE';
    cashierName?: string;
  }) => Promise<Order>;
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignDriver: (orderId: string, driverId: string) => Promise<void>;
  reprintReceipt: (orderId: string) => Promise<void>;
  toggleAvailability: (productId: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => Promise<void>;

  // Driver Location Simulation / Tracking
  updateDriverGPS: (driverId: string, lat: number, lng: number) => Promise<void>;

  // Print System
  activePrintReceipt: { order: Order; isReprint: boolean } | null;
  closePrintPreview: () => void;
  recentPrintJobs: PrintJob[];
  processedPrintKeys: Set<string>;
  triggerManualPrint: (order: Order) => void;

  // Selected Order for Tracking
  activeTrackingOrderId: string | null;
  setActiveTrackingOrderId: (id: string | null) => void;

  // Screen Password Protection
  unlockedScreens: Record<AppRoute, boolean>;
  unlockScreen: (route: AppRoute, passwordAttempt: string) => boolean;
  lockScreen: (route: AppRoute) => void;
  lockAllScreens: () => void;
  isScreenUnlocked: (route: AppRoute) => boolean;
  screenPasswords: {
    pos: string;
    delivery: string;
    admin: string;
  };
  updateScreenPassword: (screen: 'pos' | 'delivery' | 'admin', newPass: string) => Promise<void>;
  isStaffModalOpen: boolean;
  setIsStaffModalOpen: (open: boolean) => void;
  targetLockedRoute: AppRoute | null;
  setTargetLockedRoute: (route: AppRoute | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync route with URL path on load
  const [currentRoute, setCurrentRouteState] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/pos')) return 'pos';
      if (path.startsWith('/delivery')) return 'delivery';
      if (path.startsWith('/admin')) return 'admin';
    }
    return 'website';
  });

  const setCurrentRoute = (route: AppRoute) => {
    setCurrentRouteState(route);
    if (typeof window !== 'undefined') {
      const path = route === 'website' ? '/' : `/${route}`;
      window.history.pushState({}, '', path);
    }
  };

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryStaff, setDeliveryStaff] = useState<DeliveryEmployee[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-admin',
    name: 'أحمد الإداري',
    email: 'admin@tacobroast.com',
    role: 'SUPER_ADMIN',
    active: true,
  });

  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activePrintReceipt, setActivePrintReceipt] = useState<{ order: Order; isReprint: boolean } | null>(null);
  const [recentPrintJobs, setRecentPrintJobs] = useState<PrintJob[]>([]);
  const [processedPrintKeys] = useState<Set<string>>(new Set());
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  // Screen Password Protection States
  const [unlockedScreens, setUnlockedScreens] = useState<Record<AppRoute, boolean>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('tb_unlocked_screens');
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {}
    return {
      website: true,
      pos: false,
      delivery: false,
      admin: false,
    };
  });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [targetLockedRoute, setTargetLockedRoute] = useState<AppRoute | null>(null);

  const screenPasswords = {
    pos: settings?.screenPasswords?.pos || '1234',
    delivery: settings?.screenPasswords?.delivery || '3333',
    admin: settings?.screenPasswords?.admin || '9999',
  };

  const isScreenUnlocked = useCallback(
    (route: AppRoute) => {
      if (route === 'website') return true;
      return Boolean(unlockedScreens[route]);
    },
    [unlockedScreens]
  );

  const unlockScreen = useCallback(
    (route: AppRoute, passwordAttempt: string): boolean => {
      if (route === 'website') return true;
      const expected = screenPasswords[route as keyof typeof screenPasswords];
      if (passwordAttempt.trim() === expected) {
        setUnlockedScreens((prev) => {
          const updated = { ...prev, [route]: true };
          try {
            sessionStorage.setItem('tb_unlocked_screens', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        setCurrentRouteState(route);
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', `/${route}`);
        }
        return true;
      }
      return false;
    },
    [screenPasswords]
  );

  const lockScreen = useCallback((route: AppRoute) => {
    setUnlockedScreens((prev) => {
      const updated = { ...prev, [route]: false };
      try {
        sessionStorage.setItem('tb_unlocked_screens', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setCurrentRouteState('website');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const lockAllScreens = useCallback(() => {
    const locked: Record<AppRoute, boolean> = {
      website: true,
      pos: false,
      delivery: false,
      admin: false,
    };
    setUnlockedScreens(locked);
    try {
      sessionStorage.setItem('tb_unlocked_screens', JSON.stringify(locked));
    } catch (e) {}
    setCurrentRouteState('website');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const updateScreenPassword = useCallback(
    async (screen: 'pos' | 'delivery' | 'admin', newPass: string) => {
      if (!settings) return;
      const currentPasses = settings.screenPasswords || {
        pos: '1234',
        delivery: '3333',
        admin: '9999',
      };
      const updatedSettings = {
        ...settings,
        screenPasswords: {
          ...currentPasses,
          [screen]: newPass.trim(),
        },
      };
      await updateSettings(updatedSettings);
    },
    [settings, updateSettings]
  );

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      const [cats, prods, ords, custs, staff, sets, users] = await Promise.all([
        api.fetchCategories(),
        api.fetchProducts(),
        api.fetchOrders(),
        api.fetchCustomers(),
        api.fetchDeliveryStaff(),
        api.fetchSettings(),
        api.fetchUsers(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setOrders(ords);
      setCustomers(custs);
      setDeliveryStaff(staff);
      setSettings(sets);
      setAllUsers(users);
      if (users.length > 0) {
        // Match default user based on initial route
        if (currentRoute === 'pos') {
          const cash = users.find((u) => u.role === 'CASHIER');
          if (cash) setCurrentUser(cash);
        } else if (currentRoute === 'delivery') {
          const del = users.find((u) => u.role === 'DELIVERY');
          if (del) setCurrentUser(del);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data', err);
    }
  }, [currentRoute]);

  // Execute Automatic Thermal Printing on incoming order
  const handleAutoPrint = useCallback(
    async (order: Order, printJob?: PrintJob) => {
      const idempotencyKey = printJob?.idempotencyKey || `print-${order.id}-auto`;
      if (processedPrintKeys.has(idempotencyKey)) {
        return; // Idempotent skip: prevent duplicate automatic prints
      }
      processedPrintKeys.add(idempotencyKey);

      // Play sound
      audioEngine.playPrinterSound();

      // Show visual thermal receipt modal in POS
      setActivePrintReceipt({ order, isReprint: false });

      if (printJob) {
        setRecentPrintJobs((prev) => [printJob, ...prev.slice(0, 19)]);
        try {
          await api.completePrintJob(printJob.id, idempotencyKey);
        } catch (e) {
          console.error('Failed to mark print job complete', e);
        }
      }
    },
    [processedPrintKeys]
  );

  // Subscribe to Real-Time SSE
  useEffect(() => {
    loadInitialData();

    const unsubscribe = api.subscribeToRealtimeEvents((event) => {
      setIsLiveConnected(true);

      if (event.type === 'CONNECTED') {
        setIsLiveConnected(true);
      } else if (event.type === 'ORDER_CREATED') {
        const { order, printJob } = event.payload;
        setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
        audioEngine.playNewOrderChime();

        // Automatic Thermal Printing Trigger
        handleAutoPrint(order, printJob);
      } else if (event.type === 'ORDER_UPDATED') {
        const updated = event.payload as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        if (updated.status === 'READY') {
          audioEngine.playKitchenBell();
        }
      } else if (event.type === 'DRIVER_LOCATION') {
        const { orderId, location } = event.payload;
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, driverLocation: location } : o))
        );
      } else if (event.type === 'PRODUCT_UPDATED' || event.type === 'PRODUCT_CREATED') {
        const prod = event.payload as Product;
        setProducts((prev) => {
          const exists = prev.some((p) => p.id === prod.id);
          if (exists) return prev.map((p) => (p.id === prod.id ? prod : p));
          return [...prev, prod];
        });
      } else if (event.type === 'SETTINGS_UPDATED') {
        setSettings(event.payload);
      } else if (event.type === 'USERS_UPDATED') {
        setAllUsers(event.payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadInitialData, handleAutoPrint]);

  // Cart operations
  const addToCart = (
    product: Product,
    quantity: number = 1,
    spicyChoice?: 'NORMAL' | 'SPICY',
    extras?: { id: string; nameAr: string; price: number }[],
    notes?: string
  ) => {
    const extrasKey = (extras || []).map((e) => e.id).sort().join('-');
    const cartItemId = `${product.id}-${spicyChoice || 'none'}-${extrasKey}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          price: product.price,
          quantity,
          spicyChoice: product.hasSpicyOption ? spicyChoice || 'NORMAL' : undefined,
          extras: extras || [],
          notes,
        },
      ];
    });
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => {
    const extrasSum = (item.extras || []).reduce((eSum, e) => eSum + e.price, 0);
    return sum + (item.price + extrasSum) * item.quantity;
  }, 0);

  const cartTotal = cartSubtotal; // taxes & delivery added at checkout

  // Order Placement
  const placeOrder = async (orderData: {
    orderType: OrderType;
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
    deliveryLocation?: { lat: number; lng: number };
    deliveryInstructions?: string;
    tableNumber?: string;
    items?: OrderItem[];
    discount?: number;
    paymentMethod?: 'CASH' | 'CARD' | 'ONLINE';
    cashierName?: string;
  }) => {
    const itemsToOrder =
      orderData.items ||
      cart.map((c) => ({
        productId: c.productId,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        price: c.price,
        quantity: c.quantity,
        spicyChoice: c.spicyChoice,
        extras: c.extras,
        notes: c.notes,
      }));

    if (itemsToOrder.length === 0) {
      throw new Error('السلة فارغة، يرجى اختيار وجبات أولاً');
    }

    const { order, printJob } = await api.createOrder({
      ...orderData,
      items: itemsToOrder,
      cashierName: orderData.cashierName || currentUser.name,
    });

    if (!orderData.items) {
      clearCart();
    }

    // Set as active tracking order for website customer
    setActiveTrackingOrderId(order.id);

    return order;
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const updated = await api.updateOrderStatus(orderId, status, currentUser.name);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    const updated = await api.assignDeliveryDriver(orderId, driverId, currentUser.name);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  const reprintReceipt = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    audioEngine.playPrinterSound();
    setActivePrintReceipt({ order, isReprint: true });
    await api.reprintOrder(orderId, currentUser.name);
  };

  const triggerManualPrint = (order: Order) => {
    audioEngine.playPrinterSound();
    setActivePrintReceipt({ order, isReprint: true });
  };

  const toggleAvailability = async (productId: string) => {
    const updated = await api.toggleProductAvailability(productId, currentUser.name);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
  };

  const updateProduct = async (product: Product) => {
    const updated = await api.updateProduct(product.id, product, currentUser.name);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
  };

  const updateSettings = async (newSettings: Partial<RestaurantSettings>) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
  };

  const updateDriverGPS = async (driverId: string, lat: number, lng: number) => {
    await api.updateDriverLocation(driverId, lat, lng);
  };

  const closePrintPreview = () => {
    setActivePrintReceipt(null);
  };

  const addNewUser = async (userData: Partial<User>) => {
    const created = await api.createUser(userData, currentUser.name);
    setAllUsers((prev) => [...prev, created]);
    return created;
  };

  const updateExistingUser = async (id: string, updates: Partial<User>) => {
    const updated = await api.updateUser(id, updates, currentUser.name);
    setAllUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    if (currentUser.id === id) {
      setCurrentUser(updated);
    }
  };

  const deleteExistingUser = async (id: string) => {
    await api.deleteUser(id, currentUser.name);
    setAllUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        currentUser,
        setCurrentUser,
        allUsers,
        isLiveConnected,
        addNewUser,
        updateExistingUser,
        deleteExistingUser,
        categories,
        products,
        orders,
        customers,
        settings,
        deliveryStaff,
        cart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTotal,
        placeOrder,
        updateStatus,
        assignDriver,
        reprintReceipt,
        toggleAvailability,
        updateProduct,
        updateSettings,
        updateDriverGPS,
        activePrintReceipt,
        closePrintPreview,
        recentPrintJobs,
        processedPrintKeys,
        triggerManualPrint,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        unlockedScreens,
        unlockScreen,
        lockScreen,
        lockAllScreens,
        isScreenUnlocked,
        screenPasswords,
        updateScreenPassword,
        isStaffModalOpen,
        setIsStaffModalOpen,
        targetLockedRoute,
        setTargetLockedRoute,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

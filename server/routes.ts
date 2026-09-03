import { Router } from 'express';
import { db } from './db';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    restaurant: 'Taco Broast | تاكو بروست',
    time: new Date().toISOString(),
  });
});

// Server-Sent Events (SSE) for Instant Real-Time Synchronization
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Initial connection hello
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  const unsubscribe = db.subscribeSSE((chunk) => {
    res.write(chunk);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Categories & Products
router.get('/categories', (req, res) => {
  res.json(db.getCategories());
});

router.get('/products', (req, res) => {
  res.json(db.getProducts());
});

router.post('/products', (req, res) => {
  try {
    const product = db.updateProduct(req.body, req.body.actorName || 'Admin');
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const product = db.updateProduct({ ...req.body, id: req.params.id }, req.body.actorName || 'Admin');
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/products/:id/toggle-availability', (req, res) => {
  const prod = db.toggleProductAvailability(req.params.id, req.body.actorName || 'Cashier');
  if (!prod) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(prod);
});

// Customers
router.get('/customers', (req, res) => {
  res.json(db.getCustomers());
});

router.get('/customers/by-phone/:phone', (req, res) => {
  const customer = db.getCustomerByPhone(req.params.phone);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

// Orders
router.get('/orders', (req, res) => {
  res.json(db.getOrders());
});

router.get('/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

router.post('/orders', (req, res) => {
  try {
    const { order, printJob } = db.createOrder(req.body);
    res.status(201).json({ order, printJob });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/orders/:id/status', (req, res) => {
  const { status, actorName } = req.body;
  const order = db.updateOrderStatus(req.params.id, status, actorName);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

router.patch('/orders/:id/assign', (req, res) => {
  const { driverId, actorName } = req.body;
  const order = db.assignDelivery(req.params.id, driverId, actorName);
  if (!order) {
    return res.status(404).json({ error: 'Order or driver not found' });
  }
  res.json(order);
});

// Driver GPS Location Tracking
router.post('/delivery/location', (req, res) => {
  const { driverId, lat, lng } = req.body;
  if (!driverId || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Missing driverId, lat, or lng' });
  }
  db.updateDriverLocation(driverId, parseFloat(lat), parseFloat(lng));
  res.json({ success: true, timestamp: new Date().toISOString() });
});

router.get('/delivery/staff', (req, res) => {
  res.json(db.getDeliveryEmployees());
});

// Printing & Idempotency
router.post('/print-jobs/:id/complete', (req, res) => {
  const { idempotencyKey } = req.body;
  const job = db.completePrintJob(req.params.id, idempotencyKey);
  if (!job) {
    return res.status(404).json({ error: 'Print job not found' });
  }
  res.json(job);
});

router.post('/orders/:id/reprint', (req, res) => {
  const { actorName } = req.body;
  const job = db.createReprintJob(req.params.id, actorName);
  if (!job) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.status(201).json(job);
});

// Inventory
router.get('/inventory', (req, res) => {
  res.json(db.getInventory());
});

router.patch('/inventory/:id', (req, res) => {
  const { currentStock, note } = req.body;
  const item = db.updateInventoryStock(req.params.id, parseFloat(currentStock), note);
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }
  res.json(item);
});

// Expenses
router.get('/expenses', (req, res) => {
  res.json(db.getExpenses());
});

router.post('/expenses', (req, res) => {
  try {
    const expense = db.addExpense(req.body);
    res.status(201).json(expense);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Users
router.get('/users', (req, res) => {
  res.json(db.getUsers());
});

router.post('/users', (req, res) => {
  try {
    const user = db.addUser(req.body, req.body.actorName || 'Admin');
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/users/:id', (req, res) => {
  try {
    const user = db.updateUser(req.params.id, req.body, req.body.actorName || 'Admin');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/users/:id', (req, res) => {
  const ok = db.deleteUser(req.params.id, (req.query.actorName as string) || 'Admin');
  if (ok) {
    res.json({ success: true, message: 'User deleted' });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Settings
router.get('/settings', (req, res) => {
  res.json(db.getSettings());
});

router.put('/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// WhatsApp Templates & Link Builder
router.get('/whatsapp/templates', (req, res) => {
  res.json(db.getWhatsAppTemplates());
});

router.put('/whatsapp/templates/:id', (req, res) => {
  const updated = db.updateWhatsAppTemplate(req.params.id, req.body.body);
  if (!updated) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json(updated);
});

// Activity Logs
router.get('/activity-logs', (req, res) => {
  res.json(db.getActivityLogs());
});

// Analytics Dashboard summary
router.get('/analytics', (req, res) => {
  const orders = db.getOrders();
  const expenses = db.getExpenses();

  const totalSales = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.total : 0), 0);
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category counts
  const categorySales: Record<string, number> = {};
  for (const order of orders) {
    if (order.status === 'CANCELLED') continue;
    for (const item of order.items) {
      categorySales[item.nameAr] = (categorySales[item.nameAr] || 0) + item.quantity;
    }
  }

  const topItems = Object.entries(categorySales)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  res.json({
    totalSales,
    totalOrdersCount,
    activeOrdersCount,
    totalExpenses,
    netProfit: totalSales - totalExpenses,
    topItems,
  });
});

// Backup & Restore
router.get('/backup/export', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="taco-broast-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(db.getFullDump(), null, 2));
});

router.post('/backup/restore', (req, res) => {
  const ok = db.restoreDump(req.body);
  if (ok) {
    res.json({ success: true, message: 'Database restored successfully' });
  } else {
    res.status(400).json({ error: 'Invalid backup structure' });
  }
});

export default router;

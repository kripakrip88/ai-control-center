const EventEmitter = require('events');
const memoryService = require('./memory.service');

class MemoryEventBus extends EventEmitter {
  constructor() {
    super();
    this.setupAutoListeners();
  }

  setupAutoListeners() {
    this.on('order.created', this.onOrderCreated.bind(this));
    this.on('order.updated', this.onOrderUpdated.bind(this));
    this.on('order.deleted', this.onOrderDeleted.bind(this));

    this.on('material.added', this.onMaterialAdded.bind(this));
    this.on('material.updated', this.onMaterialUpdated.bind(this));
    this.on('material.removed', this.onMaterialRemoved.bind(this));

    this.on('customer.created', this.onCustomerCreated.bind(this));
    this.on('customer.updated', this.onCustomerUpdated.bind(this));

    this.on('bom.extracted', this.onBOMExtracted.bind(this));
    this.on('drawing.uploaded', this.onDrawingUploaded.bind(this));

    this.on('user.login', this.onUserLogin.bind(this));
    this.on('user.action', this.onUserAction.bind(this));

    console.log('[MemoryEventBus] Auto-listeners setup complete');
  }

  async onOrderCreated({ orderId, companyId, data }) {
    await memoryService.rememberOrderContext(
      companyId,
      orderId,
      `Создан новый заказ: ${data.customerName || 'без имени'}, сумма: ${data.totalAmount || 0}`
    );
  }

  async onOrderUpdated({ orderId, companyId, changes }) {
    await memoryService.rememberOrderContext(
      companyId,
      orderId,
      `Обновлён заказ. Изменения: ${JSON.stringify(changes)}`
    );
  }

  async onOrderDeleted({ orderId, companyId, reason }) {
    await memoryService.rememberOrderContext(
      companyId,
      orderId,
      `Заказ удалён. Причина: ${reason || 'не указана'}`
    );
  }

  async onMaterialAdded({ materialId, companyId, data }) {
    await memoryService.rememberMaterialOperation(
      companyId,
      materialId,
      'added',
      {
        name: data.name,
        quantity: data.quantity,
        supplier: data.supplier,
      }
    );
  }

  async onMaterialUpdated({ materialId, companyId, changes }) {
    await memoryService.rememberMaterialOperation(
      companyId,
      materialId,
      'updated',
      changes
    );
  }

  async onMaterialRemoved({ materialId, companyId, reason }) {
    await memoryService.rememberMaterialOperation(
      companyId,
      materialId,
      'removed',
      { reason }
    );
  }

  async onCustomerCreated({ customerId, companyId, data }) {
    await memoryService.rememberUserAction(
      data.createdBy || 'system',
      companyId,
      'customer_created',
      {
        customerId,
        customerName: data.name,
      }
    );
  }

  async onCustomerUpdated({ customerId, companyId, changes }) {
    await memoryService.rememberUserAction(
      changes.updatedBy || 'system',
      companyId,
      'customer_updated',
      {
        customerId,
        changes,
      }
    );
  }

  async onBOMExtracted({ orderId, companyId, bomData }) {
    await memoryService.rememberOrderContext(
      companyId,
      orderId,
      `BOM извлечён AI Polygon. Позиций: ${bomData.items?.length || 0}, материалов: ${bomData.materials?.length || 0}`
    );
  }

  async onDrawingUploaded({ orderId, companyId, drawingId, fileName }) {
    await memoryService.rememberOrderContext(
      companyId,
      orderId,
      `Загружен чертёж: ${fileName} (ID: ${drawingId})`
    );
  }

  async onUserLogin({ userId, companyId, timestamp }) {
    await memoryService.rememberUserAction(
      userId,
      companyId,
      'login',
      {
        timestamp: timestamp || new Date().toISOString(),
      }
    );
  }

  async onUserAction({ userId, companyId, action, details }) {
    await memoryService.rememberUserAction(
      userId,
      companyId,
      action,
      details
    );
  }

  emitOrderCreated(orderId, companyId, data) {
    this.emit('order.created', { orderId, companyId, data });
  }

  emitOrderUpdated(orderId, companyId, changes) {
    this.emit('order.updated', { orderId, companyId, changes });
  }

  emitOrderDeleted(orderId, companyId, reason) {
    this.emit('order.deleted', { orderId, companyId, reason });
  }

  emitMaterialAdded(materialId, companyId, data) {
    this.emit('material.added', { materialId, companyId, data });
  }

  emitBOMExtracted(orderId, companyId, bomData) {
    this.emit('bom.extracted', { orderId, companyId, bomData });
  }

  emitUserAction(userId, companyId, action, details) {
    this.emit('user.action', { userId, companyId, action, details });
  }
}

module.exports = new MemoryEventBus();

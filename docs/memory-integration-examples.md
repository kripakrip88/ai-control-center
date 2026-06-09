# Memory Service - Примеры интеграции

## 🎯 Обзор

Memory Service интегрирован с ERP Web и AI Polygon для сохранения и поиска контекста работы.

## 📊 ERP Web - Примеры использования

### 1. Сохранение действий пользователя

```javascript
const memoryService = require('./services/memory.service');

// При создании заказа
async function createOrder(userId, companyId, orderData) {
  const order = await db.orders.create({ data: orderData });
  
  // Сохранить в память
  await memoryService.rememberUserAction(
    userId,
    companyId,
    'create_order',
    {
      orderId: order.id,
      customerName: orderData.customerName,
      totalAmount: orderData.totalAmount,
    }
  );
  
  return order;
}
```

### 2. Сохранение операций с материалами

```javascript
// При добавлении материала на склад
async function addMaterial(companyId, materialData) {
  const material = await db.materials.create({ data: materialData });
  
  await memoryService.rememberMaterialOperation(
    companyId,
    material.id,
    'added_to_warehouse',
    {
      name: material.name,
      quantity: material.quantity,
      supplier: material.supplier,
    }
  );
  
  return material;
}
```

### 3. Поиск контекста по заказу

```javascript
// Получить всю историю работы с заказом
async function getOrderContext(companyId, orderId) {
  const memories = await memoryService.recallCompanyContext(
    companyId,
    `заказ ${orderId}`,
    10
  );
  
  console.log('История заказа:', memories);
  return memories;
}
```

### 4. API endpoint для получения контекста

```javascript
// GET /api/memory/context?companyId=123&query=материалы
router.get('/memory/context', async (req, res) => {
  const { companyId, query } = req.query;
  
  const context = await memoryService.recallCompanyContext(
    companyId,
    query,
    5
  );
  
  res.json({ success: true, data: context });
});
```

## 🤖 AI Polygon - Примеры использования

### 1. Сохранение извлеченных данных

```typescript
import { MemoryService } from './memory/memory.service';

export class BOMExtractionService {
  constructor(private memoryService: MemoryService) {}

  async extractBOM(orderId: string, imageUrl: string) {
    // Извлекаем BOM
    const bomData = await this.performExtraction(imageUrl);
    
    // Сохраняем в память
    await this.memoryService.rememberBOMExtraction(
      `order-${orderId}`,
      orderId,
      bomData
    );
    
    return bomData;
  }
}
```

### 2. Использование прошлого контекста

```typescript
// Поиск похожих заказов для улучшения точности
async extractWithContext(orderId: string, image: Buffer) {
  // Получаем историю похожих извлечений
  const pastExtractions = await this.memoryService.recallExtractionHistory(
    `order-${orderId}`,
    'извлечение BOM',
    3
  );
  
  console.log('Найдено похожих извлечений:', pastExtractions.length);
  
  // Используем контекст для улучшения prompt
  const contextPrompt = this.buildPromptWithContext(pastExtractions);
  
  const result = await this.extractBOM(image, contextPrompt);
  
  // Сохраняем новое извлечение
  await this.memoryService.rememberExtraction(
    `order-${orderId}`,
    'BOM',
    result
  );
  
  return result;
}
```

### 3. Сохранение решений AI

```typescript
// Когда AI делает выбор
async processDrawing(orderId: string, drawing: Buffer) {
  const analysis = await this.analyzeDrawing(drawing);
  
  // AI решает какой материал использовать
  const suggestedMaterial = this.selectMaterial(analysis);
  
  // Сохраняем решение
  await this.memoryService.rememberAIDecision(
    `order-${orderId}`,
    `Предложен материал: ${suggestedMaterial}`,
    {
      analysis,
      confidence: 0.92,
      reason: 'Соответствует требованиям прочности',
    }
  );
  
  return suggestedMaterial;
}
```

## 🔗 Кросс-сервисная память

### Сценарий: AI Polygon → ERP Web

```typescript
// AI Polygon извлекает данные
await memoryService.rememberBOMExtraction(
  'company-123',
  'order-456',
  { items: [...], totalCost: 50000 }
);

// Позже в ERP Web
const context = await memoryService.recallCompanyContext(
  'company-123',
  'заказ order-456'
);

// ERP видит что AI Polygon уже обработал этот заказ
console.log('Контекст из AI:', context);
```

### Сценарий: ERP Web → AI Polygon

```javascript
// ERP сохраняет предпочтения клиента
await memoryService.rememberUserAction(
  'user-1',
  'company-123',
  'client_preference',
  { client: 'ООО Рога и Копыта', preferredSteel: '09Г2С' }
);

// AI Polygon использует это при извлечении
const preferences = await memoryService.recallCompanyContext(
  'company-123',
  'предпочтения клиента'
);

// AI учитывает это в prompt
const prompt = `Клиент предпочитает сталь ${preferences[0].preferredSteel}...`;
```

## 🌐 TypeScript клиент (packages/memory-client)

```typescript
import { createMemoryClient } from '@ai-control/memory-client';

const memoryClient = createMemoryClient('http://localhost:8000');

// Добавить память
await memoryClient.addMemory({
  project_id: 'my-project',
  content: 'Пользователь предпочитает краткие ответы',
  metadata: { category: 'preferences' }
});

// Поиск
const memories = await memoryClient.searchMemories({
  project_id: 'my-project',
  query: 'предпочтения пользователя',
  limit: 5
});

console.log('Найдено воспоминаний:', memories.length);
```

## 💡 Лучшие практики

### 1. Структурируйте project_id

```javascript
// ✅ Хорошо - понятная иерархия
project_id: 'company-123'
project_id: 'user-456'
project_id: 'order-789'

// ❌ Плохо - неструктурированно
project_id: 'myproject'
project_id: 'data'
```

### 2. Добавляйте метаданные

```javascript
// ✅ Хорошо - полезные метаданные
metadata: {
  userId: 123,
  action: 'create_order',
  timestamp: new Date().toISOString(),
  category: 'orders',
  service: 'erp-web'
}

// ❌ Плохо - нет метаданных
metadata: {}
```

### 3. Пишите содержательный content

```javascript
// ✅ Хорошо - понятный контекст
content: 'Пользователь Антон создал заказ №456 для клиента "ООО Рога и Копыта" на сумму 50000₽'

// ❌ Плохо - непонятно
content: 'action performed'
```

### 4. Обрабатывайте ошибки

```javascript
// ✅ Хорошо - не падаем если Memory Service недоступен
try {
  await memoryService.rememberUserAction(userId, companyId, action, data);
} catch (error) {
  console.error('Failed to save memory:', error);
  // Продолжаем работу даже если память не сохранилась
}
```

## 🧪 Тестирование

```bash
# Запустить Memory Service локально
cd services/memory-service
python test_server.py

# Проверить из ERP Web
curl -X POST http://localhost:8000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "company-test",
    "content": "Тестовое воспоминание"
  }'

# Поиск
curl -X POST http://localhost:8000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "company-test",
    "query": "тестовое"
  }'
```

## 📚 Дополнительные ресурсы

- [Memory Service README](../services/memory-service/README.md)
- [Memory Service Quickstart](../services/memory-service/QUICKSTART.md)
- [API Documentation](http://localhost:8000/docs) (когда сервис запущен)

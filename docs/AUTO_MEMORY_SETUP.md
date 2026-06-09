# 🤖 Автоматическая интеграция Memory Service

## 🎯 Обзор

Теперь Memory Service работает **автоматически**! При создании нового модуля память автоматически:
- ✅ Сохраняет все действия пользователей
- ✅ Подтягивает контекст из прошлого
- ✅ Обогащает AI промпты историей
- ✅ Синхронизирует события между сервисами

## 📦 Созданные компоненты автоматизации

### 1. Express Middleware (ERP Web)
**Файл**: [apps/erp-web/src/middleware/auto-memory.middleware.js](../apps/erp-web/src/middleware/auto-memory.middleware.js)

**Что делает**:
- Автоматически перехватывает все POST/PUT/PATCH/DELETE запросы
- Извлекает orderId, materialId, customerId, userId, companyId
- Сохраняет в память что было сделано

### 2. NestJS Interceptor (AI Polygon)
**Файл**: [services/ai-polygon/src/memory/memory-context.interceptor.ts](../services/ai-polygon/src/memory/memory-context.interceptor.ts)

**Что делает**:
- Автоматически загружает контекст перед выполнением метода
- Добавляет контекст в `request.memoryContext`
- Сохраняет результат выполнения в память

### 3. AI Context Provider (AI Polygon)
**Файл**: [services/ai-polygon/src/memory/ai-with-memory.provider.ts](../services/ai-polygon/src/memory/ai-with-memory.provider.ts)

**Что делает**:
- Автоматически обогащает AI промпты контекстом из памяти
- Добавляет секцию "КОНТЕКСТ ИЗ ПРОШЛОГО ОПЫТА"
- Сохраняет ответы Claude в память

### 4. Memory Event Bus (ERP Web)
**Файл**: [apps/erp-web/src/services/memory-event-bus.service.js](../apps/erp-web/src/services/memory-event-bus.service.js)

**Что делает**:
- Слушает события системы (order.created, material.added и т.д.)
- Автоматически сохраняет их в память
- Синхронизирует события между модулями

---

## 🚀 Как подключить к существующему коду

### ERP Web - Включить автоматическое middleware

```javascript
// В вашем main server.js или app.js
const { autoMemoryMiddleware } = require('./src/middleware/auto-memory.middleware');

// Добавить ПЕРЕД вашими роутами
app.use(autoMemoryMiddleware);

// Всё! Теперь все POST/PUT/PATCH/DELETE автоматически записываются
```

**Настройки** (опционально):

```javascript
// Отключить автоматическую память
process.env.AUTO_MEMORY_ENABLED = 'false';

// Или настроить в коде
const { AUTO_MEMORY_CONFIG } = require('./src/middleware/auto-memory.middleware');

AUTO_MEMORY_CONFIG.saveActions.GET = true; // Сохранять и GET запросы
AUTO_MEMORY_CONFIG.ignorePaths.push('/api/custom'); // Игнорировать путь
```

---

### AI Polygon - Использовать автоматический контекст

#### Вариант 1: Interceptor (автоматически загружает контекст)

```typescript
// В вашем контроллере или сервисе
import { UseInterceptors } from '@nestjs/common';
import { MemoryContextInterceptor } from './memory/memory-context.interceptor';

@UseInterceptors(MemoryContextInterceptor)
@Controller('bom')
export class BOMController {
  
  @Post('extract')
  async extractBOM(@Req() request, @Body() body) {
    // Контекст автоматически загружен!
    const memories = request.memoryContext;
    
    console.log(`Найдено ${memories.length} воспоминаний`);
    
    // Ваша логика
    const result = await this.extractionService.extract(body.image);
    
    // Результат автоматически сохранится в память!
    return result;
  }
}
```

#### Вариант 2: AI Provider (автоматически обогащает промпты)

```typescript
// В вашем сервисе
import { AIWithMemoryProvider } from './memory/ai-with-memory.provider';

export class ExtractionService {
  constructor(private aiWithMemory: AIWithMemoryProvider) {}
  
  async extractBOM(orderId: string, image: Buffer) {
    const prompt = 'Извлеки BOM из этого чертежа';
    
    // AI автоматически получит контекст из памяти!
    const { response, enrichedPrompt } = await this.aiWithMemory.askClaudeWithMemory(
      prompt,
      {
        projectId: 'company-123',
        orderId: orderId,
        includeMemoryContext: true, // ← включить автоматический контекст
        memoryLimit: 5,
      }
    );
    
    console.log(`Использовано ${enrichedPrompt.memories.length} воспоминаний`);
    console.log(`Контекст добавлен: ${enrichedPrompt.contextAdded}`);
    
    return response;
  }
}
```

---

### Event Bus - Автоматическая синхронизация событий

```javascript
// В вашем контроллере/сервисе
const memoryEventBus = require('./services/memory-event-bus.service');

// При создании заказа
router.post('/orders', async (req, res) => {
  const order = await createOrder(req.body);
  
  // Просто отправьте событие - оно автоматически сохранится в память!
  memoryEventBus.emitOrderCreated(
    order.id,
    req.user.companyId,
    {
      customerName: req.body.customerName,
      totalAmount: order.totalAmount,
    }
  );
  
  res.json(order);
});

// При добавлении материала
router.post('/materials', async (req, res) => {
  const material = await addMaterial(req.body);
  
  // Автоматически сохранится в память
  memoryEventBus.emitMaterialAdded(
    material.id,
    req.user.companyId,
    {
      name: material.name,
      quantity: material.quantity,
      supplier: material.supplier,
    }
  );
  
  res.json(material);
});
```

---

## 💡 Примеры реального использования

### Пример 1: Новый модуль автоматически получает память

**Создаёте новый роут** в ERP Web:

```javascript
// apps/erp-web/src/routes/shipments.routes.js
router.post('/shipments', async (req, res) => {
  const shipment = await createShipment(req.body);
  
  // Автоматически сохранится middleware!
  // Ничего не нужно добавлять вручную
  
  res.json(shipment);
});
```

**Память автоматически запишет**:
```
"Пользователь 123 выполнил: POST /api/shipments. Заказ: 456 (успешно)"
```

---

### Пример 2: AI автоматически видит контекст

**AI Polygon обрабатывает чертёж**:

```typescript
@UseInterceptors(MemoryContextInterceptor)
@Post('extract')
async extractDrawing(@Body() body) {
  // Interceptor автоматически загрузил контекст!
  // request.memoryContext уже содержит историю заказа
  
  const result = await this.extract(body.image);
  
  // Interceptor автоматически сохранит результат!
  return result;
}
```

**AI видит в промпте**:
```
=== КОНТЕКСТ ИЗ ПРОШЛОГО ОПЫТА ===

1. Заказ создан для клиента "ООО Завод"
2. Клиент предпочитает сталь 09Г2С
3. Прошлый чертёж был толщиной 10мм

=== ТЕКУЩАЯ ЗАДАЧА ===

Извлеки BOM из этого чертежа
```

---

### Пример 3: Event Bus синхронизирует всё

```javascript
// В ERP Web - создание заказа
memoryEventBus.emitOrderCreated(orderId, companyId, orderData);
// ↓ автоматически сохраняется в память

// В AI Polygon - извлечение BOM
memoryService.rememberBOMExtraction(companyId, orderId, bomData);
// ↓ автоматически доступно в ERP

// В ERP Web - запрос контекста
const context = await memoryService.recallCompanyContext(companyId, `заказ ${orderId}`);
// ↓ видит ВСЁ: создание заказа + извлечение BOM!
```

---

## 🔧 Настройка в новом модуле

### Шаг 1: Добавить middleware (ERP Web)

```javascript
// server.js
const { autoMemoryMiddleware } = require('./src/middleware/auto-memory.middleware');

app.use(autoMemoryMiddleware); // ← Одна строка!
```

### Шаг 2: Добавить MemoryModule (AI Polygon / NestJS)

```typescript
// app.module.ts
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [
    MemoryModule, // ← Добавить модуль
    // ... остальные
  ],
})
export class AppModule {}
```

### Шаг 3: Использовать Event Bus (опционально)

```javascript
// В любом сервисе
const memoryEventBus = require('./services/memory-event-bus.service');

// Отправлять события
memoryEventBus.emitOrderCreated(orderId, companyId, data);
memoryEventBus.emitMaterialAdded(materialId, companyId, data);

// Или создать свои события
memoryEventBus.on('custom.event', async ({ data }) => {
  await memoryService.rememberUserAction(...);
});
```

---

## 📊 Как это работает под капотом

```
┌─────────────────────────────────────────────────────────┐
│  Пользователь создаёт заказ в ERP                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ Auto Memory         │
         │ Middleware          │ ─► Сохраняет в Memory Service
         └─────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ Event Bus           │
         │ emitOrderCreated()  │ ─► Уведомляет подписчиков
         └─────────────────────┘
                   │
      ┌────────────┴────────────┐
      ▼                         ▼
┌──────────┐            ┌──────────────┐
│  Memory  │            │ AI Polygon   │
│  Service │            │  слышит      │
│  сохранил│            │  событие     │
└──────────┘            └──────┬───────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Memory Context      │
                    │ Interceptor         │ ─► Загружает контекст
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ AI with Memory      │
                    │ Provider            │ ─► Обогащает промпт
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Claude видит весь   │
                    │ контекст заказа!    │
                    └─────────────────────┘
```

---

## ✅ Итого - что теперь автоматически

| Что | Раньше | Теперь |
|-----|--------|--------|
| **Сохранение действий** | Вручную в каждом роуте | ✅ Автоматически middleware |
| **Загрузка контекста** | Вручную перед AI вызовом | ✅ Автоматически interceptor |
| **Обогащение промптов** | Вручную строить промпт | ✅ Автоматически AI Provider |
| **Синхронизация событий** | Вручную вызывать сервис | ✅ Автоматически Event Bus |
| **Новый модуль** | Добавлять интеграцию | ✅ Работает сразу! |

---

## 🎯 Следующие шаги

### 1. Включить в ERP Web

```javascript
// server.js
const { autoMemoryMiddleware } = require('./src/middleware/auto-memory.middleware');
app.use(autoMemoryMiddleware);
```

### 2. Включить в AI Polygon

```typescript
// app.module.ts
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [MemoryModule],
  // ...
})
```

### 3. Использовать Event Bus

```javascript
const memoryEventBus = require('./services/memory-event-bus.service');
memoryEventBus.emitOrderCreated(orderId, companyId, data);
```

### 4. Использовать AI с памятью

```typescript
const result = await this.aiWithMemory.askClaudeWithMemory(
  prompt,
  { projectId, orderId, includeMemoryContext: true }
);
```

**Готово! Теперь память работает автоматически!** 🎉

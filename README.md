# AI Control Center

Unified monorepo for ERP system, AI services, and Telegram assistants.

## 🏗️ Architecture

This monorepo contains:

- **ERP System** (`apps/erp-web`) - Production management system (Node.js)
- **AI Polygon** (`services/ai-polygon`) - AI extraction & analysis services (NestJS)
- **Memory Service** (`services/memory-service`) - Vector memory with Mem0 & Qdrant (Python)
- **Telegram Bot** (`apps/telegram-bot`) - Telegram assistants (TypeScript)
- **Shared Packages** (`packages/*`) - Common utilities, types, and configurations

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Python 3.11+ (for memory service)

### Installation

```bash
# Clone repository
git clone git@github.com:kripakrip88/ai-control-center.git
cd ai-control-center

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
pnpm db:generate

# Start all services with Docker
pnpm docker:up
```

### Development

```bash
# Start all Node.js services in watch mode
pnpm dev

# Start individual services
pnpm dev:erp    # ERP system only
pnpm dev:ai     # AI service only

# Database operations
pnpm db:migrate  # Run migrations
pnpm db:studio   # Open Prisma Studio

# Build all services
pnpm build

# Run tests
pnpm test
```

## 📦 Package Structure

```
ai-control-center/
├── apps/                    # User-facing applications
│   ├── erp-web/            # ERP system
│   └── telegram-bot/       # Telegram bots
├── services/               # Backend microservices
│   ├── ai-polygon/         # AI extraction service
│   └── memory-service/     # Vector memory service
├── packages/               # Shared Node.js libraries
│   ├── shared-types/       # TypeScript types
│   ├── database/           # Prisma schemas
│   ├── auth/              # Authentication
│   ├── shared-config/      # Configuration
│   ├── event-bus/          # Event system
│   └── api-client/         # Inter-service clients
├── python-packages/        # Shared Python libraries
│   ├── shared-types/       # Python type definitions
│   └── memory-client/      # Memory service client
├── infra/                  # Infrastructure
│   └── docker/            # Docker Compose configs
└── scripts/               # Utility scripts
```

## 🔧 Technology Stack

**Backend:**
- Node.js 20 (ERP, Telegram bots)
- NestJS (AI services)
- Python 3.11 (Memory service)
- PostgreSQL 15 (Primary database)
- Prisma ORM

**AI/ML:**
- Anthropic Claude API
- Ollama (Local LLM)
- Qdrant (Vector database)
- Mem0 (Memory management)
- Tesseract OCR

**Infrastructure:**
- Docker & Docker Compose
- pnpm workspaces
- GitHub Actions (CI/CD)
- Nginx (Reverse proxy)

## 🌐 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| ERP Web | 3000 | Main ERP application |
| AI Polygon | 4000 | AI extraction service |
| Memory Service | 8000 | Vector memory API |
| Telegram Bot | 3001 | Bot webhook server |
| PostgreSQL | 5432 | Database |
| Qdrant | 6333 | Vector database |
| Ollama | 11434 | Local LLM |
| n8n | 5678 | Workflow automation |
| Nginx | 80/443 | Reverse proxy |

## 📚 Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [Development Guide](docs/development/setup.md)
- [API Documentation](docs/api/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Migration Guide](docs/migration/migration-guide.md)

## 🔐 Environment Variables

See [.env.example](.env.example) for all required environment variables.

Critical variables:
- `ANTHROPIC_API_KEY` - Claude API key
- `JWT_SECRET` - Authentication secret
- `POSTGRES_PASSWORD` - Database password
- `TELEGRAM_BOT_TOKEN` - Telegram bot token

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific service
pnpm --filter erp-web test
pnpm --filter ai-polygon test

# Integration tests
pnpm test:integration
```

## 🚢 Deployment

```bash
# Build Docker images
pnpm docker:build

# Deploy to production
# (GitHub Actions handles this automatically on push to main)

# Manual deployment
bash scripts/deploy.sh production
```

## 📝 Contributing

1. Create feature branch from `develop`
2. Make changes
3. Run tests: `pnpm test`
4. Commit with conventional commit format
5. Create Pull Request

## 📄 License

Proprietary - All rights reserved

## 👥 Team

- **Anton Karneev** - Project Lead
- PMK Park & DV Lab

## 🔗 Related Repositories

This monorepo consolidates:
- [erp-metal](https://github.com/kripakrip88/erp-metal)
- [metalpro-ai-polygon](https://github.com/kripakrip88/metalpro-ai-polygon)
- [ai-memory](https://github.com/kripakrip88/ai-memory)
